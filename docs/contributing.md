# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o Bitbucket MCP Server! Este documento fornece diretrizes e informações para ajudar você a contribuir de forma eficaz.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Melhorias](#sugerir-melhorias)

## 📜 Código de Conduta

Este projeto segue um código de conduta para garantir um ambiente acolhedor e inclusivo para todos os contribuidores. Ao participar, você concorda em:

- Ser respeitoso e inclusivo
- Aceitar críticas construtivas
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros da comunidade

## 🚀 Como Contribuir

### Tipos de Contribuição

1. **🐛 Reportar Bugs**
   - Use o template de issue para bugs
   - Inclua informações de reprodução
   - Forneça logs e screenshots quando relevante

2. **💡 Sugerir Melhorias**
   - Use o template de issue para melhorias
   - Descreva o problema e a solução proposta
   - Considere alternativas e trade-offs

3. **🔧 Contribuir com Código**
   - Fork o repositório
   - Crie uma branch para sua feature
   - Siga os padrões de código
   - Adicione testes
   - Atualize documentação

4. **📚 Melhorar Documentação**
   - Corrija erros de digitação
   - Adicione exemplos
   - Melhore clareza e estrutura

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- **Node.js**: v18.0.0 ou superior
- **npm**: v9.0.0 ou superior
- **Git**: v2.30.0 ou superior
- **Docker**: v20.10.0 ou superior (opcional)

### Instalação

1. **Fork e Clone**
   ```bash
   git clone https://github.com/seu-usuario/bitbucket-mcp-server.git
   cd bitbucket-mcp-server
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   ```

3. **Configurar Ambiente**
   ```bash
   cp env.example .env
   # Edite .env com suas configurações
   ```

4. **Verificar Instalação**
   ```bash
   npm run test
   npm run build
   ```

### Desenvolvimento com Docker

```bash
# Construir imagem
docker build -t bitbucket-mcp-server .

# Executar container
docker run -p 3000:3000 bitbucket-mcp-server
```

## 📏 Padrões de Código

### TypeScript

- **Versão**: 5.0+
- **Configuração**: `tsconfig.json`
- **Linting**: ESLint + Prettier
- **Formatação**: Prettier

### Convenções de Nomenclatura

```typescript
// Classes: PascalCase
class AuthenticationService {}

// Interfaces: PascalCase com prefixo I (opcional)
interface IAuthConfig {}

// Funções: camelCase
function validateCredentials() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Arquivos: kebab-case
// authentication-service.ts
// rate-limiter.ts
```

### Estrutura de Arquivos

```
src/
├── config/          # Configurações
├── services/        # Serviços de negócio
├── server/          # Servidor MCP
├── tools/           # Ferramentas MCP
├── types/           # Definições de tipos
└── utils/           # Utilitários
```

### Comentários e Documentação

```typescript
/**
 * Serviço de autenticação para Bitbucket
 * 
 * @description Gerencia autenticação OAuth 2.0, Personal Access Tokens,
 * App Passwords e Basic Auth com fallback automático
 * 
 * @example
 * ```typescript
 * const authService = new AuthenticationService();
 * const token = await authService.authenticate({
 *   type: 'oauth2',
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret'
 * });
 * ```
 */
class AuthenticationService {
  /**
   * Autentica com o Bitbucket usando o método especificado
   * 
   * @param config - Configuração de autenticação
   * @returns Token de acesso
   * @throws {AuthenticationError} Quando a autenticação falha
   */
  async authenticate(config: AuthConfig): Promise<string> {
    // Implementação...
  }
}
```

## 🏗️ Estrutura do Projeto

### Diretórios Principais

- **`src/`**: Código fonte
- **`tests/`**: Testes (unit, integration, contract)
- **`docs/`**: Documentação
- **`specs/`**: Especificações e features
- **`scripts/`**: Scripts de build e deploy

### Arquivos Importantes

- **`package.json`**: Dependências e scripts
- **`tsconfig.json`**: Configuração TypeScript
- **`jest.config.js`**: Configuração de testes
- **`.env.example`**: Exemplo de variáveis de ambiente

## 🔄 Processo de Desenvolvimento

### 1. **Planejamento**
- Crie uma issue descrevendo o problema/feature
- Discuta a abordagem com a comunidade
- Aguarde aprovação antes de começar

### 2. **Desenvolvimento**
- Crie uma branch a partir de `main`
- Implemente a solução seguindo os padrões
- Adicione testes abrangentes
- Atualize documentação

### 3. **Testes**
- Execute todos os testes: `npm test`
- Verifique cobertura: `npm run test:coverage`
- Teste manualmente se necessário

### 4. **Pull Request**
- Crie PR com descrição detalhada
- Referencie issues relacionadas
- Aguarde revisão e feedback

### 5. **Merge**
- Aguarde aprovação de pelo menos 2 revisores
- Resolva conflitos se necessário
- Merge após aprovação

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── contract/       # Testes de contrato
└── setup.ts        # Configuração global
```

### Executar Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Padrões de Teste

```typescript
describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockBitbucketApi: jest.Mocked<BitbucketApi>;

  beforeEach(() => {
    mockBitbucketApi = createMockBitbucketApi();
    authService = new AuthenticationService(mockBitbucketApi);
  });

  describe('authenticate', () => {
    it('should authenticate with OAuth 2.0 successfully', async () => {
      // Arrange
      const config: AuthConfig = {
        type: 'oauth2',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };
      
      mockBitbucketApi.authenticate.mockResolvedValue('access-token');

      // Act
      const result = await authService.authenticate(config);

      // Assert
      expect(result).toBe('access-token');
      expect(mockBitbucketApi.authenticate).toHaveBeenCalledWith(config);
    });

    it('should throw AuthenticationError when credentials are invalid', async () => {
      // Arrange
      const config: AuthConfig = {
        type: 'oauth2',
        clientId: 'invalid-id',
        clientSecret: 'invalid-secret'
      };
      
      mockBitbucketApi.authenticate.mockRejectedValue(
        new Error('Invalid credentials')
      );

      // Act & Assert
      await expect(authService.authenticate(config))
        .rejects
        .toThrow(AuthenticationError);
    });
  });
});
```

### Cobertura de Testes

- **Mínimo**: 80% de cobertura
- **Ideal**: 90%+ de cobertura
- **Crítico**: 100% para código de segurança

## 📚 Documentação

### Tipos de Documentação

1. **API Reference** (`docs/api-reference.md`)
   - Documentação completa da API
   - Exemplos de uso
   - Códigos de erro

2. **Architecture** (`docs/architecture.md`)
   - Visão geral da arquitetura
   - Diagramas e fluxos
   - Decisões de design

3. **Configuration** (`docs/configuration.md`)
   - Variáveis de ambiente
   - Configurações avançadas
   - Exemplos de setup

4. **Development** (`docs/development.md`)
   - Guia de desenvolvimento
   - Debugging
   - Troubleshooting

### Atualizando Documentação

- Mantenha documentação sincronizada com código
- Use exemplos práticos e claros
- Inclua diagramas quando apropriado
- Revise regularmente para precisão

## 🔀 Pull Requests

### Template de PR

```markdown
## 📝 Descrição
Breve descrição das mudanças implementadas.

## 🔗 Issues Relacionadas
Fixes #123
Closes #456

## 🧪 Testes
- [ ] Testes unitários adicionados/atualizados
- [ ] Testes de integração executados
- [ ] Cobertura de testes mantida (>80%)

## 📚 Documentação
- [ ] Documentação atualizada
- [ ] Exemplos adicionados se necessário
- [ ] README atualizado se necessário

## 🔍 Checklist
- [ ] Código segue padrões do projeto
- [ ] Linting passou sem erros
- [ ] Build passou sem erros
- [ ] Testes passaram
- [ ] Documentação atualizada
```

### Processo de Revisão

1. **Revisão Automática**
   - Linting e formatação
   - Testes automatizados
   - Build e deploy

2. **Revisão Manual**
   - Código e arquitetura
   - Testes e cobertura
   - Documentação

3. **Aprovação**
   - Pelo menos 2 aprovações
   - Sem conflitos
   - Todos os checks passando

## 🐛 Reportar Bugs

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug
Descrição clara e concisa do bug.

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## 🎯 Comportamento Esperado
Descrição do que deveria acontecer.

## 📸 Screenshots
Se aplicável, adicione screenshots.

## 🖥️ Ambiente
- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Node.js: [e.g. 18.17.0]
- Versão: [e.g. 1.0.0]

## 📋 Logs
```
Cole logs relevantes aqui
```

## 🔍 Informações Adicionais
Qualquer informação adicional sobre o problema.
```

## 💡 Sugerir Melhorias

### Template de Feature Request

```markdown
## 🚀 Feature Request
Descrição clara da feature solicitada.

## 🎯 Problema
Qual problema esta feature resolve?

## 💡 Solução Proposta
Descrição detalhada da solução proposta.

## 🔄 Alternativas Consideradas
Outras soluções que foram consideradas.

## 📋 Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## 📸 Mockups/Exemplos
Se aplicável, adicione mockups ou exemplos.

## 🔍 Informações Adicionais
Qualquer informação adicional sobre a feature.
```

## 🏷️ Versionamento

### Semantic Versioning

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

### Changelog

- Mantenha `CHANGELOG.md` atualizado
- Use formato convencional
- Inclua breaking changes

## 🚀 Release Process

### 1. **Preparação**
- Atualize versão em `package.json`
- Atualize `CHANGELOG.md`
- Execute testes completos

### 2. **Release**
- Crie tag de versão
- Gere release notes
- Publique no npm

### 3. **Pós-Release**
- Atualize documentação
- Comunique mudanças
- Monitore feedback

## 🤝 Comunidade

### Canais de Comunicação

- **GitHub Issues**: Bugs e features
- **GitHub Discussions**: Perguntas e discussões
- **Discord**: Chat em tempo real (se disponível)

### Reconhecimento

- Contribuidores listados no README
- Menção em release notes
- Badges de contribuição

## ❓ FAQ

### Como começar a contribuir?

1. Leia este guia completamente
2. Configure o ambiente de desenvolvimento
3. Escolha uma issue marcada como "good first issue"
4. Crie uma branch e comece a trabalhar

### Como escolher uma issue?

- Procure por labels como "good first issue"
- Escolha algo dentro da sua área de expertise
- Pergunte na issue se tiver dúvidas

### Como obter ajuda?

- Abra uma issue com label "question"
- Participe das discussões no GitHub
- Entre em contato com mantenedores

### Como reportar problemas de segurança?

- **NÃO** abra issues públicas para problemas de segurança
- Envie email para security@example.com
- Aguarde resposta antes de divulgar

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir! 🎉**

Sua contribuição é valiosa e ajuda a tornar este projeto melhor para todos.
