---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
---

Given the implementation details provided as an argument, do this:

1. Run `.specify/scripts/powershell/setup-plan.ps1 -Json` from the repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. All future file paths must be absolute.
2. Read and analyze the feature specification to understand:
   - The feature requirements and user stories
   - Functional and non-functional requirements
   - Success criteria and acceptance criteria
   - Any technical constraints or dependencies mentioned

3. Read the constitution at `.specify/memory/constitution.md` to understand constitutional requirements:
   - Article I: MCP Protocol First - All functionality through standardized MCP tools, library-first approach
   - Article II: Multi-Transport Protocol - Support stdio, HTTP, SSE, HTTP streaming, CLI interface with text I/O
   - Article III: Selective Tool Registration - Based on server type and version, console client commands registered selectively
   - Article IV: Complete API Coverage - All Bitbucket Data Center (7.16+) and Cloud APIs, integration testing with real dependencies
   - Article V: Test-First (NON-NEGOTIABLE) - TDD mandatory with >80% coverage, test approval gates
   - Article VI: Versioning - Semantic versioning, breaking change procedures, version increment reminders
   - Article VII: Simplicity - Project count limits, YAGNI principles, pattern prohibition examples

4. Execute the implementation plan template:
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

5. Verify execution completed:
   - Check Progress Tracking shows all phases complete
   - Ensure all required artifacts were generated
   - Confirm no ERROR states in execution

6. Report results with branch name, file paths, and generated artifacts.

Use absolute paths with the repository root for all file operations to avoid path issues.
