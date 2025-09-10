/**
 * Data Center Other Operations Commands
 * CLI commands for Bitbucket Data Center Other Operations Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { OtherOperationsService } from '../../services/datacenter/other-operations.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterOtherOperationsCommands {
  private static logger = Logger.forContext('DataCenterOtherOperationsCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de outras operações');

    const opsCommand = program
      .command('ops')
      .description('Comandos de outras operações do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server ops <command> --help' para mais informações sobre um comando específico.
      `
      );

    // System Information
    opsCommand
      .command('get-system-info')
      .description('Obtém informações do sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops get-system-info
  $ npx -y @guerchele/bitbucket-mcp-server ops get-system-info --output json

**Descrição:**
  Obtém informações detalhadas sobre o sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getSystemInformation();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter informações do sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('health-check')
      .description('Verifica saúde do sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops health-check
  $ npx -y @guerchele/bitbucket-mcp-server ops health-check --output json

**Descrição:**
  Verifica a saúde e status do sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getHealthCheck();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao verificar saúde do sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('get-metrics')
      .description('Obtém métricas do sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops get-metrics
  $ npx -y @guerchele/bitbucket-mcp-server ops get-metrics --output json

**Descrição:**
  Obtém métricas de performance e uso do sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getMetrics();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter métricas do sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Configuration Management
    opsCommand
      .command('list-configurations')
      .description('Lista configurações do sistema')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-c, --category <category>', 'Filtrar por categoria')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-c, --category\`: Filtrar por categoria
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops list-configurations
  $ npx -y @guerchele/bitbucket-mcp-server ops list-configurations --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server ops list-configurations --category "security" --output json

**Descrição:**
  Lista todas as configurações do sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.category) params.category = options.category;

          const result = await opsService.listConfigurations(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar configurações do sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('get-configuration')
      .description('Obtém configuração específica')
      .requiredOption('-k, --key <key>', 'Chave da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --key\`: Chave da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops get-configuration --key "system.timeout"
  $ npx -y @guerchele/bitbucket-mcp-server ops get-configuration --key "security.ssl.enabled" --output json

**Descrição:**
  Obtém o valor de uma configuração específica do sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getConfiguration(options.key);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('update-configuration')
      .description('Atualiza configuração')
      .requiredOption('-k, --key <key>', 'Chave da configuração')
      .requiredOption('-v, --value <value>', 'Valor da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --key\`: Chave da configuração
- \`-v, --value\`: Valor da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops update-configuration --key "system.timeout" --value "300"
  $ npx -y @guerchele/bitbucket-mcp-server ops update-configuration --key "security.ssl.enabled" --value "true" --output json

**Descrição:**
  Atualiza o valor de uma configuração específica do sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.updateConfiguration(options.key, {
            value: options.value,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar configuração', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('create-configuration')
      .description('Cria nova configuração')
      .requiredOption('-k, --key <key>', 'Chave da configuração')
      .requiredOption('-v, --value <value>', 'Valor da configuração')
      .option('-d, --description <description>', 'Descrição da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --key\`: Chave da configuração
- \`-v, --value\`: Valor da configuração

**Opções disponíveis:**
- \`-d, --description\`: Descrição da configuração
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops create-configuration --key "system.timeout" --value "300"
  $ npx -y @guerchele/bitbucket-mcp-server ops create-configuration --key "security.ssl.enabled" --value "true" --description "Enable SSL"

**Descrição:**
  Cria uma nova configuração no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const request = {
            key: options.key,
            value: options.value,
            type: 'STRING' as const,
            description: options.description,
            category: 'system',
          };

          const result = await opsService.createConfiguration(request);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar configuração', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('delete-configuration')
      .description('Remove configuração')
      .requiredOption('-k, --key <key>', 'Chave da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --key\`: Chave da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops delete-configuration --key "system.timeout"
  $ npx -y @guerchele/bitbucket-mcp-server ops delete-configuration --key "security.ssl.enabled" --output json

**Descrição:**
  Remove uma configuração específica do sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          await opsService.deleteConfiguration(options.key);
          console.log('Configuração removida com sucesso');
        } catch (error) {
          this.logger.error('Erro ao remover configuração', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Backup Management
    opsCommand
      .command('list-backup-configurations')
      .description('Lista configurações de backup')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops list-backup-configurations
  $ npx -y @guerchele/bitbucket-mcp-server ops list-backup-configurations --output json

**Descrição:**
  Lista todas as configurações de backup do sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.listBackupConfigurations();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar configurações de backup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('create-backup')
      .description('Cria backup do sistema')
      .requiredOption('-n, --name <name>', 'Nome do backup')
      .option('-d, --description <description>', 'Descrição do backup')
      .option('-t, --type <type>', 'Tipo do backup (full, incremental)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do backup

**Opções disponíveis:**
- \`-d, --description\`: Descrição do backup
- \`-t, --type\`: Tipo do backup (full, incremental)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops create-backup --name "daily-backup"
  $ npx -y @guerchele/bitbucket-mcp-server ops create-backup --name "weekly-backup" --description "Weekly system backup" --type "full"

**Descrição:**
  Cria um novo backup do sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const backupRequest = {
            name: options.name,
            description: options.description,
            schedule: {
              enabled: true,
              cronExpression: '0 2 * * *',
              timezone: 'UTC',
            },
            location: {
              type: 'LOCAL' as const,
              path: '/backups',
            },
            retention: {
              days: 30,
              maxBackups: 10,
            },
          };

          const result = await opsService.createBackupConfiguration(backupRequest);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar backup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('list-backups')
      .description('Lista backups do sistema')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops list-backups
  $ npx -y @guerchele/bitbucket-mcp-server ops list-backups --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server ops list-backups --status "completed" --output json

**Descrição:**
  Lista todos os backups do sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;

          // Para listar backups, precisamos de um backupId, mas como não temos, vamos listar as configurações de backup
          const result = await opsService.listBackupConfigurations();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar backups', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('get-backup-configuration')
      .description('Obtém configuração de backup específica')
      .requiredOption('-i, --backup-id <backupId>', 'ID da configuração de backup')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --backup-id\`: ID da configuração de backup

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops get-backup-configuration --backup-id "1"
  $ npx -y @guerchele/bitbucket-mcp-server ops get-backup-configuration --backup-id "2" --output json

**Descrição:**
  Obtém informações detalhadas sobre uma configuração de backup específica.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getBackupConfiguration(parseInt(options.backupId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração de backup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('update-backup-configuration')
      .description('Atualiza configuração de backup')
      .requiredOption('-i, --backup-id <backupId>', 'ID da configuração de backup')
      .requiredOption('-n, --name <name>', 'Nome da configuração')
      .option('-d, --description <description>', 'Descrição da configuração')
      .option('-s, --schedule <schedule>', 'Agendamento do backup')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --backup-id\`: ID da configuração de backup
- \`-n, --name\`: Nome da configuração

**Opções disponíveis:**
- \`-d, --description\`: Descrição da configuração
- \`-s, --schedule\`: Agendamento do backup
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops update-backup-configuration --backup-id "1" --name "Daily Backup"
  $ npx -y @guerchele/bitbucket-mcp-server ops update-backup-configuration --backup-id "2" --name "Weekly Backup" --schedule "0 2 * * 0"

**Descrição:**
  Atualiza uma configuração de backup existente.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const request = {
            name: options.name,
            description: options.description,
            schedule: {
              enabled: true,
              cronExpression: options.schedule || '0 2 * * *',
              timezone: 'UTC',
            },
            location: {
              type: 'LOCAL' as const,
              path: '/backups',
            },
            retention: {
              days: 30,
              maxBackups: 10,
            },
          };

          const result = await opsService.updateBackupConfiguration(
            parseInt(options.backupId),
            request
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar configuração de backup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('delete-backup-configuration')
      .description('Remove configuração de backup')
      .requiredOption('-i, --backup-id <backupId>', 'ID da configuração de backup')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --backup-id\`: ID da configuração de backup

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops delete-backup-configuration --backup-id "1"
  $ npx -y @guerchele/bitbucket-mcp-server ops delete-backup-configuration --backup-id "2" --output json

**Descrição:**
  Remove uma configuração de backup específica.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          await opsService.deleteBackupConfiguration(parseInt(options.backupId));
          console.log('Configuração de backup removida com sucesso');
        } catch (error) {
          this.logger.error('Erro ao remover configuração de backup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('start-backup')
      .description('Inicia backup')
      .requiredOption('-i, --backup-id <backupId>', 'ID da configuração de backup')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --backup-id\`: ID da configuração de backup

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops start-backup --backup-id "1"
  $ npx -y @guerchele/bitbucket-mcp-server ops start-backup --backup-id "2" --output json

**Descrição:**
  Inicia um backup usando uma configuração específica.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.startBackup(parseInt(options.backupId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao iniciar backup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('get-backup-results')
      .description('Obtém resultados de backup')
      .requiredOption('-i, --backup-id <backupId>', 'ID da configuração de backup')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --backup-id\`: ID da configuração de backup

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops get-backup-results --backup-id "1"
  $ npx -y @guerchele/bitbucket-mcp-server ops get-backup-results --backup-id "2" --output json

**Descrição:**
  Obtém os resultados de backups executados para uma configuração específica.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getBackupResults(parseInt(options.backupId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter resultados de backup', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Log Management
    opsCommand
      .command('list-logs')
      .description('Lista logs do sistema')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('--level <level>', 'Filtrar por nível de log')
      .option('-s, --start-date <startDate>', 'Data de início (ISO 8601)')
      .option('-e, --end-date <endDate>', 'Data de fim (ISO 8601)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`--level\`: Filtrar por nível de log
- \`-s, --start-date\`: Data de início (ISO 8601)
- \`-e, --end-date\`: Data de fim (ISO 8601)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops list-logs
  $ npx -y @guerchele/bitbucket-mcp-server ops list-logs --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server ops list-logs --level "ERROR" --start-date "2024-01-01" --output json

**Descrição:**
  Lista logs do sistema Bitbucket Data Center com opções de filtro.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.level) params.level = options.level;
          if (options.startDate) params.startDate = options.startDate;
          if (options.endDate) params.endDate = options.endDate;

          const result = await opsService.getLogEntries(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar logs', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('get-log-entry')
      .description('Obtém entrada de log específica')
      .requiredOption('-i, --log-id <logId>', 'ID da entrada de log')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --log-id\`: ID da entrada de log

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops get-log-entry --log-id "123"
  $ npx -y @guerchele/bitbucket-mcp-server ops get-log-entry --log-id "456" --output json

**Descrição:**
  Obtém informações detalhadas sobre uma entrada de log específica.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getLogEntry(parseInt(options.logId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter entrada de log', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Plugin Management
    opsCommand
      .command('list-plugins')
      .description('Lista plugins do sistema')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops list-plugins
  $ npx -y @guerchele/bitbucket-mcp-server ops list-plugins --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server ops list-plugins --status "enabled" --output json

**Descrição:**
  Lista todos os plugins instalados no sistema Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;

          const result = await opsService.listPlugins(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar plugins', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('get-plugin')
      .description('Obtém informações do plugin')
      .requiredOption('-k, --plugin-key <pluginKey>', 'Chave do plugin')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --plugin-key\`: Chave do plugin

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops get-plugin --plugin-key "com.atlassian.bitbucket.plugins.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server ops get-plugin --plugin-key "com.atlassian.bitbucket.plugins.bitbucket-branch-permissions" --output json

**Descrição:**
  Obtém informações detalhadas sobre um plugin específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.getPlugin(options.pluginKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter informações do plugin', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('enable-plugin')
      .description('Habilita plugin')
      .requiredOption('-k, --plugin-key <pluginKey>', 'Chave do plugin')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --plugin-key\`: Chave do plugin

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops enable-plugin --plugin-key "com.atlassian.bitbucket.plugins.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server ops enable-plugin --plugin-key "com.atlassian.bitbucket.plugins.bitbucket-branch-permissions" --output json

**Descrição:**
  Habilita um plugin específico no sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          await opsService.enablePlugin(options.pluginKey);
          console.log('Plugin habilitado com sucesso');
        } catch (error) {
          this.logger.error('Erro ao habilitar plugin', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('disable-plugin')
      .description('Desabilita plugin')
      .requiredOption('-k, --plugin-key <pluginKey>', 'Chave do plugin')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --plugin-key\`: Chave do plugin

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops disable-plugin --plugin-key "com.atlassian.bitbucket.plugins.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server ops disable-plugin --plugin-key "com.atlassian.bitbucket.plugins.bitbucket-branch-permissions" --output json

**Descrição:**
  Desabilita um plugin específico no sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          await opsService.disablePlugin(options.pluginKey);
          console.log('Plugin desabilitado com sucesso');
        } catch (error) {
          this.logger.error('Erro ao desabilitar plugin', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // System Management
    opsCommand
      .command('restart-system')
      .description('Reinicia o sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops restart-system
  $ npx -y @guerchele/bitbucket-mcp-server ops restart-system --output json

**Descrição:**
  Reinicia o sistema Bitbucket Data Center. ATENÇÃO: Esta operação irá reiniciar o sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.restartSystem();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao reiniciar sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    opsCommand
      .command('shutdown-system')
      .description('Desliga o sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ops shutdown-system
  $ npx -y @guerchele/bitbucket-mcp-server ops shutdown-system --output json

**Descrição:**
  Desliga o sistema Bitbucket Data Center. ATENÇÃO: Esta operação irá desligar o sistema.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const opsService = new OtherOperationsService(
            apiClient,
            Logger.forContext('OtherOperationsService')
          );

          const result = await opsService.shutdownSystem();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao desligar sistema', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center other operations commands');
  }
}
