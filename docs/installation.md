# Guia de Instalação

Este guia fornece instruções detalhadas para instalar e configurar o Bitbucket MCP Server.

## 📋 Pré-requisitos

### Requisitos do Sistema

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 (ou yarn >= 1.22.0)
- **Git**: Para clonagem do repositório
- **Sistema Operacional**: Windows, macOS ou Linux

### Verificação dos Pré-requisitos

```bash
# Verificar versão do Node.js
node --version

# Verificar versão do npm
npm --version

# Verificar versão do Git
git --version
```

## 🚀 Instalação

### 1. Clonagem do Repositório

```bash
# Clone o repositório
git clone https://github.com/guercheLE/bitbucket-mcp-server.git

# Navegue para o diretório
cd bitbucket-mcp-server
```

### 2. Instalação das Dependências

```bash
# Instalar dependências
npm install

# Ou usando yarn
yarn install
```

### 3. Configuração do Ambiente

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar configurações
nano .env  # ou use seu editor preferido
```

## ⚙️ Configuração

### Variáveis de Ambiente Obrigatórias

```env
# URL do Bitbucket (obrigatório)
BITBUCKET_URL=https://your-bitbucket-instance.com
```

### Variáveis de Ambiente Opcionais

```env
# Configuração do Servidor
NODE_ENV=development
PORT=3000
HOST=localhost

# Configuração do Bitbucket
BITBUCKET_TYPE=datacenter  # ou 'cloud'
BITBUCKET_VERSION=7.16

# Cache
CACHE_TTL=300
CACHE_MAX_SIZE=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Performance
REQUEST_TIMEOUT=30000
MAX_RETRIES=3
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Segurança
CORS_ORIGIN=*
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

### Configuração de Autenticação

Escolha um dos métodos de autenticação abaixo:

#### OAuth 2.0 (Recomendado)

```env
BITBUCKET_OAUTH_CLIENT_ID=your_client_id
BITBUCKET_OAUTH_CLIENT_SECRET=your_client_secret
BITBUCKET_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

#### Personal Access Token

```env
BITBUCKET_PERSONAL_TOKEN=your_personal_token
```

#### App Password

```env
BITBUCKET_APP_PASSWORD=your_app_password
BITBUCKET_USERNAME=your_username
```

#### Basic Auth (Fallback)

```env
BITBUCKET_USERNAME=your_username
BITBUCKET_PASSWORD=your_password
```

## 🔧 Configuração do Bitbucket

### Para Bitbucket Data Center

1. Acesse sua instância do Bitbucket Data Center
2. Vá para **Administration** > **Application Links**
3. Configure as permissões necessárias
4. Para OAuth, configure um Application Link

### Para Bitbucket Cloud

1. Acesse [Bitbucket Cloud](https://bitbucket.org)
2. Vá para **Personal settings** > **App passwords**
3. Crie um novo App Password com as permissões necessárias
4. Para OAuth, configure em **Personal settings** > **OAuth consumers**

## 🧪 Verificação da Instalação

### 1. Compilação

```bash
# Compilar o projeto
npm run build

# Verificar se não há erros
echo $?  # Deve retornar 0
```

### 2. Testes

```bash
# Executar testes
npm test

# Verificar cobertura
npm run test:coverage
```

### 3. Validação Constitucional

```bash
# Verificar conformidade constitucional
npm run validate:constitution
```

### 4. Health Check

```bash
# Testar conexão com Bitbucket
npm run cli health https://your-bitbucket-instance.com
```

## 🚀 Primeira Execução

### Modo Desenvolvimento

```bash
# Iniciar em modo desenvolvimento
npm run dev
```

### Modo Produção

```bash
# Compilar
npm run build

# Iniciar servidor
npm start
```

### CLI

```bash
# Executar CLI
npm run cli health https://your-bitbucket-instance.com
```

## 🔍 Solução de Problemas

### Erro de Compilação

```bash
# Limpar cache
npm run clean

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Recompilar
npm run build
```

### Erro de Autenticação

1. Verifique as credenciais no arquivo `.env`
2. Teste a conectividade com o Bitbucket
3. Verifique as permissões do usuário/token

### Erro de Porta

```bash
# Verificar se a porta está em uso
netstat -tulpn | grep :3000

# Usar porta diferente
PORT=3001 npm start
```

### Logs de Debug

```bash
# Habilitar logs detalhados
LOG_LEVEL=debug npm run dev
```

## 📦 Instalação Global (Opcional)

```bash
# Instalar globalmente
npm install -g .

# Usar de qualquer lugar
bitbucket-mcp health https://your-bitbucket-instance.com
```

## 🐳 Docker (Futuro)

```dockerfile
# Dockerfile será adicionado em versões futuras
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## ✅ Checklist de Instalação

- [ ] Node.js >= 18.0.0 instalado
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Variável `BITBUCKET_URL` definida
- [ ] Método de autenticação configurado
- [ ] Projeto compila sem erros (`npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Validação constitucional passa (`npm run validate:constitution`)
- [ ] Health check funciona (`npm run cli health <url>`)

## 🆘 Suporte

Se encontrar problemas durante a instalação:

1. Verifique os [logs de erro](#logs-de-debug)
2. Consulte a [documentação de troubleshooting](troubleshooting.md)
3. Abra uma [issue](https://github.com/guercheLE/bitbucket-mcp-server/issues)
4. Participe das [discussões](https://github.com/guercheLE/bitbucket-mcp-server/discussions)
