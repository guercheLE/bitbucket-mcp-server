/**
 * Data Center Deprecated Commands
 * CLI commands for Bitbucket Data Center Deprecated Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { DeprecatedService } from '../../services/datacenter/deprecated.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterDeprecatedCommands {
  private static logger = Logger.forContext('DataCenterDeprecatedCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos deprecated');

    const deprecatedCommand = program
      .command('deprecated')
      .description('Comandos de funcionalidades depreciadas do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server deprecated <command> --help' para mais informações sobre um comando específico.
`
      );

    // Deprecated Endpoints
    deprecatedCommand
      .command('list-endpoints')
      .description('Lista endpoints depreciados')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-endpoints
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-endpoints --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-endpoints --status "deprecated" --output json

**Descrição:**
  Lista todos os endpoints depreciados no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;

          const result = await deprecatedService.getDeprecatedEndpoints(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar endpoints depreciados', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    deprecatedCommand
      .command('get-endpoint')
      .description('Obtém endpoint depreciado')
      .requiredOption('-e, --endpoint <endpoint>', 'Endpoint depreciado')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-e, --endpoint\`: Endpoint depreciado

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-endpoint --endpoint "/rest/api/1.0/projects"
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-endpoint --endpoint "/rest/api/1.0/repositories" --output json

**Descrição:**
  Obtém informações detalhadas sobre um endpoint depreciado específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const result = await deprecatedService.getDeprecatedEndpoint(options.endpoint, 'GET');
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter endpoint depreciado', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    deprecatedCommand
      .command('get-endpoint-usage')
      .description('Obtém uso do endpoint depreciado')
      .requiredOption('-e, --endpoint <endpoint>', 'Endpoint depreciado')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-e, --endpoint\`: Endpoint depreciado

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-endpoint-usage --endpoint "/rest/api/1.0/projects"
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-endpoint-usage --endpoint "/rest/api/1.0/repositories" --page 2 --limit 20

**Descrição:**
  Obtém informações sobre o uso de um endpoint depreciado específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          const result = await deprecatedService.getDeprecatedEndpointUsage(options.endpoint);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter uso do endpoint depreciado', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Deprecated Features
    deprecatedCommand
      .command('list-features')
      .description('Lista features depreciadas')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-features
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-features --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-features --status "deprecated" --output json

**Descrição:**
  Lista todas as features depreciadas no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;

          const result = await deprecatedService.getDeprecatedFeatures(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar features depreciadas', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Deprecated API Versions
    deprecatedCommand
      .command('list-api-versions')
      .description('Lista versões de API depreciadas')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-api-versions
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-api-versions --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-api-versions --output json

**Descrição:**
  Lista todas as versões de API depreciadas no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          const result = await deprecatedService.getDeprecatedApiVersions(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar versões de API depreciadas', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Deprecation Notices
    deprecatedCommand
      .command('list-notices')
      .description('Lista avisos de depreciação')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --severity <severity>', 'Filtrar por severidade')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --severity\`: Filtrar por severidade
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-notices
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-notices --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server deprecated list-notices --severity "high" --output json

**Descrição:**
  Lista todos os avisos de depreciação no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.severity) params.severity = options.severity;

          const result = await deprecatedService.getDeprecationNotices(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar avisos de depreciação', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Deprecation Timeline
    deprecatedCommand
      .command('get-timeline')
      .description('Obtém cronograma de depreciação')
      .option('-s, --start-date <startDate>', 'Data de início (ISO 8601)')
      .option('-e, --end-date <endDate>', 'Data de fim (ISO 8601)')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-s, --start-date\`: Data de início (ISO 8601)
- \`-e, --end-date\`: Data de fim (ISO 8601)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-timeline
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-timeline --start-date "2024-01-01" --end-date "2024-12-31"
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-timeline --start-date "2024-01-01" --output json

**Descrição:**
  Obtém o cronograma de depreciação do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const params: any = {};
          if (options.startDate) params.startDate = options.startDate;
          if (options.endDate) params.endDate = options.endDate;

          const result = await deprecatedService.getDeprecationTimeline(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter cronograma de depreciação', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Deprecation Policy
    deprecatedCommand
      .command('get-policy')
      .description('Obtém política de depreciação')
      .option('--output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-policy
  $ npx -y @guerchele/bitbucket-mcp-server deprecated get-policy --output json

**Descrição:**
  Obtém a política de depreciação do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const deprecatedService = new DeprecatedService(
            apiClient,
            Logger.forContext('DeprecatedService')
          );

          const result = await deprecatedService.getDeprecationPolicy();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter política de depreciação', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center deprecated commands');
  }
}
