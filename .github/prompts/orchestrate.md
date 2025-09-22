# Project Development Orchestrator

This document describes the orchestration workflow for transitioning a project from concept to implementation-ready tasks using Spec-Driven Development. It covers both greenfield (new) and brownfield (existing) projects, focusing on feature identification, dependency planning, and strict workflow enforcement.

---

## Overview

This workflow analyzes your project state, identifies required features, creates dependency graphs, and executes the complete spec-driven workflow for each feature.

**Brownfield Projects:** Prioritize constitutional compliance and completion of existing work.  
**Greenfield Projects:** Focus on feature identification and dependency planning.

---

## Execution Steps

### 1. Initialize Project Planning
- Run `.specify/scripts/bash/orchestrate.sh --json "$ARGUMENTS"` from repo root
- Parse JSON output for: ORCHESTRATION_PLAN_FILE, EXECUTION_PLAN, SPECS_DIR, PROJECT_TYPE, PROJECT_STATE, STATUS
- All file paths must be absolute

### 2. Analyze Project State
**Greenfield:** No existing src/, tests/, or docs/ folders
- Proceed with standard orchestration planning
- Create new features from scratch
**Brownfield:** Existing implementation detected
- Compare PROJECT_STATE against constitution.md requirements
- Identify gaps between constitutional principles and current implementation
- Focus on missing features and constitutional compliance gaps
- Account for incomplete features (partial task completion)

### 3. Constitutional Analysis (Brownfield Only)
- Review PROJECT_STATE.constitutional_gaps for violations
- Check PROJECT_STATE.incomplete_features for unfinished work
- Prioritize constitutional compliance issues (e.g., missing tests if Test-First required)
- Identify implementation gaps vs constitutional requirements

### 4. Feature Planning Based on Project Type
**Greenfield:**
- Identify Product features (core functionality)
- Identify Full Product features (enhancements)
- Create feature dependency graph
**Brownfield:**
- Review existing specs from PROJECT_STATE.existing_specs
- Complete incomplete features first
- Fill constitutional gaps
- Add missing Product features
- Plan Full Product features on top of existing + Product baseline

### 5. Update Product Plan
- Load ORCHESTRATION_PLAN_FILE and replace placeholders with actual analysis
- **Greenfield:** Organize new features by priority: Product (P1) → Full Product (P2) → Advanced (P3)
- **Brownfield:**
	- Mark completed features as [DONE]
	- Mark incomplete features as [IN PROGRESS]
	- Mark constitutional gaps as [CRITICAL]
	- Add new Product features as [TODO]
- Define clear dependencies between features
- Mark which features can be developed in parallel [P]

### 6. Execute Workflow for Each Feature

**CRITICAL WORKFLOW RULES:**
- **Branch Management:**
	- Always verify current branch before file operations
	- Global files (orchestration-plan.md, execution-plan.json, specify-request.md) ONLY on main branch
	- Spec files (spec.md, plan.md, tasks.md) ONLY on feature branches
	- Complete each spec fully (specify → plan → tasks) before moving to next
	- Always return to main branch after completing a spec
- **Commit Pattern:**
	- Commit after each phase: "Complete {phase} for {feature_name}"
	- Use numbered feature_name (e.g., "001-authentication") not branch_name
	- After every commit, run `git status` to refresh Git working directory cache
- **No Implementation:**
	- Workflow STOPS at tasks generation—implementation NEVER executed
- **Branch Numbering:**
	- Use next_branch_number from project state analysis
	- Format: feature/{number:03d}-{feature-name}
	- Track numbers in execution-plan.json

**STRICT BRANCH WORKFLOW REQUIREMENTS:**
- Complete each spec fully before moving to next
- Always verify current branch before file operations
- Use `git checkout main` for global files, `git checkout feature/{number}-{name}` for spec files
- After every checkout, run `git status` to refresh cache
- Naming: feature_name (numbered, no prefix), branch_name (feature/ prefixed)

**Priority Order – Breadth-First Level Completion:**
**Brownfield:**
1. Phase 0 (CRITICAL): Constitutional compliance gaps
2. Phase 1: Finish incomplete_features
3. Level 1: Complete ALL Level 1 specs before Level 2
4. Level 2: Complete ALL Level 2 specs before Level 3
5. Level 3: Advanced features
**Greenfield:**
1. Level 1: Complete ALL Level 1 specs before Level 2
2. Level 2: Complete ALL Level 2 specs before Level 3
3. Level 3: Advanced features

**Level Gate Enforcement:**
- Must validate 100% completion of current level before next
- No level jumping
- Parallel development within same level allowed
- Completion verification: all specs in current level must complete spec → plan → tasks
- Auto-level detection based on dependencies

**Level Assignment Example:**
Level 1: 001-user-auth, 002-core-api, 003-database-schema
Level 2: 004-user-profile, 005-payment-system, 006-order-management
Level 3: 007-analytics, 008-ml-recommendations, 009-admin-dashboard

**Breadth-First Strategy Benefits:**
- Architectural stability
- Early validation
- Risk reduction
- Resource efficiency
- Clear milestones

**Manual Approach (for each feature):**
1. **Specify:** Run `/specify` with feature description
	 - Script resolves branch/folder conflicts
	 - Verify on feature branch before file operations
	 - Commit spec files before proceeding
2. **Auto-clarify:** Fix clarification items in spec
3. **Plan:** Run `/plan` to generate implementation plan
	 - Verify on feature branch before file operations
	 - Commit plan files after completion
4. **Tasks:** Run `/tasks` to generate task breakdown
	 - Verify on feature branch before file operations
	 - Commit task files after completion
	 - If tasks >12: split into tasks1.md, tasks2.md, etc. (10-12 tasks per file)
	 - Split dependencies: tasks1.md must complete before tasks2.md
	 - Logical grouping: core in tasks1.md, extensions in tasks2.md
5. **Branch Management:** After all three phases, checkout to main before next spec
	 - After checkout, run `git status` to refresh cache

**Automated Orchestration (Optional):**
- Linux/macOS: `.specify/scripts/bash/execute-feature-workflow.sh <feature_name> <feature_description> [dependent_branches]`
- Windows: `.specify/scripts/powershell/execute-feature-workflow.ps1 <feature_name> <feature_description> [dependent_branches]`

Scripts automate: spec creation → auto-clarification → planning → task generation → execution summary.

### 7. Generate Execution Summary
- **Greenfield:** List all created specs with branch names
- **Brownfield:**
	- Show constitutional gaps addressed
	- List completed vs new specs
	- Highlight incomplete features finished
- Show dependency graph and execution order
- Identify parallelizable tasks
- Provide next steps for implementation

---

## Important Notes
- **NO IMPLEMENTATION:** Workflow stops at tasks generation—implementation should NEVER be executed
- **Brownfield Priority:** Constitutional compliance gaps are CRITICAL
- **State Awareness:** Always account for existing implementation
- **Incremental Progress:** Build on existing work
- **Level-Based Progression:** Breadth-first completion
- **Branch Workflow:**
	- Always verify branch before file operations
	- Complete each spec fully before next
	- Commit pattern: git add . then git commit after each spec
	- Global files only committed on main after ALL specs complete
	- Use numbered feature_name vs branch_name (feature/ prefixed)
- Always create branches from develop/main/master
- Include rebasing steps in tasks.md for features with dependencies
- Mark parallel-executable tasks with [P]
- Use best judgment to resolve clarification items
- Ensure each spec is complete before next

## Brownfield Specific Notes
- Respect existing architecture and patterns
- Ensure new features integrate well
- Prioritize constitutional compliance
- Complete incomplete work before new features

---

## Completion Report
- Project type (greenfield/brownfield)
- Constitutional gaps identified/addressed (brownfield)
- Total features identified (existing + new)
- Execution order with dependencies
- Branch names (feature/ prefixed)
- Feature names (numbered, no prefix)
- Summary of parallel vs sequential tasks