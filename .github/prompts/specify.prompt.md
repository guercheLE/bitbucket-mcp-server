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
2. **Git MCP Integration Test**: 
   - Test if git MCP server is configured by attempting: `mcp git status --porcelain` (silently)
   - If successful, use MCP git commands: `mcp git [command]`
   - If that fails, test: `git-mcp status --porcelain` (silently)
   - If successful, use git-mcp commands: `git-mcp [command]`
   - If both fail, use standard git commands with informational message
   - For all subsequent git operations, use the working method (mcp git, git-mcp, or git)
3. **Branch Verification**: 
   - CRITICAL: Verify you are on the feature branch (BRANCH_NAME with 'feature/' prefix) before proceeding with file operations
   - Use `git branch --show-current` (or MCP equivalent) to verify current branch
   - If not on feature branch, checkout: `[git_command] checkout {BRANCH_NAME}`
   - **CRITICAL GIT FIX**: After checkout, run `[git_command] status` to refresh Git working directory cache (primary fix)
   - Optional: Brief delay `sleep 0.05` for filesystem consistency on slower systems
   - NEVER create spec files on main branch
4. Load `.specify/templates/spec-template.md` to understand required sections.
5. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.
6. **Commit Spec Files**: After completing the specification, commit the changes:
   - CRITICAL: Ensure you're still on feature branch before committing
   - Use detected git method: `[git_command] add .` and `[git_command] commit -m "Complete specification for [feature_name]"`
   - Use numbered feature_name (e.g., "001-authentication-system"), not branch_name
   - **CRITICAL GIT FIX**: After commit, run `[git_command] status` to refresh Git working directory cache and prevent untracked file bug
   - NEVER commit global files (orchestration-plan.md, execution-plan.json, specify-request.md) on feature branch
7. Report completion with branch name (feature/ prefixed), feature name (numbered), spec file path, and readiness for the next phase.

Note: The script creates and checks out the new feature branch (with 'feature/' prefix) and initializes the spec file before writing. Always verify branch and commit before proceeding to plan phase.
