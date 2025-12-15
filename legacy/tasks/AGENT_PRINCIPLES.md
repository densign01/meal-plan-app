# AGENT_PRINCIPLES.md
Guiding principles for building multi-agent apps (applies to the Meal Planning app and future products). Incorporates persistent-memory practices inspired by Cline Memory Bank. Keep this file in the repo root and evolve it.

---

## 1) System Pattern (High-Level)
- **Interaction Layer (Orchestrator)**: one conversational surface; parses intent; routes; merges results; enforces guardrails.
- **Execution Agents**: domain-scoped workers with their own tools and memory (e.g., Pantry, Recipes, Scheduler, Nutrition, Grocery, Pricing, Feedback).
- **Tasks & Triggers**: reusable workflows (e.g., “Generate Weekly Plan”) on schedules (e.g., Sun 4pm) or events (calendar change, pantry update).
- **Memory as a First-Class Asset**: structured, versioned, and auditable. Agents read memory at task start and update it on completion.

---

## 2) Core Agents (Meal-Planning Example)
- **Orchestrator**: intent parsing; routing; merge responses; conflict checks (allergens/time/budget).
- **Onboarding & Household**: household profile; members; allergies; dislikes; skill level; appliances; budget.
- **Pantry/Inventory**: pantry state; expirations; substitutions; receipt/vision ingestion.
- **Recipe Retrieval & Generation**: retrieve-first, generate-second; normalize steps/ingredients/timings; scale servings.
- **Constraints & Scheduler**: convert calendar + constraints into plans (variety, leftovers, prep time).
- **Nutrition & Macros**: per-person macros; flags; simple adjustments.
- **Grocery & Fulfillment**: dedup list; map to SKUs; estimate price; build cart.
- **Pricing & Budget**: compare stores; smart swaps; budget adherence.
- **Feedback & Learning**: capture ratings, prep time variance; bias future plans.

---

## 3) Memory Architecture (Repo-Native)
Adopt a small set of Markdown files under `memory-bank/` that agents read at task start and update after changes. Structure adapted from Cline Memory Bank (concepts summarized)

```
memory-bank/
  projectbrief.md        # project scope & goals (stable)
  productContext.md      # why it exists; target UX
  systemPatterns.md      # architecture; key decisions; component relations
  techContext.md         # stack; setup; constraints; dependencies
  activeContext.md       # current focus; recent changes; next steps; open decisions
  progress.md            # status; what works; known issues; decision log
  features/              # optional: deeper specs (e.g., grocery-fulfillment.md)
  integrations/          # optional: API specs, auth, rate limits
  testing/               # optional: scenarios; golden sets
```

**Rules**
- Agents **must** read relevant memory files at task start and **must** update `activeContext.md` and `progress.md` after material changes (plan approved, schema updated, new retailer added).
- Summarize older details; keep stable truths in `projectbrief.md` / `systemPatterns.md`; keep volatile, “now” details in `activeContext.md`.
- Treat memory as the single source of truth for continuity across sessions/tools/models. (Derived from Memory Bank operating mode and workflows.)

---

## 4) Development Workflow (Plan/Act Loop)
- **Plan Mode**: Read memory → verify context → propose strategy → confirm tasks.
- **Act Mode**: Check memory → execute → write minimal diffs back to memory (`activeContext.md`, `progress.md`) → link PR/commit.
- Trigger **“update memory bank”** when new patterns emerge, major changes ship, or context drifts.

---

## 5) Data Model (Starter)
- `households(id, name, timezone, budget_monthly, created_at)`
- `members(id, household_id, name, age, dietary_flags, allergies, dislikes, goals_json)`
- `pantry_items(id, household_id, ingredient_id, qty, unit, expires_at, source)`
- `recipes(id, title, steps_json, ingredients_json, tags[], cook_time_min, diet_flags, nutrition_json, embedding vector)`
- `plans(id, household_id, week_start, plan_json, macros_json, budget_estimate_cents, status)`
- `plan_meals(id, plan_id, day, meal_type, recipe_id, persons_json, notes)`
- `grocery_lists(id, plan_id, store, items_json, price_estimate_cents, status)`
- `feedback(id, plan_meal_id, rating, notes, actual_time_min, substitutions_json)`

---

## 6) Tasks (Reusable Workflows)
- **Generate Weekly Plan**: read household, calendar, pantry, budget → propose plan → validate (allergens/macros/budget) → approve → produce grocery list → optional cart.
- **Day-Of Fast Path**: “20-minute, low-carb, uses chicken + broccoli” → re-rank by fit/pantry/time → output steps/timers.
- **Swap/Repair**: late constraint (e.g., “Kid eats out Tue”) → recompute deltas and update list/cart.
- **Grocery Fulfillment**: map ingredients→SKUs; show price deltas; cart create; expose constraints (brand locks, aisle grouping).

---

## 7) Guardrails
- Allergens: hard blocks and explicit warnings.
- Food safety: temps and storage guidance when relevant.
- Budget transparency: show assumptions and ranges.
- Provenance: label generated vs retrieved recipes.

---

## 8) KPIs & QA
- Planning: time-to-first-plan, approval rate, swap rate.
- Nutrition: macro target adherence per week.
- Cost: variance vs budget; savings from substitutions.
- Delight: avg meal rating; D30 retention; weekly active plans.
- Ops: p50/p95 latency; tokens/$ per plan; tool-call count.
- **Golden Sets**: 50 canonical weeks with “expected” outputs; edge cases (allergies, 15-min week, vegetarian guests, no-oven weeks).

---

## 9) Cost & Latency Controls
- Retrieve→adapt before generate.
- Cache embeddings & candidate sets per household.
- Batch nutrition/pricing lookups.
- Use smaller models for ranking; reserve larger models for final plan.
- Parallelize with a hard fan-out cap; timebox tool calls; degrade gracefully.

---

## 10) Tech & Product Links
- Vercel AI SDK: https://sdk.vercel.ai/
- Supabase: https://supabase.com/
- Railway: https://railway.app/
- Walmart Developer: https://developer.walmart.com/
- Kroger API: https://developer.kroger.com/
- Edamam Nutrition API: https://developer.edamam.com/
- Spoonacular Food API: https://spoonacular.com/food-api

---

## 11) Implementation Notes (Prompts & Contracts)
- **Orchestrator (system)**: “Parse intent; select agents; enforce allergies/time/budget; return concise, stepwise outputs; cite changes to memory.”
- **Scheduler (system)**: “Minimize prep on busy days; maximize reuse/leftovers; meet macros/guest rules; explain tradeoffs briefly.”
- **Nutrition (system)**: “Compute per-person macros from canonical db; flag >15% deviations; suggest one-ingredient adjustments.”

**Tool Contracts** (sketch)
```ts
type ToolCall<TArgs, TOut> = (args: TArgs) => Promise<TOut>;

interface GroceryMapArgs { items: Array<{ name: string; qty: number; unit: string }>; store: string; }
interface GroceryMapOut  { skus: Array<{ sku: string; item: string; qty: number; price: number }>; total: number; }

interface PriceCompareArgs { skus: string[]; stores: string[]; }
interface PriceCompareOut  { byStore: Record<string, { total: number; diffFromMin: number }>; }
```

---

## 12) Memory Operating Procedure (Strict)
1) At task start, agents read `memory-bank/*` **relevant** files.
2) If gaps exist, agent writes a short section under `activeContext.md` → `Open Questions` and proceeds with safe defaults.
3) On material change, agent appends a succinct diff in:
   - `activeContext.md` → current focus / changes / next steps
   - `progress.md` → status / known issues / decision log
4) When prompted “update memory bank,” review **all** memory files; rebalance what is stable vs volatile; prune/merge as needed.

---

## 13) Tradeoffs (Pros/Cons)
- **Pros**: clear boundaries; safer allergen handling; cost isolation; testable modules; deterministic memory trail.
- **Cons**: more orchestration; cross-agent memory consistency; baseline latency if over-fan-out; maintenance overhead for docs.

---

## 14) Roadmap (Mapping)
- **MVP**: Onboarding & Household; Scheduler; Recipe Retrieval (retrieve-first); Nutrition; Grocery List (no pricing); weekly trigger.
- **Beta**: Pantry tracking + receipts/vision; Pricing for 1–2 retailers; feedback loops; budget adherence.
- **Public**: Multi-store compare; advanced substitutions; community recipes w/ moderation.

---

## 15) References
- Cline Memory Bank (concept & file workflow): https://docs.cline.bot/prompting/cline-memory-bank
