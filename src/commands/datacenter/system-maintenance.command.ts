/**
 * Data Center System Maintenance Commands
 * CLI commands for Bitbucket Data Center System Maintenance Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { SystemMaintenanceService } from '../../services/datacenter/system-maintenance.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterSystemMaintenanceCommands {
  private static logger = Logger.forContext('DataCenterSystemMaintenanceCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de manutenção do sistema');

    const maintenanceCommand = program
      .command('maintenance')
      .description('Comandos de manutenção do sistema do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server maintenance <command> --help' para mais informações sobre um comando específico.
      `
      );

    // System Status
    maintenanceCommand
      .command('get-status')
      .description('Obtém status do sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-status
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-status --output json

**Descrição:**
  Obtém o status atual do sistema Bitbucket Data Center, incluindo informações sobre saúde geral, recursos disponíveis e estado dos serviços.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const result = await maintenanceService.getSystemStatus();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter status do sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // System Configuration
    maintenanceCommand
      .command('get-configuration')
      .description('Obtém configuração do sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-configuration
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-configuration --output json

**Descrição:**
  Obtém a configuração atual do sistema Bitbucket Data Center, incluindo configurações de cluster, cache, e outras configurações de sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const result = await maintenanceService.getSystemConfiguration();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração do sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // System Metrics
    maintenanceCommand
      .command('get-metrics')
      .description('Obtém métricas do sistema')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-t, --type <type>', 'Tipo de métrica')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-t, --type\`: Tipo de métrica para filtrar
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-metrics
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-metrics --type performance --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-metrics --page 2 --output json

**Descrição:**
  Obtém métricas do sistema Bitbucket Data Center, incluindo métricas de performance, uso de recursos, e estatísticas de operação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const result = await maintenanceService.getSystemMetrics();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter métricas do sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Maintenance Tasks
    maintenanceCommand
      .command('list-tasks')
      .description('Lista tarefas de manutenção')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('-t, --type <type>', 'Filtrar por tipo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status (active, inactive, running, completed, failed)
- \`-t, --type\`: Filtrar por tipo de tarefa
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance list-tasks
  $ npx -y @guerchele/bitbucket-mcp-server maintenance list-tasks --status active --type cleanup
  $ npx -y @guerchele/bitbucket-mcp-server maintenance list-tasks --limit 20 --output json

**Descrição:**
  Lista todas as tarefas de manutenção configuradas no sistema Bitbucket Data Center com opções de filtro e paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;
          if (options.type) params.type = options.type;

          const result = await maintenanceService.listMaintenanceTasks(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar tarefas de manutenção', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    maintenanceCommand
      .command('create-task')
      .description('Cria tarefa de manutenção')
      .requiredOption('-n, --name <name>', 'Nome da tarefa')
      .requiredOption('-t, --type <type>', 'Tipo da tarefa')
      .requiredOption('-s, --schedule <schedule>', 'Agendamento da tarefa (cron)')
      .option('-d, --description <description>', 'Descrição da tarefa')
      .option('-c, --config <config>', 'Configuração da tarefa (JSON)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da tarefa de manutenção
- \`-t, --type\`: Tipo da tarefa (cleanup, backup, optimization, etc.)
- \`-s, --schedule\`: Agendamento da tarefa em formato cron

**Opções disponíveis:**
- \`-d, --description\`: Descrição detalhada da tarefa
- \`-c, --config\`: Configuração da tarefa em formato JSON
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance create-task --name "Limpeza Diária" --type cleanup --schedule "0 2 * * *"
  $ npx -y @guerchele/bitbucket-mcp-server maintenance create-task --name "Backup Semanal" --type backup --schedule "0 3 * * 0" --description "Backup completo do sistema"

**Descrição:**
  Cria uma nova tarefa de manutenção no sistema Bitbucket Data Center com agendamento automático.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const taskData: any = {
            name: options.name,
            type: options.type,
            schedule: options.schedule,
          };

          if (options.description) taskData.description = options.description;
          if (options.config) taskData.config = JSON.parse(options.config);

          const result = await maintenanceService.createMaintenanceTask(taskData);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar tarefa de manutenção', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    maintenanceCommand
      .command('get-task')
      .description('Obtém tarefa de manutenção')
      .requiredOption('-i, --task-id <taskId>', 'ID da tarefa')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --task-id\`: ID da tarefa de manutenção

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-task --task-id 123
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-task --task-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de uma tarefa de manutenção específica no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const result = await maintenanceService.getMaintenanceTask(options.taskId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter tarefa de manutenção', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    maintenanceCommand
      .command('update-task')
      .description('Atualiza tarefa de manutenção')
      .requiredOption('-i, --task-id <taskId>', 'ID da tarefa')
      .option('-n, --name <name>', 'Nome da tarefa')
      .option('-t, --type <type>', 'Tipo da tarefa')
      .option('-s, --schedule <schedule>', 'Agendamento da tarefa (cron)')
      .option('-d, --description <description>', 'Descrição da tarefa')
      .option('-c, --config <config>', 'Configuração da tarefa (JSON)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --task-id\`: ID da tarefa de manutenção

**Opções disponíveis:**
- \`-n, --name\`: Novo nome da tarefa
- \`-t, --type\`: Novo tipo da tarefa
- \`-s, --schedule\`: Novo agendamento em formato cron
- \`-d, --description\`: Nova descrição da tarefa
- \`-c, --config\`: Nova configuração da tarefa em formato JSON
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance update-task --task-id 123 --name "Nova Limpeza"
  $ npx -y @guerchele/bitbucket-mcp-server maintenance update-task --task-id 123 --schedule "0 3 * * *" --description "Horário atualizado"

**Descrição:**
  Atualiza uma tarefa de manutenção existente no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.type) updateData.type = options.type;
          if (options.schedule) updateData.schedule = options.schedule;
          if (options.description) updateData.description = options.description;
          if (options.config) updateData.config = JSON.parse(options.config);

          const result = await maintenanceService.updateMaintenanceTask(options.taskId, updateData);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar tarefa de manutenção', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    maintenanceCommand
      .command('delete-task')
      .description('Exclui tarefa de manutenção')
      .requiredOption('-i, --task-id <taskId>', 'ID da tarefa')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --task-id\`: ID da tarefa de manutenção

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance delete-task --task-id 123
  $ npx -y @guerchele/bitbucket-mcp-server maintenance delete-task --task-id 123 --output json

**Descrição:**
  Remove permanentemente uma tarefa de manutenção do sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          await maintenanceService.deleteMaintenanceTask(options.taskId);
          const response = createMcpResponse(
            { message: 'Tarefa de manutenção excluída com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir tarefa de manutenção', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Task Execution
    maintenanceCommand
      .command('run-task')
      .description('Executa tarefa de manutenção')
      .requiredOption('-i, --task-id <taskId>', 'ID da tarefa')
      .option('-f, --force', 'Forçar execução')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --task-id\`: ID da tarefa de manutenção

**Opções disponíveis:**
- \`-f, --force\`: Forçar execução mesmo se a tarefa já estiver em execução
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance run-task --task-id 123
  $ npx -y @guerchele/bitbucket-mcp-server maintenance run-task --task-id 123 --force
  $ npx -y @guerchele/bitbucket-mcp-server maintenance run-task --task-id 123 --output json

**Descrição:**
  Executa manualmente uma tarefa de manutenção no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const result = await maintenanceService.runMaintenanceTask(options.taskId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao executar tarefa de manutenção', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    maintenanceCommand
      .command('list-executions')
      .description('Lista execuções de tarefas')
      .option('-i, --task-id <taskId>', 'ID da tarefa')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-i, --task-id\`: ID da tarefa para filtrar execuções
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status (running, completed, failed, cancelled)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance list-executions
  $ npx -y @guerchele/bitbucket-mcp-server maintenance list-executions --task-id 123 --status completed
  $ npx -y @guerchele/bitbucket-mcp-server maintenance list-executions --limit 20 --output json

**Descrição:**
  Lista o histórico de execuções de tarefas de manutenção no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.taskId) params.taskId = options.taskId;
          if (options.status) params.status = options.status;

          const result = await maintenanceService.listTaskExecutions(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar execuções de tarefas', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    maintenanceCommand
      .command('get-execution')
      .description('Obtém execução de tarefa')
      .requiredOption('-i, --execution-id <executionId>', 'ID da execução')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --execution-id\`: ID da execução da tarefa

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-execution --execution-id 456
  $ npx -y @guerchele/bitbucket-mcp-server maintenance get-execution --execution-id 456 --output json

**Descrição:**
  Obtém informações detalhadas de uma execução específica de tarefa de manutenção no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          const result = await maintenanceService.getTaskExecution(options.executionId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter execução de tarefa', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    maintenanceCommand
      .command('cancel-execution')
      .description('Cancela execução de tarefa')
      .requiredOption('-i, --execution-id <executionId>', 'ID da execução')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --execution-id\`: ID da execução da tarefa

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server maintenance cancel-execution --execution-id 456
  $ npx -y @guerchele/bitbucket-mcp-server maintenance cancel-execution --execution-id 456 --output json

**Descrição:**
  Cancela uma execução de tarefa de manutenção em andamento no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const maintenanceService = new SystemMaintenanceService(
            apiClient,
            Logger.forContext('SystemMaintenanceService')
          );

          await maintenanceService.cancelTaskExecution(options.executionId);
          const response = createMcpResponse(
            { message: 'Execução de tarefa cancelada com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao cancelar execução de tarefa', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center system maintenance commands');
  }
}
