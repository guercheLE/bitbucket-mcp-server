# Guia de Solução de Problemas - Bitbucket MCP Server

Este documento fornece soluções para problemas comuns encontrados ao usar o Bitbucket MCP Server.

## 📋 Índice

- [Problemas de Instalação](#problemas-de-instalação)
- [Problemas de Configuração](#problemas-de-configuração)
- [Problemas de Autenticação](#problemas-de-autenticação)
- [Problemas de Conectividade](#problemas-de-conectividade)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas de Cache](#problemas-de-cache)
- [Problemas de Logs](#problemas-de-logs)
- [Problemas de Testes](#problemas-de-testes)
- [Problemas de Build](#problemas-de-build)
- [Problemas de CLI](#problemas-de-cli)
- [Diagnóstico Avançado](#diagnóstico-avançado)

## 🛠️ Problemas de Instalação

### Erro: Node.js Version

**Problema**: `Error: Node.js version must be >= 18.0.0`

**Solução**:
```bash
# Verificar versão atual
node --version

# Atualizar Node.js (usando nvm)
nvm install 18
nvm use 18

# Ou baixar do site oficial
# https://nodejs.org/
```

### Erro: Dependências

**Problema**: `npm install` falha com erros de dependências

**Solução**:
```bash
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Se ainda falhar, tentar com yarn
yarn install
```

### Erro: Permissões

**Problema**: `EACCES: permission denied`

**Solução**:
```bash
# Usar nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Ou corrigir permissões do npm
sudo chown -R $(whoami) ~/.npm
```

## ⚙️ Problemas de Configuração

### Erro: Variáveis de Ambiente

**Problema**: `Error: Required environment variable not set`

**Solução**:
```bash
# Verificar arquivo .env
cat .env

# Copiar do exemplo se não existir
cp env.example .env

# Editar com suas configurações
nano .env
```

### Erro: Configuração Inválida

**Problema**: `ValidationError: Invalid configuration`

**Solução**:
```bash
# Validar configuração
npm run validate:constitution

# Verificar logs detalhados
LOG_LEVEL=debug npm run dev
```

### Erro: URL do Bitbucket

**Problema**: `Error: Invalid Bitbucket URL`

**Solução**:
```bash
# Verificar formato da URL
# ✅ Correto: https://bitbucket.company.com
# ❌ Incorreto: bitbucket.company.com (sem protocolo)

# Testar conectividade
curl -I https://bitbucket.company.com/rest/api/1.0/application-properties
```

## 🔐 Problemas de Autenticação

### Erro: Credenciais Inválidas

**Problema**: `401 Unauthorized`

**Solução**:
```bash
# Verificar credenciais no .env
grep BITBUCKET .env

# Testar com curl
curl -u username:password https://bitbucket.company.com/rest/api/1.0/projects

# Para OAuth, verificar client_id e client_secret
```

### Erro: Token Expirado

**Problema**: `Token has expired`

**Solução**:
```bash
# Renovar token OAuth
npm run cli auth refresh

# Ou gerar novo token
npm run cli auth generate
```

### Erro: Permissões Insuficientes

**Problema**: `403 Forbidden`

**Solução**:
1. Verificar permissões do usuário no Bitbucket
2. Confirmar que o usuário tem acesso ao projeto/repositório
3. Verificar se o token tem as permissões necessárias

```bash
# Testar permissões
npm run cli health https://bitbucket.company.com
```

## 🌐 Problemas de Conectividade

### Erro: Timeout de Conexão

**Problema**: `Connection timeout`

**Solução**:
```bash
# Aumentar timeout no .env
BITBUCKET_TIMEOUT=60000

# Verificar conectividade de rede
ping bitbucket.company.com
telnet bitbucket.company.com 443
```

### Erro: DNS

**Problema**: `ENOTFOUND` ou `getaddrinfo ENOTFOUND`

**Solução**:
```bash
# Verificar DNS
nslookup bitbucket.company.com

# Testar com IP direto
curl -I https://[IP_ADDRESS]/rest/api/1.0/application-properties

# Verificar /etc/hosts se necessário
```

### Erro: Proxy

**Problema**: `ECONNREFUSED` através de proxy

**Solução**:
```bash
# Configurar proxy no .env
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080

# Ou configurar no npm
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

## ⚡ Problemas de Performance

### Erro: Alta Latência

**Problema**: Requisições muito lentas

**Solução**:
```bash
# Verificar métricas
npm run cli metrics

# Ajustar configurações de performance
METRICS_ENABLED=true
METRICS_INTERVAL=10000

# Verificar logs de performance
LOG_LEVEL=debug npm run dev
```

### Erro: Uso Excessivo de Memória

**Problema**: `JavaScript heap out of memory`

**Solução**:
```bash
# Aumentar limite de memória
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Verificar uso de memória
npm run cli metrics

# Limpar cache se necessário
npm run cli cache clear
```

### Erro: Rate Limiting

**Problema**: `429 Too Many Requests`

**Solução**:
```bash
# Ajustar rate limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=50

# Verificar configuração atual
npm run cli config
```

## 💾 Problemas de Cache

### Erro: Cache Corrompido

**Problema**: Dados inconsistentes do cache

**Solução**:
```bash
# Limpar cache
npm run cli cache clear

# Verificar status do cache
npm run cli cache status

# Reiniciar com cache limpo
npm run cli cache reset
```

### Erro: Redis Connection

**Problema**: `Redis connection failed`

**Solução**:
```bash
# Verificar configuração Redis
grep REDIS .env

# Testar conexão Redis
redis-cli -h localhost -p 6379 ping

# Fallback para cache em memória
CACHE_TYPE=memory
```

### Erro: Cache TTL

**Problema**: Dados expirados no cache

**Solução**:
```bash
# Ajustar TTL
CACHE_TTL=600

# Verificar configuração
npm run cli cache config

# Forçar refresh
npm run cli cache refresh
```

## 📝 Problemas de Logs

### Erro: Logs Não Aparecem

**Problema**: Nenhum log sendo gerado

**Solução**:
```bash
# Verificar nível de log
LOG_LEVEL=debug npm run dev

# Verificar arquivo de log
tail -f /var/log/bitbucket-mcp-server.log

# Verificar configuração de log
npm run cli config
```

### Erro: Logs Muito Verbosos

**Problema**: Logs excessivos

**Solução**:
```bash
# Ajustar nível de log
LOG_LEVEL=info

# Configurar rotação de logs
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

### Erro: Logs Sensíveis

**Problema**: Dados sensíveis nos logs

**Solução**:
```bash
# Verificar sanitização
LOG_SANITIZE=true

# Verificar configuração
npm run cli config
```

## 🧪 Problemas de Testes

### Erro: Testes Falhando

**Problema**: `npm test` falha

**Solução**:
```bash
# Executar testes específicos
npm run test:unit
npm run test:integration

# Verificar cobertura
npm run test:coverage

# Executar com verbose
npm test -- --verbose
```

### Erro: Cobertura Baixa

**Problema**: Cobertura < 80%

**Solução**:
```bash
# Verificar cobertura detalhada
npm run test:coverage

# Executar testes específicos
npm run test:unit -- --coverage

# Verificar relatório HTML
open coverage/lcov-report/index.html
```

### Erro: Testes de Integração

**Problema**: Testes de integração falhando

**Solução**:
```bash
# Verificar configuração de teste
cat jest.config.js

# Executar com configuração específica
NODE_ENV=test npm run test:integration

# Verificar variáveis de ambiente de teste
```

## 🔨 Problemas de Build

### Erro: TypeScript Compilation

**Problema**: `TypeScript compilation failed`

**Solução**:
```bash
# Verificar erros TypeScript
npx tsc --noEmit

# Verificar configuração
cat tsconfig.json

# Limpar e rebuildar
npm run clean
npm run build
```

### Erro: Dependências de Build

**Problema**: `Module not found`

**Solução**:
```bash
# Verificar imports
grep -r "import.*from" src/

# Verificar paths no tsconfig.json
cat tsconfig.json | grep paths

# Reinstalar dependências
npm install
```

### Erro: Source Maps

**Problema**: Source maps não funcionando

**Solução**:
```bash
# Verificar configuração
cat tsconfig.json | grep sourceMap

# Rebuildar com source maps
npm run build

# Verificar arquivos gerados
ls -la dist/
```

## 💻 Problemas de CLI

### Erro: Comando Não Encontrado

**Problema**: `Command not found`

**Solução**:
```bash
# Verificar se CLI foi buildado
npm run build

# Verificar bin no package.json
cat package.json | grep bin

# Executar diretamente
node dist/client/cli/index.js --help
```

### Erro: Argumentos Inválidos

**Problema**: `Invalid arguments`

**Solução**:
```bash
# Verificar help
npm run cli -- --help

# Verificar sintaxe
npm run cli health --help

# Verificar logs
LOG_LEVEL=debug npm run cli health https://bitbucket.company.com
```

### Erro: Permissões CLI

**Problema**: `Permission denied`

**Solução**:
```bash
# Verificar permissões
ls -la dist/client/cli/index.js

# Corrigir permissões
chmod +x dist/client/cli/index.js

# Executar com node
node dist/client/cli/index.js
```

## 🔍 Diagnóstico Avançado

### Health Check Completo

```bash
# Executar diagnóstico completo
npm run cli health --verbose https://bitbucket.company.com

# Verificar métricas
npm run cli metrics

# Verificar configuração
npm run cli config

# Verificar cache
npm run cli cache status
```

### Debug Mode

```bash
# Habilitar debug completo
DEBUG=* LOG_LEVEL=debug npm run dev

# Debug específico
DEBUG=bitbucket-mcp:* npm run dev

# Debug de rede
DEBUG=axios npm run dev
```

### Logs Detalhados

```bash
# Verificar logs em tempo real
tail -f logs/bitbucket-mcp-server.log

# Filtrar logs por nível
grep "ERROR" logs/bitbucket-mcp-server.log

# Verificar logs de performance
grep "performance" logs/bitbucket-mcp-server.log
```

### Análise de Performance

```bash
# Profiling com Node.js
node --prof dist/server/index.js

# Análise de heap
node --inspect dist/server/index.js

# Monitoramento de memória
npm install -g clinic
clinic doctor -- node dist/server/index.js
```

## 🆘 Quando Buscar Ajuda

### Informações para Suporte

Ao buscar ajuda, inclua:

1. **Versão do Node.js**: `node --version`
2. **Versão do projeto**: `npm list bitbucket-mcp-server`
3. **Sistema operacional**: `uname -a`
4. **Logs relevantes**: Últimas 50 linhas do log
5. **Configuração**: `npm run cli config` (sem dados sensíveis)
6. **Comando que falha**: Comando exato e saída completa

### Canais de Suporte

- 📖 [Documentação](docs/)
- 🐛 [Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- 💬 [Discussões](https://github.com/guercheLE/bitbucket-mcp-server/discussions)
- 📧 [Email](mailto:support@bitbucket-mcp-server.com)

### Checklist Antes de Reportar

- [ ] Verificou a documentação?
- [ ] Tentou as soluções deste guia?
- [ ] Coletou informações de diagnóstico?
- [ ] Removeu dados sensíveis dos logs?
- [ ] Descreveu o problema claramente?

## 📚 Recursos Adicionais

### Documentação Oficial

- [Bitbucket REST API](https://developer.atlassian.com/cloud/bitbucket/rest/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Node.js Documentation](https://nodejs.org/docs/)

### Ferramentas Úteis

- [Postman](https://www.postman.com/) - Testar APIs
- [Insomnia](https://insomnia.rest/) - Cliente REST
- [Redis CLI](https://redis.io/docs/manual/cli/) - Gerenciar Redis
- [Wireshark](https://www.wireshark.org/) - Análise de rede

### Comandos Úteis

```bash
# Verificar status geral
npm run cli status

# Limpar tudo e reinstalar
npm run clean && rm -rf node_modules package-lock.json && npm install

# Backup de configuração
cp .env .env.backup

# Restaurar configuração
cp .env.backup .env
```

---

**Última Atualização**: 2025-01-27  
**Versão**: 1.0.0

Este guia é atualizado regularmente. Se encontrar um problema não coberto aqui, por favor, abra uma issue no GitHub.
