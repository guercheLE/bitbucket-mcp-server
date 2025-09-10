/**
 * Data Center Search Commands
 * CLI commands for Bitbucket Data Center Search Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { SearchService } from '../../services/datacenter/search.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterSearchCommands {
  private static logger = Logger.forContext('DataCenterSearchCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de busca do Data Center');

    const searchCommand = program
      .command('search')
      .description('Comandos de busca do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server search <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Repository Search
    searchCommand
      .command('repositories')
      .description('Busca repositórios')
      .requiredOption('-q, --query <query>', 'Consulta de busca')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-q, --query\`: Consulta de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search repositories --query "mobile app"
  $ npx -y @guerchele/bitbucket-mcp-server search repositories --query "react" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search repositories --query "backend" --sort "name"

**Descrição:**
  Busca repositórios usando uma consulta de texto com opções de paginação e ordenação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.searchRepositories({
            query: options.query,
            type: 'REPOSITORY',
            limit: parseInt(options.limit),
            sort: options.sort,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao buscar repositórios', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Code Search
    searchCommand
      .command('code')
      .description('Busca código')
      .requiredOption('-q, --query <query>', 'Consulta de busca')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-q, --query\`: Consulta de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search code --query "function login"
  $ npx -y @guerchele/bitbucket-mcp-server search code --query "import React" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search code --query "TODO" --sort "path"

**Descrição:**
  Busca código usando uma consulta de texto com opções de paginação e ordenação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.searchCode({
            query: options.query,
            type: 'CODE',
            limit: parseInt(options.limit),
            sort: options.sort,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao buscar código', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Commit Search
    searchCommand
      .command('commits')
      .description('Busca commits')
      .requiredOption('-q, --query <query>', 'Consulta de busca')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-q, --query\`: Consulta de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search commits --query "fix bug"
  $ npx -y @guerchele/bitbucket-mcp-server search commits --query "feature" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search commits --query "refactor" --sort "date"

**Descrição:**
  Busca commits usando uma consulta de texto com opções de paginação e ordenação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.searchCommits({
            query: options.query,
            type: 'COMMIT',
            limit: parseInt(options.limit),
            sort: options.sort,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao buscar commits', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Pull Request Search
    searchCommand
      .command('pull-requests')
      .description('Busca pull requests')
      .requiredOption('-q, --query <query>', 'Consulta de busca')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-q, --query\`: Consulta de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search pull-requests --query "bug fix"
  $ npx -y @guerchele/bitbucket-mcp-server search pull-requests --query "feature" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search pull-requests --query "review" --sort "created"

**Descrição:**
  Busca pull requests usando uma consulta de texto com opções de paginação e ordenação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.searchPullRequests({
            query: options.query,
            type: 'PULL_REQUEST',
            limit: parseInt(options.limit),
            sort: options.sort,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao buscar pull requests', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // User Search
    searchCommand
      .command('users')
      .description('Busca usuários')
      .requiredOption('-q, --query <query>', 'Consulta de busca')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-q, --query\`: Consulta de busca

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search users --query "john"
  $ npx -y @guerchele/bitbucket-mcp-server search users --query "admin" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search users --query "developer" --sort "name"

**Descrição:**
  Busca usuários usando uma consulta de texto com opções de paginação e ordenação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.searchUsers({
            query: options.query,
            type: 'USER',
            limit: parseInt(options.limit),
            sort: options.sort,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao buscar usuários', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Search Configuration
    searchCommand
      .command('get-configuration')
      .description('Obtém configuração de busca')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-configuration
  $ npx -y @guerchele/bitbucket-mcp-server search get-configuration --output json

**Descrição:**
  Obtém a configuração atual do sistema de busca do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchConfiguration();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Search Statistics
    searchCommand
      .command('get-statistics')
      .description('Obtém estatísticas de busca')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-statistics
  $ npx -y @guerchele/bitbucket-mcp-server search get-statistics --output json

**Descrição:**
  Obtém estatísticas gerais do sistema de busca, incluindo total de buscas, usuários únicos e resultados médios.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchStatistics();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter estatísticas de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Search History
    searchCommand
      .command('get-history')
      .description('Obtém histórico de busca')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-history
  $ npx -y @guerchele/bitbucket-mcp-server search get-history --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search get-history --output json

**Descrição:**
  Obtém o histórico de buscas realizadas no sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchHistory();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter histórico de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Search Analytics
    searchCommand
      .command('get-analytics')
      .description('Obtém analytics de busca')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-analytics
  $ npx -y @guerchele/bitbucket-mcp-server search get-analytics --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search get-analytics --output json

**Descrição:**
  Obtém analytics detalhados do sistema de busca, incluindo métricas de uso e performance.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchAnalytics();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter analytics de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Search Index Management
    searchCommand
      .command('list-indexes')
      .description('Lista índices de busca')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search list-indexes
  $ npx -y @guerchele/bitbucket-mcp-server search list-indexes --output json

**Descrição:**
  Lista todos os índices de busca disponíveis no sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchIndexes();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar índices de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    searchCommand
      .command('get-index')
      .description('Obtém índice de busca')
      .requiredOption('-i, --index-id <indexId>', 'ID do índice')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --index-id\`: ID do índice de busca

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-index --index-id "repository-index"
  $ npx -y @guerchele/bitbucket-mcp-server search get-index --index-id "code-index" --output json

**Descrição:**
  Obtém informações detalhadas sobre um índice de busca específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchIndex(options.indexId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter índice de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Search Suggestions
    searchCommand
      .command('suggestions')
      .description('Obtém sugestões de busca')
      .requiredOption('-q, --query <query>', 'Consulta de busca')
      .option('-l, --limit <limit>', 'Limite de sugestões', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-q, --query\`: Consulta de busca

**Opções disponíveis:**
- \`-l, --limit\`: Limite de sugestões (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search suggestions --query "react"
  $ npx -y @guerchele/bitbucket-mcp-server search suggestions --query "bug" --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search suggestions --query "feature" --output json

**Descrição:**
  Obtém sugestões de busca baseadas na consulta fornecida.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchSuggestions(options.query);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter sugestões de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Update Search Configuration
    searchCommand
      .command('update-configuration')
      .description('Atualiza configuração de busca')
      .requiredOption(
        '-c, --config <config>',
        'Configuração JSON (enabled, indexEnabled, searchEnabled)'
      )
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --config\`: Configuração JSON para atualizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search update-configuration --config '{"enabled": true, "indexEnabled": true, "searchEnabled": true}'
  $ npx -y @guerchele/bitbucket-mcp-server search update-configuration --config '{"searchEnabled": false}' --output json

**Descrição:**
  Atualiza a configuração do sistema de busca do Bitbucket Data Center. Campos disponíveis: enabled (boolean), indexEnabled (boolean), searchEnabled (boolean).`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const config = JSON.parse(options.config);
          const result = await searchService.updateSearchConfiguration(config);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar configuração de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Rebuild Search Index
    searchCommand
      .command('rebuild-index')
      .description('Reconstrói índice de busca')
      .requiredOption('-i, --index-id <indexId>', 'ID do índice')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --index-id\`: ID do índice de busca

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search rebuild-index --index-id "repository-index"
  $ npx -y @guerchele/bitbucket-mcp-server search rebuild-index --index-id "code-index" --output json

**Descrição:**
  Inicia a reconstrução de um índice de busca específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.rebuildSearchIndex(options.indexId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao reconstruir índice de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Stop Search Index
    searchCommand
      .command('stop-index')
      .description('Para índice de busca')
      .requiredOption('-i, --index-id <indexId>', 'ID do índice')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --index-id\`: ID do índice de busca

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search stop-index --index-id "repository-index"
  $ npx -y @guerchele/bitbucket-mcp-server search stop-index --index-id "code-index" --output json

**Descrição:**
  Para um índice de busca específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.stopSearchIndex(options.indexId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao parar índice de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Get User Search History
    searchCommand
      .command('get-user-history')
      .description('Obtém histórico de busca do usuário')
      .requiredOption('-u, --user-id <userId>', 'ID numérico do usuário')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --user-id\`: ID numérico do usuário (ex: 123)

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-user-history --user-id 123
  $ npx -y @guerchele/bitbucket-mcp-server search get-user-history --user-id 123 --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server search get-user-history --user-id 123 --output json

**Descrição:**
  Obtém o histórico de buscas de um usuário específico identificado pelo ID numérico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getUserSearchHistory(parseInt(options.userId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter histórico de busca do usuário', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Clear Search History
    searchCommand
      .command('clear-history')
      .description('Limpa histórico de busca')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search clear-history
  $ npx -y @guerchele/bitbucket-mcp-server search clear-history --output json

**Descrição:**
  Limpa todo o histórico de buscas do sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          await searchService.clearSearchHistory();
          const response = createMcpResponse(
            { message: 'Histórico de busca limpo com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao limpar histórico de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Clear User Search History
    searchCommand
      .command('clear-user-history')
      .description('Limpa histórico de busca do usuário')
      .requiredOption('-u, --user-id <userId>', 'ID numérico do usuário')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --user-id\`: ID numérico do usuário (ex: 123)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search clear-user-history --user-id 123
  $ npx -y @guerchele/bitbucket-mcp-server search clear-user-history --user-id 123 --output json

**Descrição:**
  Limpa o histórico de buscas de um usuário específico identificado pelo ID numérico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          await searchService.clearUserSearchHistory(parseInt(options.userId));
          const response = createMcpResponse(
            { message: 'Histórico de busca do usuário limpo com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao limpar histórico de busca do usuário', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Get Query Analytics
    searchCommand
      .command('get-query-analytics')
      .description('Obtém analytics de consulta específica')
      .requiredOption('-q, --query <query>', 'Consulta de busca')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-q, --query\`: Consulta de busca

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-query-analytics --query "react"
  $ npx -y @guerchele/bitbucket-mcp-server search get-query-analytics --query "bug fix" --output json

**Descrição:**
  Obtém analytics detalhados para uma consulta de busca específica.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getQueryAnalytics(options.query);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter analytics de consulta', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Get Search Statistics for Range
    searchCommand
      .command('get-statistics-range')
      .description('Obtém estatísticas de busca por período')
      .requiredOption('-f, --from <fromTimestamp>', 'Timestamp inicial (em milissegundos)')
      .requiredOption('-t, --to <toTimestamp>', 'Timestamp final (em milissegundos)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-f, --from\`: Timestamp inicial em milissegundos (ex: 1640995200000)
- \`-t, --to\`: Timestamp final em milissegundos (ex: 1641081600000)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search get-statistics-range --from 1640995200000 --to 1641081600000
  $ npx -y @guerchele/bitbucket-mcp-server search get-statistics-range --from 1640995200000 --to 1641081600000 --output json

**Descrição:**
  Obtém estatísticas de busca para um período específico definido pelos timestamps inicial e final.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const result = await searchService.getSearchStatisticsForRange(
            parseInt(options.fromTimestamp),
            parseInt(options.toTimestamp)
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter estatísticas de busca por período', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Record Search Analytics
    searchCommand
      .command('record-analytics')
      .description('Registra analytics de busca')
      .requiredOption('-a, --analytics <analytics>', 'Analytics JSON (query, type, resultCount)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-a, --analytics\`: Analytics JSON contendo query, type e resultCount

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server search record-analytics --analytics '{"query": "react", "type": "CODE", "resultCount": 10}'
  $ npx -y @guerchele/bitbucket-mcp-server search record-analytics --analytics '{"query": "bug", "type": "REPOSITORY", "resultCount": 5}' --output json

**Descrição:**
  Registra analytics de uma busca específica no sistema. O JSON deve conter pelo menos os campos: query (string), type (string) e resultCount (number).`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const searchService = new SearchService(apiClient, Logger.forContext('SearchService'));

          const analytics = JSON.parse(options.analytics);
          await searchService.recordSearchAnalytics(analytics);
          const response = createMcpResponse(
            { message: 'Analytics registrado com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao registrar analytics de busca', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center search commands');
  }
}
