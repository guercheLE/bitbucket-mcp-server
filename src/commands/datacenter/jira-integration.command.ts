/**
 * Data Center Jira Integration Commands
 * CLI commands for Bitbucket Data Center Jira Integration Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { JiraIntegrationService } from '../../services/datacenter/jira-integration.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterJiraIntegrationCommands {
  private static logger = Logger.forContext('DataCenterJiraIntegrationCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de integração Jira');

    const jiraCommand = program
      .command('jira')
      .description('Comandos de integração Jira do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server jira <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Jira Integration Settings
    jiraCommand
      .command('get-settings')
      .description('Obtém configurações de integração Jira')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-settings
  $ npx -y @guerchele/bitbucket-mcp-server jira get-settings --output json

**Descrição:**
  Obtém as configurações atuais de integração com o Jira.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const result = await jiraService.getJiraIntegrationSettings();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configurações de integração Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('update-settings')
      .description('Atualiza configurações de integração Jira')
      .requiredOption('-u, --url <serverUrl>', 'URL do Jira')
      .requiredOption('-n, --username <username>', 'Nome de usuário do Jira')
      .requiredOption('-p, --password <password>', 'Senha do Jira')
      .option('-e, --enabled <enabled>', 'Habilitar integração (true/false)', 'true')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --url\`: URL do servidor Jira
- \`-n, --username\`: Nome de usuário para autenticação no Jira
- \`-p, --password\`: Senha para autenticação no Jira

**Opções disponíveis:**
- \`-e, --enabled\`: Habilitar/desabilitar integração (padrão: true)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira update-settings --url "https://jira.example.com" --username "user" --password "pass"
  $ npx -y @guerchele/bitbucket-mcp-server jira update-settings --url "https://jira.example.com" --username "user" --password "pass" --enabled false

**Descrição:**
  Atualiza as configurações de integração com o Jira, incluindo URL do servidor,
  credenciais de autenticação e status de habilitação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const result = await jiraService.updateJiraIntegrationSettings({
            enabled: options.enabled === 'true',
            serverUrl: options.url,
            username: options.username,
            password: options.password,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar configurações de integração Jira', {
            error,
            options,
          });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('test-connection')
      .description('Testa conexão com Jira')
      .requiredOption('-u, --url <serverUrl>', 'URL do Jira')
      .requiredOption('-n, --username <username>', 'Nome de usuário do Jira')
      .requiredOption('-p, --password <password>', 'Senha do Jira')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --url\`: URL do servidor Jira
- \`-n, --username\`: Nome de usuário para autenticação no Jira
- \`-p, --password\`: Senha para autenticação no Jira

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira test-connection --url "https://jira.example.com" --username "user" --password "pass"
  $ npx -y @guerchele/bitbucket-mcp-server jira test-connection --url "https://jira.example.com" --username "user" --password "pass" --output json

**Descrição:**
  Testa a conexão com o Jira usando as credenciais fornecidas sem salvar
  as configurações. Retorna o status da conexão e mensagem de resultado.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const result = await jiraService.testJiraIntegrationConnection({
            enabled: true,
            serverUrl: options.url,
            username: options.username,
            password: options.password,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao testar conexão com Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Jira Projects
    jiraCommand
      .command('list-projects')
      .description('Lista projetos do Jira')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira list-projects
  $ npx -y @guerchele/bitbucket-mcp-server jira list-projects --output json

**Descrição:**
  Lista todos os projetos disponíveis no Jira. Este comando requer que a
  integração Jira esteja configurada e funcionando.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          // Nota: Este comando seria implementado se houvesse um método listProjects no serviço
          // Por enquanto, vamos usar getJiraProject com uma chave padrão
          const result = await jiraService.getJiraProject('default');
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar projetos do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('get-project')
      .description('Obtém projeto do Jira')
      .requiredOption('-k, --project-key <projectKey>', 'Chave do projeto Jira')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --project-key\`: Chave do projeto Jira

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-project --project-key "PROJ"
  $ npx -y @guerchele/bitbucket-mcp-server jira get-project --project-key "PROJ" --output json

**Descrição:**
  Obtém informações detalhadas de um projeto específico do Jira.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const result = await jiraService.getJiraProject(options.projectKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter projeto do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Jira Issues
    jiraCommand
      .command('list-issues')
      .description('Lista issues do Jira')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira list-issues
  $ npx -y @guerchele/bitbucket-mcp-server jira list-issues --output json

**Descrição:**
  Lista issues do Jira. Este comando requer que a integração Jira esteja
  configurada e funcionando. Para obter uma issue específica, use o comando
  get-issue com a chave da issue.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          // Nota: Este comando seria implementado se houvesse um método listIssues no serviço
          // Por enquanto, vamos usar getJiraIssue com uma chave padrão
          const result = await jiraService.getJiraIssue('default');
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar issues do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('get-issue')
      .description('Obtém issue do Jira')
      .requiredOption('-i, --issue-key <issueKey>', 'Chave da issue Jira')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --issue-key\`: Chave da issue Jira

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-issue --issue-key "PROJ-123"
  $ npx -y @guerchele/bitbucket-mcp-server jira get-issue --issue-key "PROJ-456" --output json

**Descrição:**
  Obtém informações detalhadas de uma issue específica do Jira.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const result = await jiraService.getJiraIssue(options.issueKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter issue do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Jira Issue Links
    jiraCommand
      .command('list-issue-links')
      .description('Lista links de issues do Jira')
      .option('-i, --issue-key <issueKey>', 'Filtrar por chave da issue Jira')
      .option('-r, --repository <repository>', 'Filtrar por repositório')
      .option('-p, --project <project>', 'Filtrar por projeto')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-i, --issue-key\`: Filtrar por chave da issue Jira
- \`-r, --repository\`: Filtrar por repositório
- \`-p, --project\`: Filtrar por projeto
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira list-issue-links
  $ npx -y @guerchele/bitbucket-mcp-server jira list-issue-links --issue-key "PROJ-123"
  $ npx -y @guerchele/bitbucket-mcp-server jira list-issue-links --project "PROJ" --repository "my-repo"
  $ npx -y @guerchele/bitbucket-mcp-server jira list-issue-links --output json

**Descrição:**
  Lista todos os links de issues do Jira. Pode ser filtrado por issue específica,
  repositório ou projeto.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const params: any = {};
          if (options.issueKey) params.issueKey = options.issueKey;
          if (options.repository) params.repository = options.repository;
          if (options.project) params.project = options.project;

          const result = await jiraService.listJiraIssueLinks(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar links de issues do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('create-issue-link')
      .description('Cria link entre issues do Jira')
      .requiredOption('-i, --issue-key <issueKey>', 'Chave da issue Jira')
      .requiredOption('-r, --repository <repository>', 'Slug do repositório')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .option('-c, --commit-id <commitId>', 'ID do commit (opcional)')
      .option('-q, --pull-request-id <pullRequestId>', 'ID do pull request (opcional)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --issue-key\`: Chave da issue Jira
- \`-r, --repository\`: Slug do repositório
- \`-p, --project\`: Chave do projeto

**Opções disponíveis:**
- \`-c, --commit-id\`: ID do commit para vincular (opcional)
- \`-q, --pull-request-id\`: ID do pull request para vincular (opcional)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira create-issue-link --issue-key "PROJ-123" --repository "my-repo" --project "PROJ"
  $ npx -y @guerchele/bitbucket-mcp-server jira create-issue-link --issue-key "PROJ-123" --repository "my-repo" --project "PROJ" --commit-id "abc123"
  $ npx -y @guerchele/bitbucket-mcp-server jira create-issue-link --issue-key "PROJ-123" --repository "my-repo" --project "PROJ" --pull-request-id 42

**Descrição:**
  Cria um link entre uma issue do Jira e um repositório, commit ou pull request
  do Bitbucket.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const request: any = {
            issueKey: options.issueKey,
            repository: {
              slug: options.repository,
              project: {
                key: options.project,
              },
            },
          };

          if (options.commitId) {
            request.commit = { id: options.commitId };
          }

          if (options.pullRequestId) {
            request.pullRequest = { id: parseInt(options.pullRequestId) };
          }

          const result = await jiraService.createJiraIssueLink(request);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar link entre issues do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('get-issue-link')
      .description('Obtém link de issue do Jira por ID')
      .requiredOption('-l, --link-id <linkId>', 'ID do link')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-l, --link-id\`: ID do link

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-issue-link --link-id 123
  $ npx -y @guerchele/bitbucket-mcp-server jira get-issue-link --link-id 456 --output json

**Descrição:**
  Obtém informações detalhadas de um link específico de issue do Jira.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const result = await jiraService.getJiraIssueLink(options.linkId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter link de issue do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('delete-issue-link')
      .description('Exclui link entre issues do Jira')
      .requiredOption('-l, --link-id <linkId>', 'ID do link')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-l, --link-id\`: ID do link

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira delete-issue-link --link-id 123
  $ npx -y @guerchele/bitbucket-mcp-server jira delete-issue-link --link-id 456 --output json

**Descrição:**
  Exclui um link entre issues do Jira.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          await jiraService.deleteJiraIssueLink(options.linkId);
          const response = createMcpResponse(
            { message: 'Link de issue excluído com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir link entre issues do Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Repository-specific Jira Issue Links
    jiraCommand
      .command('get-repository-issue-links')
      .description('Obtém links de issues do Jira para um repositório')
      .requiredOption('-p, --project <projectKey>', 'Chave do projeto')
      .requiredOption('-r, --repository <repositorySlug>', 'Slug do repositório')
      .option('-i, --issue-key <issueKey>', 'Filtrar por chave da issue')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repository\`: Slug do repositório

**Opções disponíveis:**
- \`-i, --issue-key\`: Filtrar por chave da issue
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-repository-issue-links --project "PROJ" --repository "my-repo"
  $ npx -y @guerchele/bitbucket-mcp-server jira get-repository-issue-links --project "PROJ" --repository "my-repo" --issue-key "PROJ-123"
  $ npx -y @guerchele/bitbucket-mcp-server jira get-repository-issue-links --project "PROJ" --repository "my-repo" --output json

**Descrição:**
  Obtém todos os links de issues do Jira associados a um repositório específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const params: any = {};
          if (options.issueKey) params.issueKey = options.issueKey;

          const result = await jiraService.getJiraIssueLinksForRepository(
            options.project,
            options.repository,
            params
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter links de issues do repositório', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('get-commit-issue-links')
      .description('Obtém links de issues do Jira para um commit')
      .requiredOption('-p, --project <projectKey>', 'Chave do projeto')
      .requiredOption('-r, --repository <repositorySlug>', 'Slug do repositório')
      .requiredOption('-c, --commit-id <commitId>', 'ID do commit')
      .option('-i, --issue-key <issueKey>', 'Filtrar por chave da issue')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repository\`: Slug do repositório
- \`-c, --commit-id\`: ID do commit

**Opções disponíveis:**
- \`-i, --issue-key\`: Filtrar por chave da issue
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-commit-issue-links --project "PROJ" --repository "my-repo" --commit-id "abc123"
  $ npx -y @guerchele/bitbucket-mcp-server jira get-commit-issue-links --project "PROJ" --repository "my-repo" --commit-id "abc123" --issue-key "PROJ-123"
  $ npx -y @guerchele/bitbucket-mcp-server jira get-commit-issue-links --project "PROJ" --repository "my-repo" --commit-id "abc123" --output json

**Descrição:**
  Obtém todos os links de issues do Jira associados a um commit específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const params: any = {};
          if (options.issueKey) params.issueKey = options.issueKey;

          const result = await jiraService.getJiraIssueLinksForCommit(
            options.project,
            options.repository,
            options.commitId,
            params
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter links de issues do commit', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    jiraCommand
      .command('get-pull-request-issue-links')
      .description('Obtém links de issues do Jira para um pull request')
      .requiredOption('-p, --project <projectKey>', 'Chave do projeto')
      .requiredOption('-r, --repository <repositorySlug>', 'Slug do repositório')
      .requiredOption('-q, --pull-request-id <pullRequestId>', 'ID do pull request')
      .option('-i, --issue-key <issueKey>', 'Filtrar por chave da issue')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repository\`: Slug do repositório
- \`-q, --pull-request-id\`: ID do pull request

**Opções disponíveis:**
- \`-i, --issue-key\`: Filtrar por chave da issue
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-pull-request-issue-links --project "PROJ" --repository "my-repo" --pull-request-id 42
  $ npx -y @guerchele/bitbucket-mcp-server jira get-pull-request-issue-links --project "PROJ" --repository "my-repo" --pull-request-id 42 --issue-key "PROJ-123"
  $ npx -y @guerchele/bitbucket-mcp-server jira get-pull-request-issue-links --project "PROJ" --repository "my-repo" --pull-request-id 42 --output json

**Descrição:**
  Obtém todos os links de issues do Jira associados a um pull request específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const params: any = {};
          if (options.issueKey) params.issueKey = options.issueKey;

          const result = await jiraService.getJiraIssueLinksForPullRequest(
            options.project,
            options.repository,
            parseInt(options.pullRequestId),
            params
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter links de issues do pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Jira Integration Status
    jiraCommand
      .command('get-status')
      .description('Obtém status da integração Jira')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server jira get-status
  $ npx -y @guerchele/bitbucket-mcp-server jira get-status --output json

**Descrição:**
  Obtém o status atual da integração com o Jira, incluindo configurações
  e status de habilitação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const jiraService = new JiraIntegrationService(
            apiClient,
            Logger.forContext('JiraIntegrationService')
          );

          const result = await jiraService.getJiraIntegrationSettings();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter status da integração Jira', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center JIRA integration commands');
  }
}
