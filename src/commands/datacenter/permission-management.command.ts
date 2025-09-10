/**
 * Data Center Permission Management Commands
 * CLI commands for Bitbucket Data Center Permission Management Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { PermissionManagementService } from '../../services/datacenter/permission-management.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterPermissionManagementCommands {
  private static logger = Logger.forContext('DataCenterPermissionManagementCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de gerenciamento de permissões');

    const permissionCommand = program
      .command('permissions')
      .description('Comandos de gerenciamento de permissões do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server permissions <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Permission Management
    permissionCommand
      .command('list')
      .description('Lista permissões')
      .option('-x, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-t, --type <type>', 'Tipo de permissão')
      .option('-s, --scope <scope>', 'Escopo da permissão')
      .option('-g, --grantee <grantee>', 'Filtrar por usuário ou grupo')
      .option('-j, --project <project>', 'Filtrar por projeto')
      .option('-r, --repository <repository>', 'Filtrar por repositório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-x, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-t, --type\`: Tipo de permissão (PROJECT_READ, PROJECT_WRITE, REPO_READ, etc.)
- \`-s, --scope\`: Escopo da permissão (PROJECT, REPOSITORY, GLOBAL, USER)
- \`-g, --grantee\`: Filtrar por usuário ou grupo
- \`-j, --project\`: Filtrar por projeto
- \`-r, --repository\`: Filtrar por repositório
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions list
  $ npx -y @guerchele/bitbucket-mcp-server permissions list --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server permissions list --type "REPO_READ" --scope "REPOSITORY" --output json
  $ npx -y @guerchele/bitbucket-mcp-server permissions list --grantee "john.doe" --project "MYPROJECT"

**Descrição:**
  Lista todas as permissões do sistema Bitbucket Data Center com opções de filtro e paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.type) params.type = options.type;
          if (options.scope) params.scope = options.scope;
          if (options.grantee) params.grantee = options.grantee;
          if (options.project) params.project = options.project;
          if (options.repository) params.repository = options.repository;

          const result = await permissionService.listPermissions(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar permissões', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('get')
      .description('Obtém permissão por ID')
      .requiredOption('-i, --id <id>', 'ID da permissão')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da permissão

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions get --id 123
  $ npx -y @guerchele/bitbucket-mcp-server permissions get --id 456 --output json

**Descrição:**
  Obtém detalhes de uma permissão específica pelo seu ID no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const result = await permissionService.getPermission(parseInt(options.id));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('grant')
      .description('Concede permissão')
      .requiredOption('-t, --type <type>', 'Tipo de permissão')
      .requiredOption('-s, --scope <scope>', 'Escopo da permissão')
      .requiredOption(
        '-y, --grantee-type <granteeType>',
        'Tipo do destinatário (USER|GROUP|ANONYMOUS|AUTHENTICATED)'
      )
      .requiredOption('-u, --grantee-name <granteeName>', 'Nome do usuário ou grupo')
      .option(
        '-j, --project <project>',
        'Chave do projeto (para permissões de projeto/repositório)'
      )
      .option(
        '-r, --repository <repository>',
        'Slug do repositório (para permissões de repositório)'
      )
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --type\`: Tipo de permissão (PROJECT_READ, PROJECT_WRITE, REPO_READ, etc.)
- \`-s, --scope\`: Escopo da permissão (PROJECT, REPOSITORY, GLOBAL, USER)
- \`-y, --grantee-type\`: Tipo do destinatário (USER, GROUP, ANONYMOUS, AUTHENTICATED)
- \`-u, --grantee-name\`: Nome do usuário ou grupo

**Opções disponíveis:**
- \`-j, --project\`: Chave do projeto (obrigatório para permissões de projeto/repositório)
- \`-r, --repository\`: Slug do repositório (obrigatório para permissões de repositório)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions grant --type "REPO_READ" --scope "REPOSITORY" --grantee-type "USER" --grantee-name "john.doe" --project "MYPROJECT" --repository "my-repo"
  $ npx -y @guerchele/bitbucket-mcp-server permissions grant --type "PROJECT_WRITE" --scope "PROJECT" --grantee-type "GROUP" --grantee-name "developers" --project "MYPROJECT"
  $ npx -y @guerchele/bitbucket-mcp-server permissions grant --type "ADMIN" --scope "GLOBAL" --grantee-type "USER" --grantee-name "admin" --output json

**Descrição:**
  Concede uma permissão específica a um usuário ou grupo em um recurso do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const request: any = {
            type: options.type,
            scope: options.scope,
            grantee: {
              type: options.granteeType,
              [options.granteeType.toLowerCase() === 'user' ? 'user' : 'group']: {
                name: options.granteeName,
              },
            },
          };

          if (options.project || options.repository) {
            request.context = {};
            if (options.project) {
              request.context.project = { key: options.project };
            }
            if (options.repository) {
              request.context.repository = {
                slug: options.repository,
                project: { key: options.project },
              };
            }
          }

          const result = await permissionService.grantPermission(request);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao conceder permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('revoke')
      .description('Revoga permissão por ID')
      .requiredOption('-i, --id <id>', 'ID da permissão')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da permissão

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions revoke --id 123
  $ npx -y @guerchele/bitbucket-mcp-server permissions revoke --id 456 --output json

**Descrição:**
  Revoga uma permissão específica pelo seu ID no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          await permissionService.revokePermission(parseInt(options.id));
          const response = createMcpResponse(
            { message: 'Permissão revogada com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao revogar permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('list-summaries')
      .description('Lista resumos de permissões')
      .option('-x, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-t, --type <type>', 'Tipo de permissão')
      .option('-s, --scope <scope>', 'Escopo da permissão')
      .option('-g, --grantee <grantee>', 'Filtrar por usuário ou grupo')
      .option('-j, --project <project>', 'Filtrar por projeto')
      .option('-r, --repository <repository>', 'Filtrar por repositório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-x, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-t, --type\`: Tipo de permissão (PROJECT_READ, PROJECT_WRITE, REPO_READ, etc.)
- \`-s, --scope\`: Escopo da permissão (PROJECT, REPOSITORY, GLOBAL, USER)
- \`-g, --grantee\`: Filtrar por usuário ou grupo
- \`-j, --project\`: Filtrar por projeto
- \`-r, --repository\`: Filtrar por repositório
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions list-summaries
  $ npx -y @guerchele/bitbucket-mcp-server permissions list-summaries --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server permissions list-summaries --type "REPO_READ" --scope "REPOSITORY" --output json
  $ npx -y @guerchele/bitbucket-mcp-server permissions list-summaries --grantee "john.doe" --project "MYPROJECT"

**Descrição:**
  Lista resumos de permissões com contagens e informações agregadas do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.type) params.type = options.type;
          if (options.scope) params.scope = options.scope;
          if (options.grantee) params.grantee = options.grantee;
          if (options.project) params.project = options.project;
          if (options.repository) params.repository = options.repository;

          const result = await permissionService.listPermissionSummaries(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar resumos de permissões', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Permission Audit
    permissionCommand
      .command('get-audit-logs')
      .description('Obtém logs de auditoria de permissões')
      .option('-x, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --start-date <startDate>', 'Data de início (ISO 8601)')
      .option('-e, --end-date <endDate>', 'Data de fim (ISO 8601)')
      .option('-u, --user <user>', 'Filtrar por usuário')
      .option('-a, --action <action>', 'Filtrar por ação (GRANTED|REVOKED|MODIFIED)')
      .option('-t, --type <type>', 'Filtrar por tipo de permissão')
      .option('-z, --scope <scope>', 'Filtrar por escopo da permissão')
      .option('-j, --project <project>', 'Filtrar por projeto')
      .option('-r, --repository <repository>', 'Filtrar por repositório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-x, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --start-date\`: Data de início (ISO 8601)
- \`-e, --end-date\`: Data de fim (ISO 8601)
- \`-u, --user\`: Filtrar por usuário
- \`-a, --action\`: Filtrar por ação (GRANTED, REVOKED, MODIFIED)
- \`-t, --type\`: Filtrar por tipo de permissão
- \`-z, --scope\`: Filtrar por escopo da permissão
- \`-j, --project\`: Filtrar por projeto
- \`-r, --repository\`: Filtrar por repositório
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-audit-logs
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-audit-logs --start-date "2024-01-01T00:00:00Z" --end-date "2024-01-31T23:59:59Z"
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-audit-logs --user john.doe --action "GRANTED"
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-audit-logs --type "REPO_READ" --scope "REPOSITORY" --output json
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-audit-logs --page 2 --limit 50 --project "MYPROJECT"

**Descrição:**
  Obtém logs de auditoria de permissões com opções de filtro e paginação para monitoramento de segurança.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.startDate) params.fromDate = options.startDate;
          if (options.endDate) params.toDate = options.endDate;
          if (options.user) params.grantee = options.user;
          if (options.action) params.action = options.action;
          if (options.type) params.type = options.type;
          if (options.scope) params.scope = options.scope;
          if (options.project) params.project = options.project;
          if (options.repository) params.repository = options.repository;

          const result = await permissionService.getPermissionAuditLog(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter logs de auditoria de permissões', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Bulk Permission Operations
    permissionCommand
      .command('bulk-grant')
      .description('Concede permissões em lote')
      .requiredOption('-f, --file <file>', 'Arquivo JSON com permissões')
      .option('-d, --dry-run', 'Executa em modo de teste sem aplicar as permissões')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-f, --file\`: Arquivo JSON com permissões

**Opções disponíveis:**
- \`-d, --dry-run\`: Executa em modo de teste sem aplicar as permissões
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions bulk-grant --file permissions.json
  $ npx -y @guerchele/bitbucket-mcp-server permissions bulk-grant --file /path/to/permissions.json --dry-run
  $ npx -y @guerchele/bitbucket-mcp-server permissions bulk-grant --file permissions.json --output json

**Formato do arquivo JSON:**
  {
    "permissions": [
      {
        "type": "REPO_READ",
        "scope": "REPOSITORY",
        "grantee": {
          "type": "USER",
          "user": { "name": "john.doe" }
        },
        "context": {
          "repository": {
            "slug": "my-repo",
            "project": { "key": "MYPROJECT" }
          }
        }
      }
    ],
    "dryRun": false
  }

**Descrição:**
  Concede múltiplas permissões em lote a partir de um arquivo JSON com a lista de permissões.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          // Read and parse the JSON file
          const fs = require('fs');
          const permissions = JSON.parse(fs.readFileSync(options.file, 'utf8'));

          if (options.dryRun) {
            permissions.dryRun = true;
          }

          const result = await permissionService.bulkGrantPermissions(permissions);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao conceder permissões em lote', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Permission Templates
    permissionCommand
      .command('list-templates')
      .description('Lista templates de permissão')
      .option('-x, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-x, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions list-templates
  $ npx -y @guerchele/bitbucket-mcp-server permissions list-templates --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server permissions list-templates --output json

**Descrição:**
  Lista todos os templates de permissão disponíveis no Bitbucket Data Center com opções de paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const result = await permissionService.listPermissionTemplates();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar templates de permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('get-template')
      .description('Obtém template de permissão por ID')
      .requiredOption('-i, --id <id>', 'ID do template')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do template

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-template --id 1
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-template --id 2 --output json

**Descrição:**
  Obtém detalhes de um template de permissão específico pelo seu ID no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const result = await permissionService.getPermissionTemplate(parseInt(options.id));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter template de permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('create-template')
      .description('Cria template de permissão')
      .requiredOption('-n, --name <name>', 'Nome do template')
      .requiredOption('-d, --description <description>', 'Descrição do template')
      .requiredOption('-f, --file <file>', 'Arquivo JSON com permissões do template')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do template
- \`-d, --description\`: Descrição do template
- \`-f, --file\`: Arquivo JSON com permissões do template

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions create-template --name "Developer Template" --description "Template para desenvolvedores" --file permissions.json
  $ npx -y @guerchele/bitbucket-mcp-server permissions create-template --name "Admin Template" --description "Template para administradores" --file admin-permissions.json --output json

**Formato do arquivo JSON:**
  [
    {
      "type": "REPO_READ",
      "scope": "REPOSITORY",
      "grantee": {
        "type": "GROUP",
        "group": { "name": "developers" }
      }
    },
    {
      "type": "REPO_WRITE",
      "scope": "REPOSITORY",
      "grantee": {
        "type": "GROUP",
        "group": { "name": "developers" }
      }
    }
  ]

**Descrição:**
  Cria um novo template de permissão com um conjunto predefinido de permissões no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          // Read and parse the JSON file
          const fs = require('fs');
          const permissions = JSON.parse(fs.readFileSync(options.file, 'utf8'));

          const result = await permissionService.createPermissionTemplate({
            name: options.name,
            description: options.description,
            permissions: permissions,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar template de permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('update-template')
      .description('Atualiza template de permissão')
      .requiredOption('-i, --id <id>', 'ID do template')
      .requiredOption('-n, --name <name>', 'Nome do template')
      .requiredOption('-d, --description <description>', 'Descrição do template')
      .requiredOption('-f, --file <file>', 'Arquivo JSON com permissões do template')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do template
- \`-n, --name\`: Nome do template
- \`-d, --description\`: Descrição do template
- \`-f, --file\`: Arquivo JSON com permissões do template

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions update-template --id 1 --name "Updated Developer Template" --description "Template atualizado para desenvolvedores" --file permissions.json
  $ npx -y @guerchele/bitbucket-mcp-server permissions update-template --id 2 --name "New Admin Template" --description "Template para administradores" --file admin-permissions.json --output json

**Formato do arquivo JSON:**
  [
    {
      "type": "REPO_READ",
      "scope": "REPOSITORY",
      "grantee": {
        "type": "GROUP",
        "group": { "name": "developers" }
      }
    }
  ]

**Descrição:**
  Atualiza um template de permissão existente com novo nome, descrição e conjunto de permissões.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          // Read and parse the JSON file
          const fs = require('fs');
          const permissions = JSON.parse(fs.readFileSync(options.file, 'utf8'));

          const result = await permissionService.updatePermissionTemplate(parseInt(options.id), {
            name: options.name,
            description: options.description,
            permissions: permissions,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar template de permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('delete-template')
      .description('Exclui template de permissão')
      .requiredOption('-i, --id <id>', 'ID do template')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do template

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions delete-template --id 1
  $ npx -y @guerchele/bitbucket-mcp-server permissions delete-template --id 2 --output json

**Descrição:**
  Exclui um template de permissão específico pelo seu ID no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          await permissionService.deletePermissionTemplate(parseInt(options.id));
          const response = createMcpResponse(
            { message: 'Template de permissão excluído com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir template de permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('apply-template')
      .description('Aplica template de permissão')
      .requiredOption('-i, --id <id>', 'ID do template')
      .option('-j, --project <project>', 'Chave do projeto (para aplicar em projeto)')
      .option('-r, --repository <repository>', 'Slug do repositório (para aplicar em repositório)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do template

**Opções disponíveis:**
- \`-j, --project\`: Chave do projeto (para aplicar em projeto)
- \`-r, --repository\`: Slug do repositório (para aplicar em repositório)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions apply-template --id 1 --project "MYPROJECT"
  $ npx -y @guerchele/bitbucket-mcp-server permissions apply-template --id 2 --project "MYPROJECT" --repository "my-repo"
  $ npx -y @guerchele/bitbucket-mcp-server permissions apply-template --id 3 --output json

**Descrição:**
  Aplica um template de permissão existente a um recurso específico (projeto ou repositório) do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const context: any = {};
          if (options.project) context.project = options.project;
          if (options.repository) context.repository = options.repository;

          await permissionService.applyPermissionTemplate(parseInt(options.id), context);
          const response = createMcpResponse(
            { message: 'Template de permissão aplicado com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao aplicar template de permissão', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Project and Repository Permissions
    permissionCommand
      .command('get-project-permissions')
      .description('Obtém permissões de projeto')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .option('-x, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-t, --type <type>', 'Tipo de permissão')
      .option('-s, --scope <scope>', 'Escopo da permissão')
      .option('-g, --grantee <grantee>', 'Filtrar por usuário ou grupo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto

**Opções disponíveis:**
- \`-x, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-t, --type\`: Tipo de permissão (PROJECT_READ, PROJECT_WRITE, etc.)
- \`-s, --scope\`: Escopo da permissão (PROJECT, REPOSITORY, GLOBAL, USER)
- \`-g, --grantee\`: Filtrar por usuário ou grupo
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-project-permissions --project "MYPROJECT"
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-project-permissions --project "MYPROJECT" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-project-permissions --project "MYPROJECT" --type "PROJECT_READ" --output json
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-project-permissions --project "MYPROJECT" --grantee "john.doe"

**Descrição:**
  Obtém todas as permissões associadas a um projeto específico no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.type) params.type = options.type;
          if (options.scope) params.scope = options.scope;
          if (options.grantee) params.grantee = options.grantee;

          const result = await permissionService.getProjectPermissions(options.project, params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter permissões do projeto', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    permissionCommand
      .command('get-repository-permissions')
      .description('Obtém permissões de repositório')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repository <repository>', 'Slug do repositório')
      .option('-x, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-t, --type <type>', 'Tipo de permissão')
      .option('-s, --scope <scope>', 'Escopo da permissão')
      .option('-g, --grantee <grantee>', 'Filtrar por usuário ou grupo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repository\`: Slug do repositório

**Opções disponíveis:**
- \`-x, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-t, --type\`: Tipo de permissão (REPO_READ, REPO_WRITE, etc.)
- \`-s, --scope\`: Escopo da permissão (PROJECT, REPOSITORY, GLOBAL, USER)
- \`-g, --grantee\`: Filtrar por usuário ou grupo
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-repository-permissions --project "MYPROJECT" --repository "my-repo"
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-repository-permissions --project "MYPROJECT" --repository "my-repo" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-repository-permissions --project "MYPROJECT" --repository "my-repo" --type "REPO_READ" --output json
  $ npx -y @guerchele/bitbucket-mcp-server permissions get-repository-permissions --project "MYPROJECT" --repository "my-repo" --grantee "john.doe"

**Descrição:**
  Obtém todas as permissões associadas a um repositório específico no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const permissionService = new PermissionManagementService(
            apiClient,
            Logger.forContext('PermissionManagementService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.type) params.type = options.type;
          if (options.scope) params.scope = options.scope;
          if (options.grantee) params.grantee = options.grantee;

          const result = await permissionService.getRepositoryPermissions(
            options.project,
            options.repository,
            params
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter permissões do repositório', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center permission management commands');
  }
}
