---
description: Create or update the feature specification from a natural language feature description.
---

Given the feature description provided as an argument, do this:

1. Run the script `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS"` from repo root and parse its JSON output for BRANCH_NAME and SPEC_FILE. All file paths must be absolute.
  **IMPORTANT** You must only ever run this script once. The JSON is provided in the terminal as output - always refer to it to get the actual content you're looking for.
  **CONFLICT RESOLUTION**: The script automatically handles:
  - Phase 1: Branch naming conflicts (before checkout) - renames existing branches with same feature name
  - Phase 2: Folder naming conflicts (after checkout) - merges existing spec folders with same feature name
  **NAMING CONVENTION**: 
  - BRANCH_NAME will be prefixed with 'feature/' (e.g., "feature/001-authentication-system")
  - feature_name is the numbered plain name without prefix (e.g., "001-authentication-system")
2. **Branch Verification**: 
   - CRITICAL: Verify you are on the feature branch (BRANCH_NAME with 'feature/' prefix) before proceeding with file operations
   - Use `git branch --show-current` to verify current branch
   - If not on feature branch, checkout: `git checkout {BRANCH_NAME}`
   - TIMING SAFETY: After checkout, wait 300ms for file system stability: `sleep 0.3`
   - Verify clean state: `git status --porcelain` (should be empty)
   - NEVER create spec files on main branch
3. Load `.specify/templates/spec-template.md` to understand required sections.
4. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.
5. **Commit Spec Files**: After completing the specification, commit the changes:
   - CRITICAL: Ensure you're still on feature branch before committing
   - Run `git add .`
   - Run `git commit -m "Complete specification for [feature_name]"` (use numbered feature_name, not branch_name)
   - NEVER commit global files (mvp-plan.md, execution-plan.json, specify-request.txt) on feature branch
6. Report completion with branch name (feature/ prefixed), feature name (numbered), spec file path, and readiness for the next phase.

Note: The script creates and checks out the new feature branch (with 'feature/' prefix) and initializes the spec file before writing. Always verify branch and commit before proceeding to plan phase.
