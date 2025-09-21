---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

Given the context provided as an argument, do this:

1. Run `.specify/scripts/bash/check-task-prerequisites.sh --json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.
  **NAMING CONVENTION**: 
  - branch_name has 'feature/' prefix (e.g., "feature/001-authentication-system")
  - feature_name is the numbered plain name without prefix (e.g., "001-authentication-system")
2. **Branch Verification**: 
   - CRITICAL: Verify you are on the correct feature branch (with 'feature/' prefix) before proceeding with file operations
   - Use `git branch --show-current` to verify current branch  
   - If not on feature branch, checkout: `git checkout feature/{number}-{name}`
   - **CRITICAL GIT FIX**: After checkout, run `git status` to refresh Git working directory cache (primary fix)
   - Optional: Brief delay for filesystem consistency on slower systems
   - NEVER create task files on main branch
3. Load and analyze available design documents:
   - Always read plan.md for tech stack and libraries
   - IF EXISTS: Read data-model.md for entities
   - IF EXISTS: Read contracts/ for API endpoints
   - IF EXISTS: Read research.md for technical decisions
   - IF EXISTS: Read quickstart.md for test scenarios

   Note: Not all projects have all documents. For example:
   - CLI tools might not have contracts/
   - Simple libraries might not need data-model.md
   - Generate tasks based on what's available

4. Generate tasks following the template:
   - Use `.specify/templates/tasks-template.md` as the base
   - Replace example tasks with actual tasks based on:
     * **Setup tasks**: Project init, dependencies, linting
     * **Test tasks [P]**: One per contract, one per integration scenario
     * **Core tasks**: One per entity, service, CLI command, endpoint
     * **Integration tasks**: DB connections, middleware, logging
     * **Polish tasks [P]**: Unit tests, performance, docs

5. Task generation rules:
   - Each contract file → contract test task marked [P]
   - Each entity in data-model → model creation task marked [P]
   - Each endpoint → implementation task (not parallel if shared files)
   - Each user story → integration test marked [P]
   - Different files = can be parallel [P]
   - Same file = sequential (no [P])

6. Order tasks by dependencies:
   - Setup before everything
   - Tests before implementation (TDD)
   - Models before services
   - Services before endpoints
   - Core before integration
   - Everything before polish

7. Include parallel execution examples:
   - Group [P] tasks that can run together
   - Show actual Task agent commands

8. Create FEATURE_DIR/tasks.md with:
   - Correct feature name (numbered, no prefix) from implementation plan
   - Numbered tasks (T001, T002, etc.)
   - Clear file paths for each task
   - Dependency notes
   - Parallel execution guidance

9. **Final Commit**: After completing the tasks breakdown, commit the changes:
   - CRITICAL: Ensure you're still on feature branch before committing
   - Run `git add .`
   - Run `git commit -m "Complete task breakdown for [feature_name]"` (use numbered feature_name, not branch name)
   - **CRITICAL GIT FIX**: After commit, run `git status` to refresh Git working directory cache and prevent untracked file bug
   - NEVER commit global files on feature branch

10. **Workflow Completion**: 
    - After completing all three phases (specify → plan → tasks), the spec is ready
    - Agent should return to main branch: `git checkout main`
    - **CRITICAL GIT FIX**: After checkout, run `git status` to refresh Git working directory cache (primary fix)
    - Optional: Brief delay for filesystem consistency: `sleep 0.05`
    - Verify clean state: `git status --porcelain` (should be empty)
    - Update global files (execution-plan.json, mvp-plan.md) on main if needed
    - Proceed to next feature only after current spec is complete

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context. Always verify branch and commit after completing all three phases (specify → plan → tasks) before moving to next spec.
