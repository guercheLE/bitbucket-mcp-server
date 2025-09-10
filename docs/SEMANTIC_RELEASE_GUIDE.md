# 🚀 Guia do Semantic Release

Este guia explica como usar o semantic-release configurado no projeto Bitbucket MCP Server para criar releases automáticos.

## 📋 Visão Geral

O semantic-release está configurado para:

- **Patches**: Correções de bugs, documentação, refatoração
- **Minor**: Novas funcionalidades
- **Major**: Mudanças que quebram compatibilidade

## 🛠️ Configuração Atual

### Scripts Disponíveis

```bash
# Release automático baseado nos commits
npm run release

# Teste sem publicar
npm run release:dry-run

# Forçar patch release
npm run release:patch

# Forçar minor release
npm run release:minor

# Forçar major release
npm run release:major
```

### Comandos Make

```bash
# Release automático
make release

# Teste sem publicar
make release-dry-run

# Patch release
make release-patch

# Minor release
make release-minor

# Major release
make release-major
```

## 📝 Convenção de Commits

O projeto usa [Conventional Commits](https://www.conventionalcommits.org/):

### Tipos de Commit

- `fix:` - Correção de bug (patch)
- `feat:` - Nova funcionalidade (minor)
- `feat!:` - Nova funcionalidade com breaking change (major)
- `docs:` - Documentação (patch)
- `style:` - Formatação (patch)
- `refactor:` - Refatoração (patch)
- `perf:` - Melhoria de performance (patch)
- `test:` - Testes (patch)
- `chore:` - Tarefas de manutenção (patch)
- `ci:` - CI/CD (patch)
- `build:` - Build system (patch)

### Exemplos

```bash
# Patch release
git commit -m "fix: corrigir erro de autenticação no Bitbucket Cloud"

# Minor release
git commit -m "feat: adicionar suporte para webhooks do Bitbucket Server"

# Major release
git commit -m "feat!: alterar API de autenticação

BREAKING CHANGE: método de autenticação foi alterado"
```

## 🔄 Fluxo de Release

### 1. Desenvolvimento

```bash
# Fazer mudanças no código
# Fazer commits seguindo a convenção
git add .
git commit -m "fix: corrigir problema específico"
```

### 2. Push para Main

```bash
git push origin main
```

### 3. Release Automático

- O GitHub Actions detecta o push
- Executa testes e build
- Analisa commits para determinar tipo de release
- Cria release no GitHub
- Publica no NPM
- Atualiza CHANGELOG.md

## 🎯 Como Criar um Patch

### Método 1: Commit Convencional

```bash
# Fazer mudanças
git add .
git commit -m "fix: descrição do problema corrigido"
git push origin main
```

### Método 2: Script Forçado

```bash
# Para forçar um patch mesmo sem commits de fix
npm run release:patch

# Ou usar o script diretamente
node scripts/force-release.js patch
```

### Método 3: Make

```bash
make release-patch
```

## 🔧 Configuração Avançada

### Plugins Configurados

1. **@semantic-release/commit-analyzer**: Analisa commits
2. **@semantic-release/release-notes-generator**: Gera notas de release
3. **@semantic-release/changelog**: Atualiza CHANGELOG.md
4. **@semantic-release/npm**: Publica no NPM
5. **@semantic-release/git**: Commita mudanças de release
6. **@semantic-release/github**: Cria releases no GitHub

### Regras de Release

```javascript
releaseRules: [
  { type: 'feat', release: 'minor' },
  { type: 'fix', release: 'patch' },
  { type: 'docs', release: 'patch' },
  { type: 'style', release: 'patch' },
  { type: 'refactor', release: 'patch' },
  { type: 'perf', release: 'patch' },
  { type: 'test', release: 'patch' },
  { type: 'chore', release: 'patch' },
  { type: 'ci', release: 'patch' },
  { type: 'build', release: 'patch' },
  { type: 'revert', release: 'patch' },
];
```

## 🚨 Troubleshooting

### Erro de Autenticação

```bash
# Verificar token do GitHub
echo $GITHUB_TOKEN

# Verificar token do NPM
echo $NPM_TOKEN
```

### Testar Configuração

```bash
# Dry run para testar
npm run release:dry-run
```

### Verificar Commits

```bash
# Ver commits recentes
git log --oneline -10

# Verificar se seguem convenção
npx commitlint --from HEAD~1 --to HEAD --verbose
```

## 📚 Recursos Adicionais

- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [NPM Publishing](https://docs.npmjs.com/cli/v8/commands/npm-publish)

## 🎉 Exemplo Completo

```bash
# 1. Fazer mudanças no código
echo "console.log('fix: corrigir bug')" >> src/fix.js

# 2. Commit seguindo convenção
git add .
git commit -m "fix: corrigir bug de console.log"

# 3. Push para trigger release
git push origin main

# 4. GitHub Actions executa automaticamente:
# - Testa código
# - Faz build
# - Analisa commit (fix = patch)
# - Cria release v2.2.1
# - Publica no NPM
# - Atualiza CHANGELOG.md
```

---

**Nota**: O semantic-release só funciona na branch `main` e requer que os commits sigam a convenção estabelecida.
