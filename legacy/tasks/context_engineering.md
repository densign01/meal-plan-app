# Multi-step approach to Context Engineering

> **Location**: This file and `tech_stack.md` live in `./tasks/`.

0. Tasks
- Operating on a task basis. Store all intermediate context in markdown files in tasks/<task-id>/ folders.
- Use semantic task id slugs
- Reference the default stack in [tech_stack.md](./tech_stack.md) before making technical decisions.

1. Research
- Find existing patterns in this codebase
- Search internet if relevant
- Start by asking follow up questions to set the direction of research
- Report findings in research.md file

2. Planning
- Read the research.md in tasks for <task-id>.
- Based on the research come up with a plan for implementing the user request. We should reuse existing patterns, components and code where possible.
- If needed, ask clarifying questions to user to understand the scope of the task
- Write the comprehensive plan to plan.md. The plan should include all context required for an engineer to implement the feature.

3. Implementation
a. Read. plan.md and create a todo-list with all items, then execute on the plan.
b. Go for as long as possible. If ambiguous, leave all questions to the end and group them.
