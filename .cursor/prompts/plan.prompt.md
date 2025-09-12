# Plan how to implement the specified feature


Plan how to implement the specified feature.

This is the second step in the Spec-Driven Development lifecycle.

Given the implementation details provided as an argument, do this:

1. Run `bash scripts/setup-plan.sh --json` from the repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. All future file paths must be absolute.
2. Read and analyze the feature specification to understand:
   - The feature requirements and user stories
   - Functional and non-functional requirements
   - Success criteria and acceptance criteria
   - Any technical constraints or dependencies mentioned

3. Read the constitution at `/memory/constitution.md` to understand constitutional requirements.

4. Execute the implementation plan template:
   - Load `/templates/plan-template.md` (already copied to IMPL_PLAN path)
   - Set Input path to FEATURE_SPEC
   - Run the Execution Flow (main) function steps 1-10
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

6. Ensure MCP Server documentation structure is included in the plan:
   - Verify that the following documentation files are planned for generation in docs/:
     * README.md                # Documentação principal do projeto
     * API.md                   # Documentação da API
     * ARCHITECTURE.md          # Arquitetura do sistema
     * CONTRIBUTING.md          # Guia de contribuição
     * DEPLOYMENT.md            # Guia de deploy
     * EXAMPLES.md              # Exemplos de uso
     * LICENSE.md               # Licença do projeto
     * CHANGELOG.md             # Histórico de mudanças
     * SECURITY.md              # Políticas de segurança
     * MCP_PROTOCOL.md          # Documentação específica do protocolo MCP
     * TOOLS_REFERENCE.md       # Referência das ferramentas MCP
     * AUTHENTICATION.md        # Guia de autenticação MCP
     * CONFIGURATION.md         # Configuração do MCP Server
     * DEVELOPMENT.md           # Guia para desenvolvedores
     * TESTING.md               # Guia de testes
     * BUILD.md                 # Guia de build
     * FAQ.md                   # Perguntas frequentes
     * TROUBLESHOOTING.md       # Solução de problemas
     * PERFORMANCE.md           # Guia de performance

7. Report results with branch name, file paths, and generated artifacts.

Use absolute paths with the repository root for all file operations to avoid path issues.
