# Meal Plan App - Project File Map

*Last updated: September 28, 2025*

## 📁 Project Structure Overview

```
Meal-plan/
├── 🎯 ROOT CONFIG & DOCS
├── 🔧 BACKEND (Python/FastAPI)
├── 🎨 FRONTEND (React/TypeScript)
├── 📋 TASKS & DOCUMENTATION
└── 🧠 MEMORY BANK
```

---

## 🎯 Root Configuration & Documentation

| File | Purpose | Key Features |
|------|---------|--------------|
| `README.md` | Project overview and setup instructions | Main documentation |
| `CLAUDE.md` | Claude Code specific instructions | Development guidelines |
| `.claude/settings.local.json` | Claude Code local settings | IDE configuration |

---

## 🔧 Backend (Python/FastAPI)

### 📋 Core Files
| File | Purpose | Key Features |
|------|---------|--------------|
| `main.py` | FastAPI app entry point | CORS, routers, health checks |
| `models.py` | Pydantic data models | HouseholdProfile, Member, enums |
| `database.py` | Supabase connection | Database client setup |
| `schema.sql` | Database schema | Table definitions |
| `chat.py` | **Three-agent AI architecture** | Interface, Admin, Menu agents |

### 🛣️ API Routes (`routes/`)
| File | Endpoints | Purpose |
|------|-----------|---------|
| `chat.py` | `/chat/*` | Chat sessions, onboarding, weekly planning |
| `household.py` | `/household/*` | Profile creation, retrieval, updates |
| `meal_plans.py` | `/meal-plans/*` | **Three-agent meal generation** |
| `recipes.py` | `/recipes/*` | Recipe development and adaptation |
| `grocery.py` | `/grocery/*` | Grocery list generation |

### 🎯 Services (`services/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `household_service.py` | Profile management | CRUD operations |
| `meal_planning_service.py` | Meal planning logic | Plan generation |
| `recipe_service.py` | Recipe operations | Recipe CRUD |
| `grocery_service.py` | Grocery list logic | List generation |

---

## 🎨 Frontend (React/TypeScript)

### 🏠 Core App Files
| File | Purpose | Key Features |
|------|---------|--------------|
| `src/App.tsx` | Main app component | Tab navigation, auth |
| `src/main.tsx` | React entry point | Provider setup |
| `src/vite-env.d.ts` | TypeScript definitions | Vite types |

### 🧠 Context & State (`src/context/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `AppContext.tsx` | **Global app state** | Tab management, meal plans, profiles |
| `AuthContext.tsx` | Authentication state | Supabase auth integration |

### 🎨 Core Components (`src/components/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `TabNavigation.tsx` | App navigation | Tab switching UI |
| `TabContent.tsx` | Tab content wrapper | Dynamic tab rendering |
| `AuthModal.tsx` | Authentication modal | Login/signup interface |
| `ErrorBoundary.tsx` | Error handling | React error boundaries |

### 🤖 AI Agents (`src/components/agents/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `OnboardingAgent.tsx` | Profile setup chat | Household data collection |
| `WeeklyPlanningAgent.tsx` | **Three-agent workflow** | Weekly schedule → meal plans |
| `MealPlanAgent.tsx` | Meal plan interactions | Plan modifications |

### 📱 Tab Components (`src/components/tabs/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `HomeTab.tsx` | **Main dashboard** | Agent orchestration, navigation |
| `MealPlanTab.tsx` | Meal plan display | Weekly calendar view |
| `GroceryTab.tsx` | Grocery lists | Shopping list management |
| `ProfileTab.tsx` | Profile management | Household editing |

### 🔧 Shared Components (`src/components/shared/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `ChatInterface.tsx` | **Reusable chat UI** | Message display, input handling |

### 🔌 Services & Utils (`src/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `services/api.ts` | **API client** | Backend communication |
| `lib/supabase.ts` | Supabase client | Database connection |
| `types/index.ts` | TypeScript types | Shared type definitions |

### ⚙️ Configuration
| File | Purpose | Key Features |
|------|---------|--------------|
| `package.json` | Dependencies & scripts | React, TypeScript, Vite |
| `vite.config.ts` | Vite configuration | Build settings |
| `tsconfig*.json` | TypeScript config | Compiler settings |

---

## 📋 Tasks & Documentation (`tasks/`)

### 📋 Project Management
| File | Purpose | Key Features |
|------|---------|--------------|
| `current-todos.md` | **Active task tracking** | Completed & pending work |
| `meal-plan-prd.md` | Product requirements | Feature specifications |
| `tech_stack.md` | Technology choices | Architecture decisions |

### 🤖 Agent Documentation (`tasks/agents/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `OnboardingAgent.md` | Onboarding flow | Profile setup process |
| `WeeklyPlanningAgent.md` | **Three-agent architecture** | Workflow documentation |
| `MealPlanAgent.md` | Meal plan interactions | Plan management |
| `RecipeAgent.md` | Recipe operations | Recipe development |
| `AgentIntegration.md` | Agent coordination | Integration patterns |

### 🛠️ Development Guides
| File | Purpose | Key Features |
|------|---------|--------------|
| `AGENT_PRINCIPLES.md` | AI agent guidelines | Development principles |
| `context_engineering.md` | Context management | AI context strategies |
| `ai-sdk-message-persistance.md` | **Message persistence** | AI SDK implementation |

### 📂 Task Archives (`tasks/*/`)
| Folder | Purpose | Status |
|--------|---------|--------|
| `environment-setup/` | Initial setup docs | Completed |
| `fix-household-profile-creation/` | Profile bug fixes | Completed |
| `four-tab-redesign/` | UI restructure | Completed |
| `Sample convos/` | Example interactions | Reference |

---

## 🧠 Memory Bank (`memory-bank/`)

| File | Purpose | Key Features |
|------|---------|--------------|
| `projectbrief.md` | High-level overview | Project goals |
| `progress.md` | Development timeline | Milestone tracking |
| `activeContext.md` | Current context | Active development |
| `systemPatterns.md` | Architecture patterns | Design principles |

---

## 🔑 Key Architecture Points

### **Three-Agent Meal Planning System**
Located in: `backend/chat.py` + `frontend/src/components/agents/WeeklyPlanningAgent.tsx`
- **Interface Agent**: User conversation & weekly schedule
- **Admin Agent**: Constraint parsing & structured data
- **Menu Generation Agent**: Balanced meal plan creation

### **Global State Management**
Located in: `frontend/src/context/AppContext.tsx`
- Tab navigation
- Meal plan persistence
- Profile management
- Cross-component communication

### **API Integration**
Located in: `frontend/src/services/api.ts` + `backend/routes/`
- RESTful API design
- React Query integration
- Error handling
- Type-safe communication

### **Chat Interface System**
Located in: `frontend/src/components/shared/ChatInterface.tsx`
- Reusable across all agents
- Message persistence
- Real-time updates
- Inline content display

---

## 🚀 Deployment Architecture

- **Frontend**: Vercel (`meal-plan-app-three.vercel.app`)
- **Backend**: Railway (`meal-plan-app-production.up.railway.app`)
- **Database**: Supabase (hosted PostgreSQL)
- **AI**: OpenAI GPT-4o-mini

---

## 🎯 Recent Major Updates (Sept 28, 2025)

1. **Three-Agent Architecture** - Sophisticated meal planning workflow
2. **Chat UX Improvements** - Fixed duplicates, inline meal plans
3. **AI Accuracy** - Constraint-following, no hallucination
4. **State Persistence** - Proper meal plan storage & navigation

*Commit: `0947aed` - "Fix chat duplicate messages and meal plan generation issues"*