---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
---

Given the implementation details provided as an argument, do this:

1. Run `.specify/scripts/bash/setup-plan.sh --json` from the repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. All future file paths must be absolute.
  **NAMING CONVENTION**: 
  - BRANCH will be the feature branch with 'feature/' prefix (e.g., "feature/001-authentication-system")
  - feature_name is the numbered plain name without prefix (e.g., "001-authentication-system")
2. **Branch Verification**: Verify you are on the correct feature branch (BRANCH with 'feature/' prefix) before proceeding with file operations.
3. Read and analyze the feature specification to understand:
   - The feature requirements and user stories
   - Functional and non-functional requirements
   - Success criteria and acceptance criteria
   - Any technical constraints or dependencies mentioned

4. Read the constitution at `.specify/memory/constitution.md` to understand constitutional requirements.

5. Execute the implementation plan template:
   - Load `.specify/templates/plan-template.md` (already copied to IMPL_PLAN path)
   - Set Input path to FEATURE_SPEC
   - Run the Execution Flow (main) function steps 1-9
   - The template is self-contained and executable
   - Follow error handling and gate checks as specified
   - Let the template guide artifact generation in $SPECS_DIR:
     * Phase 0 generates research.md
     * Phase 1 generates data-model.md, contracts/, quickstart.md
     * Phase 2 generates tasks.md
   - Incorporate user-provided details from arguments into Technical Context: $ARGUMENTS
   - Update Progress Tracking as you complete each phase

6. Verify execution completed:
   - Check Progress Tracking shows all phases complete
   - Ensure all required artifacts were generated
   - Confirm no ERROR states in execution

7. **Commit Plan Files**: After completing the implementation plan, commit the changes:
   - Run `git add .`
   - Run `git commit -m "Complete implementation plan for [feature_name]"` (use numbered feature_name, not branch name)

8. Report results with branch name (feature/ prefixed), feature name (numbered), file paths, and generated artifacts.

Use absolute paths with the repository root for all file operations to avoid path issues. Always verify branch and commit before proceeding to tasks phase.
