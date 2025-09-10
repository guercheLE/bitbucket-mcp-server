/**
 * Data Center Security Commands
 * CLI commands for Bitbucket Data Center Security Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { SecurityService } from '../../services/datacenter/security.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterSecurityCommands {
  private static logger = Logger.forContext('DataCenterSecurityCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de segurança do Data Center');

    const securityCommand = program
      .command('security')
      .description('Comandos de segurança do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server security <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Security Audit
    securityCommand
      .command('get-audit-logs')
      .description('Obtém logs de auditoria de segurança')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --start-date <startDate>', 'Data de início (ISO 8601)')
      .option('-e, --end-date <endDate>', 'Data de fim (ISO 8601)')
      .option('-u, --user <user>', 'Filtrar por usuário')
      .option('-a, --action <action>', 'Filtrar por ação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --start-date\`: Data de início (ISO 8601)
- \`-e, --end-date\`: Data de fim (ISO 8601)
- \`-u, --user\`: Filtrar por usuário
- \`-a, --action\`: Filtrar por ação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security get-audit-logs
  $ npx -y @guerchele/bitbucket-mcp-server security get-audit-logs --start-date "2024-01-01T00:00:00Z" --end-date "2024-01-31T23:59:59Z"
  $ npx -y @guerchele/bitbucket-mcp-server security get-audit-logs --user john.doe --action "LOGIN"

**Descrição:**
  Obtém logs de auditoria de segurança com opções de filtro e paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.startDate) params.startDate = options.startDate;
          if (options.endDate) params.endDate = options.endDate;
          if (options.user) params.user = options.user;
          if (options.action) params.action = options.action;

          const result = await securityService.getSecurityAuditLogs(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter logs de auditoria de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Security Configuration
    securityCommand
      .command('get-configuration')
      .description('Obtém configuração de segurança')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security get-configuration
  $ npx -y @guerchele/bitbucket-mcp-server security get-configuration --output json

**Descrição:**
  Obtém a configuração atual de segurança do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const result = await securityService.getSecurityConfiguration();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Security Metrics
    securityCommand
      .command('get-metrics')
      .description('Obtém métricas de segurança')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security get-metrics
  $ npx -y @guerchele/bitbucket-mcp-server security get-metrics --output json

**Descrição:**
  Obtém métricas de segurança do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const result = await securityService.getSecurityMetrics();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter métricas de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Security Policies
    securityCommand
      .command('list-policies')
      .description('Lista políticas de segurança')
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
- \`-s, --status\`: Filtrar por status da política
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security list-policies
  $ npx -y @guerchele/bitbucket-mcp-server security list-policies --status ACTIVE
  $ npx -y @guerchele/bitbucket-mcp-server security list-policies --page 2 --limit 20

**Descrição:**
  Lista todas as políticas de segurança configuradas no Bitbucket Data Center com opções de filtro e paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;

          const result = await securityService.listSecurityPolicies(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar políticas de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('create-policy')
      .description('Cria política de segurança')
      .requiredOption('-n, --name <name>', 'Nome da política')
      .requiredOption('-d, --description <description>', 'Descrição da política')
      .requiredOption('-r, --rules <rules>', 'Regras da política (JSON)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da política de segurança
- \`-d, --description\`: Descrição da política
- \`-r, --rules\`: Regras da política em formato JSON

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security create-policy --name "Política de Acesso" --description "Controla acesso ao repositório" --rules '{"type": "ACCESS_CONTROL", "enabled": true}'
  $ npx -y @guerchele/bitbucket-mcp-server security create-policy --name "Política de Senha" --description "Política de senhas seguras" --rules '{"minLength": 8, "requireSpecialChars": true}'

**Descrição:**
  Cria uma nova política de segurança personalizada no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const result = await securityService.createSecurityPolicy({
            name: options.name,
            description: options.description,
            rules: JSON.parse(options.rules),
            type: 'CUSTOM' as any,
            scope: 'GLOBAL' as any,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar política de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('get-policy')
      .description('Obtém política de segurança')
      .requiredOption('-i, --policy-id <policyId>', 'ID da política')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --policy-id\`: ID da política de segurança

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security get-policy --policy-id 123
  $ npx -y @guerchele/bitbucket-mcp-server security get-policy --policy-id 123 --output json

**Descrição:**
  Obtém detalhes de uma política de segurança específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const result = await securityService.getSecurityPolicy(options.policyId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter política de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('update-policy')
      .description('Atualiza política de segurança')
      .requiredOption('-i, --policy-id <policyId>', 'ID da política')
      .option('-n, --name <name>', 'Nome da política')
      .option('-d, --description <description>', 'Descrição da política')
      .option('-r, --rules <rules>', 'Regras da política (JSON)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --policy-id\`: ID da política de segurança

**Opções disponíveis:**
- \`-n, --name\`: Novo nome da política
- \`-d, --description\`: Nova descrição da política
- \`-r, --rules\`: Novas regras da política em formato JSON
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security update-policy --policy-id 123 --name "Política Atualizada"
  $ npx -y @guerchele/bitbucket-mcp-server security update-policy --policy-id 123 --rules '{"enabled": false}'
  $ npx -y @guerchele/bitbucket-mcp-server security update-policy --policy-id 123 --name "Nova Política" --description "Descrição atualizada"

**Descrição:**
  Atualiza uma política de segurança existente no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.description) updateData.description = options.description;
          if (options.rules) updateData.rules = JSON.parse(options.rules);

          const result = await securityService.updateSecurityPolicy(options.policyId, updateData);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar política de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('delete-policy')
      .description('Exclui política de segurança')
      .requiredOption('-i, --policy-id <policyId>', 'ID da política')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --policy-id\`: ID da política de segurança

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security delete-policy --policy-id 123
  $ npx -y @guerchele/bitbucket-mcp-server security delete-policy --policy-id 123 --output json

**Descrição:**
  Exclui permanentemente uma política de segurança do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          await securityService.deleteSecurityPolicy(options.policyId);
          const response = createMcpResponse(
            { message: 'Política de segurança excluída com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir política de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Security Scans
    securityCommand
      .command('list-scans')
      .description('Lista scans de segurança')
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
- \`-s, --status\`: Filtrar por status do scan
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security list-scans
  $ npx -y @guerchele/bitbucket-mcp-server security list-scans --status COMPLETED
  $ npx -y @guerchele/bitbucket-mcp-server security list-scans --page 2 --limit 20

**Descrição:**
  Lista todos os scans de segurança executados no Bitbucket Data Center com opções de filtro e paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;

          const result = await securityService.listSecurityScans(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar scans de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('create-scan')
      .description('Cria scan de segurança')
      .requiredOption('-t, --type <type>', 'Tipo do scan')
      .requiredOption('-g, --target <target>', 'Alvo do scan')
      .option('-c, --config <config>', 'Configuração do scan (JSON)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --type\`: Tipo do scan de segurança
- \`-g, --target\`: Alvo do scan (repositório, projeto, etc.)

**Opções disponíveis:**
- \`-c, --config\`: Configuração personalizada do scan em formato JSON
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security create-scan --type VULNERABILITY --target "PROJECT_KEY"
  $ npx -y @guerchele/bitbucket-mcp-server security create-scan --type SECRET_SCAN --target "REPO_SLUG" --config '{"depth": "deep"}'
  $ npx -y @guerchele/bitbucket-mcp-server security create-scan --type DEPENDENCY_CHECK --target "PROJECT_KEY" --output json

**Descrição:**
  Cria e executa um novo scan de segurança no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const scanData: any = {
            type: options.type,
            target: options.target,
          };

          if (options.config) {
            scanData.config = JSON.parse(options.config);
          }

          const result = await securityService.createSecurityScan(scanData);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar scan de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('get-scan')
      .description('Obtém scan de segurança')
      .requiredOption('-i, --scan-id <scanId>', 'ID do scan')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --scan-id\`: ID do scan de segurança

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security get-scan --scan-id 123
  $ npx -y @guerchele/bitbucket-mcp-server security get-scan --scan-id 123 --output json

**Descrição:**
  Obtém detalhes de um scan de segurança específico no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const result = await securityService.getSecurityScan(options.scanId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter scan de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Security Violations
    securityCommand
      .command('list-violations')
      .description('Lista violações de segurança')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --severity <severity>', 'Filtrar por severidade')
      .option('-t, --type <type>', 'Filtrar por tipo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --severity\`: Filtrar por severidade (CRITICAL, HIGH, MEDIUM, LOW)
- \`-t, --type\`: Filtrar por tipo de violação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security list-violations
  $ npx -y @guerchele/bitbucket-mcp-server security list-violations --severity HIGH
  $ npx -y @guerchele/bitbucket-mcp-server security list-violations --type VULNERABILITY --severity CRITICAL
  $ npx -y @guerchele/bitbucket-mcp-server security list-violations --page 2 --limit 20

**Descrição:**
  Lista todas as violações de segurança detectadas no Bitbucket Data Center com opções de filtro e paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.severity) params.severity = options.severity;
          if (options.type) params.type = options.type;

          const result = await securityService.listSecurityViolations(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar violações de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('get-violation')
      .description('Obtém violação de segurança')
      .requiredOption('-i, --violation-id <violationId>', 'ID da violação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --violation-id\`: ID da violação de segurança

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security get-violation --violation-id 123
  $ npx -y @guerchele/bitbucket-mcp-server security get-violation --violation-id 123 --output json

**Descrição:**
  Obtém detalhes de uma violação de segurança específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const result = await securityService.getSecurityViolation(options.violationId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter violação de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    securityCommand
      .command('update-violation')
      .description('Atualiza violação de segurança')
      .requiredOption('-i, --violation-id <violationId>', 'ID da violação')
      .option('-s, --status <status>', 'Status da violação')
      .option('-n, --notes <notes>', 'Notas sobre a violação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --violation-id\`: ID da violação de segurança

**Opções disponíveis:**
- \`-s, --status\`: Status da violação (RESOLVED, ACKNOWLEDGED, FALSE_POSITIVE, etc.)
- \`-n, --notes\`: Notas ou comentários sobre a violação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server security update-violation --violation-id 123 --status RESOLVED
  $ npx -y @guerchele/bitbucket-mcp-server security update-violation --violation-id 123 --notes "Violação corrigida"
  $ npx -y @guerchele/bitbucket-mcp-server security update-violation --violation-id 123 --status ACKNOWLEDGED --notes "Em análise"

**Descrição:**
  Atualiza o status e/ou notas de uma violação de segurança no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const securityService = new SecurityService(
            apiClient,
            Logger.forContext('SecurityService')
          );

          const updateData: any = {};
          if (options.status) updateData.status = options.status;
          if (options.notes) updateData.notes = options.notes;

          const result = await securityService.updateSecurityViolation(
            options.violationId,
            updateData
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar violação de segurança', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center security commands');
  }
}
