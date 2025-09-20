---
description: Orchestrate MVP to Full Product development by identifying features, dependencies, and executing complete workflow for each spec.
---

# MVP to Full Product Orchestrator

Given the project description provided as an argument, orchestrate the complete development workflow from MVP to Full Product.

## Overview

This command analyzes your project (greenfield vs brownfield), identifies required features, creates dependency graphs, and executes the complete spec-driven workflow for each feature.

**For Brownfield Projects**: Prioritizes constitutional compliance and completing existing work.  
**For Greenfield Projects**: Focuses on MVP feature identification and dependency planning.

---

## Execution Steps

### 1. Initialize MVP Planning
- Run `.specify/scripts/bash/mvp-to-full.sh --json "$ARGUMENTS"` from repo root
- Parse JSON output for MVP_PLAN_FILE, EXECUTION_PLAN, SPECS_DIR, PROJECT_TYPE, PROJECT_STATE, STATUS
- All file paths must be absolute

### 2. Analyze Project State
   - **Greenfield Projects**: No existing src/, tests/, or docs/ folders
     - Proceed with standard MVP-to-Full planning
     - Create new features from scratch
   - **Brownfield Projects**: Existing implementation detected
     - Compare PROJECT_STATE against constitution.md requirements
     - Identify gaps between constitutional principles and current implementation
     - Focus on missing features and constitutional compliance gaps
     - Account for incomplete features (partial task completion)

3. **Constitutional Analysis for Brownfield**:
   - Review PROJECT_STATE.constitutional_gaps for violations
   - Check PROJECT_STATE.incomplete_features for unfinished work
   - Prioritize constitutional compliance issues (e.g., missing tests if Test-First required)
   - Identify implementation gaps vs constitutional requirements

4. **Feature Planning Based on Project Type**:
   
   **For Greenfield Projects**:
   - Identify MVP features (core functionality needed for basic product)
   - Identify Full Product features (enhancements for complete product)
   - Create feature dependency graph (which features depend on others)
   
   **For Brownfield Projects**:
   - Review existing specs from PROJECT_STATE.existing_specs
   - Complete any incomplete features first (PROJECT_STATE.incomplete_features)
   - Fill constitutional gaps (PROJECT_STATE.constitutional_gaps)
   - Add missing MVP features not yet implemented
   - Plan Full Product features on top of existing + MVP baseline

5. **Update MVP Plan**:
   - Load MVP_PLAN_FILE and replace placeholders with actual analysis
   - **For Greenfield**: Organize new features by priority: MVP (P1) → Full Product (P2) → Advanced (P3)
   - **For Brownfield**: 
     - Mark existing completed features as [DONE]
     - Mark incomplete features as [IN PROGRESS] with completion status
     - Mark constitutional gaps as [CRITICAL] - highest priority
     - Add new MVP features as [TODO]
   - Define clear dependencies between features
   - Mark which features can be developed in parallel [P]

6. **Execute Workflow for Each Feature**:
   
   **Priority Order for Brownfield**:
   1. **Constitutional Compliance**: Fix gaps violating constitution.md first
   2. **Complete Incomplete**: Finish any incomplete_features 
   3. **Missing MVP**: Add any missing MVP functionality
   4. **Full Product**: Add enhancement features
   
   **Manual Approach - For each feature in dependency order**:
   - **Specify**: Run `/specify` command with feature description
   - **Auto-clarify**: Use best judgment to fix clarification items in spec
   - **Plan**: Run `/plan` command to generate implementation plan
   - **Tasks**: Run `/tasks` command to generate task breakdown
     - **If tasks >12**: Command will automatically split into tasks1.md, tasks2.md, etc.
     - **Task splitting**: Each file contains 10-12 tasks (2-6h each)
     - **Split dependencies**: tasks1.md must complete before tasks2.md starts
     - **Logical grouping**: Core functionality in tasks1.md, extensions in tasks2.md, etc.
   
   **Automated Orchestration (Optional)**:
   For teams preferring automated workflow execution, use the orchestrated feature workflow scripts:
   - **Linux/macOS**: `.specify/scripts/bash/execute-feature-workflow.sh <feature_name> <feature_description> [dependent_branches]`
   - **Windows**: `.specify/scripts/powershell/execute-feature-workflow.ps1 <feature_name> <feature_description> [dependent_branches]`
   
   These scripts automate the complete workflow: spec creation → auto-clarification → planning → task generation → execution summary.

7. **Generate Execution Summary**:
   - **For Greenfield**: List all created specs with their branch names
   - **For Brownfield**: 
     - Show constitutional gaps addressed
     - List completed vs new specs
     - Highlight incomplete features that were finished
   - Show dependency graph and execution order
   - Identify which tasks can run in parallel
   - Provide next steps for implementation

**Important Notes**:
- **Brownfield Priority**: Constitutional compliance gaps are CRITICAL and must be addressed first
- **State Awareness**: Always account for existing implementation when planning new features
- **Incremental Progress**: Build on existing work rather than replacing it
- Always create branches from develop/main/master (not from feature branches)
- Include rebasing steps in tasks.md for features with dependencies
- Mark parallel-executable tasks with [P] in the task descriptions
- Use best judgment to resolve any clarification items in specs
- Ensure each spec is complete before moving to the next

**Brownfield Specific Notes**:
- Respect existing architecture and patterns
- Ensure new features integrate well with existing codebase
- Prioritize constitutional compliance over new feature development
- Complete incomplete work before starting new features

Report completion with:
- Project type (greenfield/brownfield)
- Constitutional gaps identified and addressed (for brownfield)
- Total features identified (existing + new)
- Execution order with dependencies
- Branch names for all created specs
- Summary of parallel vs sequential tasks