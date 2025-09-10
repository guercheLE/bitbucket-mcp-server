/**
 * Data Center Dashboard Commands
 * CLI commands for Bitbucket Data Center Dashboard Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { DashboardService } from '../../services/datacenter/dashboard.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { DashboardPreferences } from '../../services/datacenter/types/dashboard.types.js';

export class DataCenterDashboardCommands {
  private static logger = Logger.forContext('DataCenterDashboardCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de dashboard');

    const dashboardCommand = program
      .command('dashboard')
      .description('Comandos de dashboard do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server dashboard <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Dashboard Management
    dashboardCommand
      .command('create')
      .description('Cria um novo dashboard')
      .requiredOption('-n, --name <name>', 'Nome do dashboard')
      .option('-d, --description <description>', 'Descrição do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do dashboard

**Opções disponíveis:**
- \`-d, --description\`: Descrição do dashboard
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard create --name "My Dashboard"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard create --name "Project Dashboard" --description "Dashboard for project monitoring"

**Descrição:**
  Cria um novo dashboard no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.createDashboard({
            name: options.name,
            description: options.description,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('get')
      .description('Obtém dashboard por ID')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get --id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get --id 456 --output json

**Descrição:**
  Obtém informações de um dashboard específico pelo ID.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.getDashboard(options.dashboardId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('update')
      .description('Atualiza dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .option('-n, --name <name>', 'Nome do dashboard')
      .option('-d, --description <description>', 'Descrição do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard

**Opções disponíveis:**
- \`-n, --name\`: Nome do dashboard
- \`-d, --description\`: Descrição do dashboard
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update --id 123 --name "Updated Dashboard"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update --id 456 --description "New description"

**Descrição:**
  Atualiza um dashboard existente com novos dados.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.description) updateData.description = options.description;

          const result = await dashboardService.updateDashboard(options.dashboardId, updateData);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('delete')
      .description('Exclui dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard delete --id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard delete --id 456 --output json

**Descrição:**
  Exclui um dashboard do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          await dashboardService.deleteDashboard(options.dashboardId);
          const response = createMcpResponse(
            { message: 'Dashboard excluído com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('list')
      .description('Lista dashboards')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --sort\`: Ordenação dos resultados
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list --sort "name" --output json

**Descrição:**
  Lista todos os dashboards disponíveis no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.sort) params.sort = options.sort;

          const result = await dashboardService.listDashboards(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar dashboards', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('clone')
      .description('Clona dashboard existente')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard a ser clonado')
      .requiredOption('-n, --name <name>', 'Nome do novo dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard a ser clonado
- \`-n, --name\`: Nome do novo dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard clone --id 123 --name "My Cloned Dashboard"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard clone --id 456 --name "Backup Dashboard" --output json

**Descrição:**
  Cria uma cópia de um dashboard existente com um novo nome.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.cloneDashboard(options.dashboardId, options.name);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao clonar dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Dashboard Data
    dashboardCommand
      .command('get-data')
      .description('Obtém dados do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-data --id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-data --id 456 --output json

**Descrição:**
  Obtém os dados de um dashboard específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.getDashboardData(options.dashboardId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter dados do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('get-widget-data')
      .description('Obtém dados de widget específico')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-w, --widget-id <widgetId>', 'ID do widget')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-w, --widget-id\`: ID do widget

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-widget-data --id 123 --widget-id 456
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-widget-data --id 123 --widget-id 456 --output json

**Descrição:**
  Obtém os dados de um widget específico em um dashboard.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.getWidgetData(
            options.dashboardId,
            options.widgetId
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter dados do widget', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('refresh-data')
      .description('Atualiza dados do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard refresh-data --id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard refresh-data --id 456 --output json

**Descrição:**
  Força a atualização dos dados de um dashboard específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          await dashboardService.refreshDashboardData(options.dashboardId);
          const response = createMcpResponse(
            { message: 'Dados do dashboard atualizados com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar dados do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('refresh-widget-data')
      .description('Atualiza dados de widget específico')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-w, --widget-id <widgetId>', 'ID do widget')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-w, --widget-id\`: ID do widget

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard refresh-widget-data --id 123 --widget-id 456
  $ npx -y @guerchele/bitbucket-mcp-server dashboard refresh-widget-data --id 123 --widget-id 456 --output json

**Descrição:**
  Força a atualização dos dados de um widget específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          await dashboardService.refreshWidgetData(options.dashboardId, options.widgetId);
          const response = createMcpResponse(
            { message: 'Dados do widget atualizados com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar dados do widget', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Dashboard Analytics
    dashboardCommand
      .command('get-analytics')
      .description('Obtém analytics do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-analytics --id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-analytics --id 456 --output json

**Descrição:**
  Obtém as métricas e analytics de um dashboard específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.getDashboardAnalytics(options.dashboardId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter analytics do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('list-analytics')
      .description('Lista analytics de todos os dashboards')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-analytics
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-analytics --output json

**Descrição:**
  Lista as métricas e analytics de todos os dashboards.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.listDashboardAnalytics();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar analytics dos dashboards', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Dashboard Preferences
    dashboardCommand
      .command('get-preferences')
      .description('Obtém preferências do usuário para dashboards')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-preferences
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-preferences --output json

**Descrição:**
  Obtém as preferências do usuário para dashboards.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.getDashboardPreferences();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter preferências do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('update-preferences')
      .description('Atualiza preferências do usuário para dashboards')
      .requiredOption('-d, --default-dashboard <dashboardId>', 'ID do dashboard padrão')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-d, --default-dashboard\`: ID do dashboard padrão

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update-preferences --default-dashboard 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update-preferences --default-dashboard 456 --output json

**Descrição:**
  Atualiza as preferências do usuário para dashboards.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const preferences = {
            defaultDashboard: options.defaultDashboard,
          } as Partial<DashboardPreferences>;

          const result = await dashboardService.updateDashboardPreferences(
            preferences as DashboardPreferences
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar preferências do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Dashboard Sharing
    dashboardCommand
      .command('share')
      .description('Compartilha dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-u, --user <user>', 'Usuário para compartilhar')
      .requiredOption('-p, --permission <permission>', 'Permissão (READ, WRITE, ADMIN)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-u, --user\`: Usuário para compartilhar
- \`-p, --permission\`: Permissão (READ, WRITE, ADMIN)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard share --id 123 --user "john.doe" --permission "READ"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard share --id 456 --user "jane.smith" --permission "WRITE"

**Descrição:**
  Compartilha um dashboard com um usuário específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.shareDashboard(options.dashboardId, {
            username: options.user,
            permission: options.permission,
          } as any);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao compartilhar dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('list-shares')
      .description('Lista compartilhamentos do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-shares --id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-shares --id 456 --output json

**Descrição:**
  Lista todos os compartilhamentos de um dashboard específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.listDashboardShares(options.dashboardId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar compartilhamentos do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('update-share')
      .description('Atualiza compartilhamento do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-s, --share-id <shareId>', 'ID do compartilhamento')
      .requiredOption('-u, --user <user>', 'Usuário para compartilhar')
      .requiredOption('-p, --permission <permission>', 'Permissão (READ, WRITE, ADMIN)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-s, --share-id\`: ID do compartilhamento
- \`-u, --user\`: Usuário para compartilhar
- \`-p, --permission\`: Permissão (READ, WRITE, ADMIN)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update-share --id 123 --share-id 456 --user "john.doe" --permission "WRITE"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update-share --id 123 --share-id 456 --user "jane.smith" --permission "ADMIN"

**Descrição:**
  Atualiza as permissões de um compartilhamento existente.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const shareData = {
            username: options.user,
            permission: options.permission,
          };

          const result = await dashboardService.updateDashboardShare(
            options.dashboardId,
            options.shareId,
            shareData as any
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar compartilhamento do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('remove-share')
      .description('Remove compartilhamento do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-s, --share-id <shareId>', 'ID do compartilhamento')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-s, --share-id\`: ID do compartilhamento

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard remove-share --id 123 --share-id 456
  $ npx -y @guerchele/bitbucket-mcp-server dashboard remove-share --id 123 --share-id 456 --output json

**Descrição:**
  Remove um compartilhamento específico de um dashboard.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          await dashboardService.removeDashboardShare(options.dashboardId, options.shareId);
          const response = createMcpResponse(
            { message: 'Compartilhamento removido com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao remover compartilhamento do dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Dashboard Templates
    dashboardCommand
      .command('list-templates')
      .description('Lista templates de dashboard')
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
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-templates
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-templates --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-templates --output json

**Descrição:**
  Lista todos os templates de dashboard disponíveis.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          const result = await dashboardService.listDashboardTemplates(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar templates de dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('get-template')
      .description('Obtém template de dashboard')
      .requiredOption('-i, --template-id <templateId>', 'ID do template')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --template-id\`: ID do template

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-template --template-id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-template --template-id 456 --output json

**Descrição:**
  Obtém informações de um template de dashboard específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.getDashboardTemplate(options.templateId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter template de dashboard', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('create-from-template')
      .description('Cria dashboard a partir de template')
      .requiredOption('-t, --template-id <templateId>', 'ID do template')
      .requiredOption('-n, --name <name>', 'Nome do novo dashboard')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --template-id\`: ID do template
- \`-n, --name\`: Nome do novo dashboard

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard create-from-template --template-id 123 --name "My Dashboard from Template"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard create-from-template --template-id 456 --name "Project Dashboard" --output json

**Descrição:**
  Cria um novo dashboard baseado em um template existente.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.createDashboardFromTemplate(
            options.templateId,
            options.name
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar dashboard a partir de template', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Widget Management
    dashboardCommand
      .command('create-widget')
      .description('Cria widget no dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-t, --type <type>', 'Tipo do widget')
      .requiredOption('-n, --name <name>', 'Nome do widget')
      .option('-c, --config <config>', 'Configuração JSON do widget')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-t, --type\`: Tipo do widget
- \`-n, --name\`: Nome do widget

**Opções disponíveis:**
- \`-c, --config\`: Configuração JSON do widget
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard create-widget --id 123 --type "chart" --name "Sales Chart"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard create-widget --id 456 --type "table" --name "Data Table" --config '{"columns": ["name", "value"]}'

**Descrição:**
  Cria um novo widget em um dashboard específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const widgetData: any = {
            type: options.type,
            name: options.name,
          };

          if (options.config) {
            widgetData.config = JSON.parse(options.config);
          }

          const result = await dashboardService.addWidgetToDashboard(
            options.dashboardId,
            widgetData
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar widget', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('get-widget')
      .description('Obtém widget específico')
      .requiredOption('-w, --widget-id <widgetId>', 'ID do widget')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --widget-id\`: ID do widget

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-widget --widget-id 123
  $ npx -y @guerchele/bitbucket-mcp-server dashboard get-widget --widget-id 456 --output json

**Descrição:**
  Obtém informações de um widget específico pelo ID.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.getWidget(options.widgetId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter widget', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('list-widgets')
      .description('Lista widgets disponíveis')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-widgets
  $ npx -y @guerchele/bitbucket-mcp-server dashboard list-widgets --output json

**Descrição:**
  Lista todos os widgets disponíveis no sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const result = await dashboardService.listAvailableWidgets();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar widgets', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('update-widget')
      .description('Atualiza widget do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-w, --widget-id <widgetId>', 'ID do widget')
      .option('-n, --name <name>', 'Nome do widget')
      .option('-c, --config <config>', 'Configuração JSON do widget')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-w, --widget-id\`: ID do widget

**Opções disponíveis:**
- \`-n, --name\`: Nome do widget
- \`-c, --config\`: Configuração JSON do widget
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update-widget --id 123 --widget-id 456 --name "Updated Widget"
  $ npx -y @guerchele/bitbucket-mcp-server dashboard update-widget --id 123 --widget-id 456 --config '{"newSetting": "value"}'

**Descrição:**
  Atualiza um widget existente em um dashboard.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.config) updateData.config = JSON.parse(options.config);

          const result = await dashboardService.updateWidget(
            options.dashboardId,
            options.widgetId,
            updateData
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar widget', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    dashboardCommand
      .command('delete-widget')
      .description('Exclui widget do dashboard')
      .requiredOption('-i, --id <dashboardId>', 'ID do dashboard')
      .requiredOption('-w, --widget-id <widgetId>', 'ID do widget')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do dashboard
- \`-w, --widget-id\`: ID do widget

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server dashboard delete-widget --id 123 --widget-id 456
  $ npx -y @guerchele/bitbucket-mcp-server dashboard delete-widget --id 123 --widget-id 456 --output json

**Descrição:**
  Remove um widget de um dashboard específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const dashboardService = new DashboardService(
            apiClient,
            Logger.forContext('DashboardService')
          );

          await dashboardService.removeWidgetFromDashboard(options.dashboardId, options.widgetId);
          const response = createMcpResponse(
            { message: 'Widget excluído com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir widget', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center dashboard commands');
  }
}
