# Bitbucket MCP Server

[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](https://opensource.org/licenses/LGPL-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen.svg)](https://jestjs.io/)

Um servidor MCP (Model Context Protocol) abrangente para Bitbucket, suportando tanto Data Center quanto Cloud com mais de 250 endpoints.

## 🚀 Características

- **Protocolo MCP Oficial**: Usa o SDK oficial `@modelcontextprotocol/sdk` como única fonte de verdade
- **Multi-Transport**: Suporte completo para STDIO, HTTP, SSE e HTTP Streaming
- **Detecção Automática**: Detecta automaticamente o tipo de servidor (Data Center vs Cloud)
- **Autenticação Hierárquica**: OAuth 2.0, Personal Access Tokens, App Passwords e Basic Auth
- **TDD Obrigatório**: Desenvolvimento orientado a testes com cobertura >80%
- **TypeScript Strict**: Tipagem rigorosa e validação de schemas com Zod
- **Performance**: Monitoramento, cache (Memory + Redis), circuit breakers e rate limiting
- **Conformidade Constitucional**: Segue rigorosamente a Constituição do projeto

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Acesso a uma instância do Bitbucket (Data Center ou Cloud)

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/guercheLE/bitbucket-mcp-server.git
cd bitbucket-mcp-server

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas configurações
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `env.example`:

```env
# Configuração do Servidor
NODE_ENV=development
PORT=3000
HOST=localhost

# Configuração do Bitbucket
BITBUCKET_URL=https://your-bitbucket-instance.com
BITBUCKET_TYPE=datacenter
BITBUCKET_VERSION=7.16

# Autenticação (escolha um método)
# OAuth 2.0 (recomendado)
BITBUCKET_OAUTH_CLIENT_ID=your_client_id
BITBUCKET_OAUTH_CLIENT_SECRET=your_client_secret
BITBUCKET_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Personal Access Token
BITBUCKET_PERSONAL_TOKEN=your_personal_token

# App Password
BITBUCKET_APP_PASSWORD=your_app_password

# Basic Auth (fallback)
BITBUCKET_USERNAME=your_username
BITBUCKET_PASSWORD=your_password

# Cache Configuration
CACHE_TYPE=memory  # ou 'redis' para usar Redis
CACHE_TTL=300      # TTL em segundos

# Redis Configuration (se CACHE_TYPE=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=     # opcional
REDIS_DB=0
```

### Métodos de Autenticação

O servidor suporta múltiplos métodos de autenticação em ordem de prioridade:

1. **OAuth 2.0** (Prioridade máxima)
2. **Personal Access Token**
3. **App Password**
4. **Basic Auth** (Fallback)

## 🚀 Uso

### Como Servidor MCP

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### Como CLI

```bash
# Health check
npm run cli health https://bitbucket.example.com

# Build e execução
npm run build
node dist/client/cli/index.js health https://bitbucket.example.com
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes de contrato
npm run test:contract

# Cobertura de testes
npm run test:coverage
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor em modo desenvolvimento
npm run build            # Compilar TypeScript
npm run start            # Iniciar servidor compilado
npm run cli              # Executar CLI

# Qualidade de Código
npm run lint             # ESLint
npm run lint:fix         # ESLint com correção automática
npm run format           # Prettier
npm run validate:constitution  # Validação constitucional

# Testes
npm test                 # Todos os testes
npm run test:unit        # Testes unitários
npm run test:integration # Testes de integração
npm run test:contract    # Testes de contrato
npm run test:coverage    # Cobertura de testes

# Utilitários
npm run clean            # Limpar arquivos compilados
```

### Estrutura do Projeto

```
src/
├── server/              # Servidor MCP principal
│   ├── index.ts         # Ponto de entrada do servidor
│   └── transports/      # Implementações de transporte
├── client/              # Cliente CLI
│   └── cli/             # Interface de linha de comando
├── tools/               # Ferramentas MCP
│   ├── cloud/           # Ferramentas específicas do Cloud
│   ├── datacenter/      # Ferramentas específicas do Data Center
│   └── shared/          # Ferramentas compartilhadas
├── services/            # Serviços de negócio
├── types/               # Definições TypeScript
├── utils/               # Utilitários
└── config/              # Configurações

tests/
├── unit/                # Testes unitários
├── integration/         # Testes de integração
└── contract/            # Testes de contrato
```

## 📜 Constituição

Este projeto segue rigorosamente a Constituição do Bitbucket MCP Server:

- **Article I**: MCP Protocol First - SDK oficial como única fonte de verdade
- **Article II**: Multi-Transport Protocol - Suporte completo para todos os transportes
- **Article III**: Selective Tool Registration - Detecção automática e registro seletivo
- **Article IV**: Complete API Coverage - Base preparada para 170+ endpoints
- **Article V**: Test-First - TDD obrigatório com >80% cobertura
- **Article VI**: Versioning - Versionamento semântico
- **Article VII**: Simplicity - Estrutura simples e organizada

Execute `npm run validate:constitution` para verificar a conformidade.

## 🔒 Segurança

- Sanitização automática de logs
- Validação rigorosa de entrada com Zod
- Rate limiting e circuit breakers
- Suporte a HTTPS e CORS configurável
- Autenticação hierárquica segura

## 📊 Monitoramento

- Logs estruturados com Winston
- Métricas de performance
- Health checks automáticos
- Cache com TTL e invalidação (Memory + Redis)
- Circuit breakers para resiliência

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Commit

Use o formato: `<type>(<scope>): <description>`

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

Exemplo: `feat(auth): add OAuth 2.0 authentication`

## 📄 Licença

Este projeto está licenciado sob a Licença LGPL-3.0 - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📚 Documentação

- 📖 [Instalação](docs/installation.md) - Guia de instalação e configuração inicial
- ⚙️ [Configuração](docs/configuration.md) - Configurações detalhadas e variáveis de ambiente
- 🔧 [Referência da API](docs/api-reference.md) - Documentação completa de todas as ferramentas
- 💻 [Desenvolvimento](docs/development.md) - Guia para desenvolvedores e contribuidores
- 📜 [Constituição](docs/constitution.md) - Princípios fundamentais do projeto
- 🆘 [Solução de Problemas](docs/troubleshooting.md) - Guia de troubleshooting

## 🆘 Suporte

- 📖 [Documentação](docs/)
- 🐛 [Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- 💬 [Discussões](https://github.com/guercheLE/bitbucket-mcp-server/discussions)

## 🙏 Agradecimentos

- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocolo oficial
- [Bitbucket REST API](https://developer.atlassian.com/cloud/bitbucket/rest/) - Documentação da API
- [TypeScript](https://www.typescriptlang.org/) - Tipagem estática
- [Jest](https://jestjs.io/) - Framework de testes
- [Winston](https://github.com/winstonjs/winston) - Logging estruturado
