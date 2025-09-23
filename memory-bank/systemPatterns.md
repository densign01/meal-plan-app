# System Patterns - Meal Plan Assistant

## Architecture Overview
Multi-agent system following the Orchestrator pattern with domain-scoped agents.

## Core Agents

### 1. Orchestrator Agent
- **Role**: Intent parsing, routing, response merging, guardrail enforcement
- **Responsibilities**:
  - Parse user intent from conversational input
  - Route to appropriate domain agents
  - Merge responses into coherent output
  - Enforce allergen/time/budget constraints

### 2. Onboarding & Household Agent
- **Role**: Household profile management
- **Responsibilities**:
  - Conversational onboarding flow
  - Household member management
  - Dietary restrictions and preferences
  - Cooking skill level and equipment
  - Budget preferences

### 3. Meal Planning Agent
- **Role**: Recipe retrieval and meal plan generation
- **Responsibilities**:
  - Weekly context interpretation
  - Recipe selection and generation
  - Meal plan optimization (variety, constraints)
  - Time and skill matching

### 4. Grocery Agent
- **Role**: Grocery list generation and optimization
- **Responsibilities**:
  - Ingredient extraction and parsing
  - Deduplication and combining
  - Store section organization
  - Export formatting

## Component Relations
```
Frontend (React) → FastAPI Backend → Agent Router → Domain Agents
                                   ↓
                              Supabase Database
                                   ↓
                              Memory Bank (Markdown)
```

## Key Decisions
1. **Agent Communication**: REST API endpoints per agent domain
2. **Memory**: Markdown files + database for structured data
3. **AI Integration**: OpenAI GPT-4o-mini for conversation and planning
4. **Frontend**: React web app (not mobile for MVP)