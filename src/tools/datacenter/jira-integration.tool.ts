import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { JiraIntegrationService } from '../../services/datacenter/jira-integration.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetJiraIntegrationSettingsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateJiraIntegrationSettingsSchema = z.object({
  settings: z.object({
    enabled: z.boolean().optional(),
    jiraUrl: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const TestJiraConnectionSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetJiraProjectsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetJiraIssuesSchema = z.object({
  projectKey: z.string().optional(),
  status: z.string().optional(),
  assignee: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateJiraIssueSchema = z.object({
  issue: z.object({
    projectKey: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    issueType: z.string().optional(),
    assignee: z.string().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateJiraIssueSchema = z.object({
  issueKey: z.string(),
  updates: z.object({
    summary: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    assignee: z.string().optional(),
  }),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const LinkJiraIssueToCommitSchema = z.object({
  issueKey: z.string(),
  commitHash: z.string(),
  repositorySlug: z.string(),
  projectKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetJiraIssueTransitionsSchema = z.object({
  issueKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const TransitionJiraIssueSchema = z.object({
  issueKey: z.string(),
  transitionId: z.string(),
  comment: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetJiraIssueCommentsSchema = z.object({
  issueKey: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const AddJiraIssueCommentSchema = z.object({
  issueKey: z.string(),
  comment: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Jira Integration Tools
 * Ferramentas para integração com Jira no Bitbucket Data Center
 */
export class DataCenterJiraIntegrationTools {
  private static logger = Logger.forContext('DataCenterJiraIntegrationTools');
  private static jiraIntegrationServicePool: Pool<JiraIntegrationService>;

  static initialize(): void {
    const jiraIntegrationServiceFactory = {
      create: async () =>
        new JiraIntegrationService(new ApiClient(), Logger.forContext('JiraIntegrationService')),
      destroy: async () => {},
    };

    this.jiraIntegrationServicePool = createPool(jiraIntegrationServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Jira Integration tools initialized');
  }

  static async getJiraIntegrationSettings(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getJiraIntegrationSettings');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Getting Jira integration settings');
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.getJiraIntegrationSettings();

      methodLogger.debug('Successfully got Jira integration settings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get Jira integration settings:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async updateJiraIntegrationSettings(settings: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('updateJiraIntegrationSettings');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Updating Jira integration settings:', { settings });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.updateJiraIntegrationSettings(settings);

      methodLogger.debug('Successfully updated Jira integration settings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update Jira integration settings:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async testJiraIntegrationConnection(request: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('testJiraIntegrationConnection');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Testing Jira integration connection:', { request });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.testJiraIntegrationConnection(request);

      methodLogger.debug('Successfully tested Jira integration connection');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to test Jira integration connection:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async getJiraIssueLink(linkId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getJiraIssueLink');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Getting Jira issue link:', { linkId });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.getJiraIssueLink(linkId);

      methodLogger.debug('Successfully got Jira issue link');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get Jira issue link:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async deleteJiraIssueLink(linkId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteJiraIssueLink');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Deleting Jira issue link:', { linkId });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.deleteJiraIssueLink(linkId);

      methodLogger.debug('Successfully deleted Jira issue link');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to delete Jira issue link:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async getJiraIssueLinksForRepository(
    projectKey: string,
    repositorySlug: string,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getJiraIssueLinksForRepository');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Getting Jira issue links for repository:', {
        projectKey,
        repositorySlug,
        params,
      });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.getJiraIssueLinksForRepository(
        projectKey,
        repositorySlug,
        params
      );

      methodLogger.debug('Successfully got Jira issue links for repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get Jira issue links for repository:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async getJiraIssueLinksForCommit(
    projectKey: string,
    repositorySlug: string,
    commitId: string,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getJiraIssueLinksForCommit');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Getting Jira issue links for commit:', {
        projectKey,
        repositorySlug,
        commitId,
        params,
      });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.getJiraIssueLinksForCommit(
        projectKey,
        repositorySlug,
        commitId,
        params
      );

      methodLogger.debug('Successfully got Jira issue links for commit');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get Jira issue links for commit:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async getJiraIssue(issueKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getJiraIssue');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Getting Jira issue:', { issueKey });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.getJiraIssue(issueKey);

      methodLogger.debug('Successfully got Jira issue');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get Jira issue:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async getJiraProject(projectKey: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getJiraProject');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Getting Jira project:', { projectKey });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.getJiraProject(projectKey);

      methodLogger.debug('Successfully got Jira project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get Jira project:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async listJiraIssueLinks(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listJiraIssueLinks');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Listing Jira issue links:', { params });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.listJiraIssueLinks(params);

      methodLogger.debug('Successfully listed Jira issue links');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list Jira issue links:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async createJiraIssueLink(request: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createJiraIssueLink');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Creating Jira issue link:', { request });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.createJiraIssueLink(request);

      methodLogger.debug('Successfully created Jira issue link');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create Jira issue link:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static async getJiraIssueLinksForPullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getJiraIssueLinksForPullRequest');
    let jiraIntegrationService = null;

    try {
      methodLogger.debug('Getting Jira issue links for pull request:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
      });
      jiraIntegrationService = await this.jiraIntegrationServicePool.acquire();

      const result = await jiraIntegrationService.getJiraIssueLinksForPullRequest(
        projectKey,
        repositorySlug,
        pullRequestId,
        params
      );

      methodLogger.debug('Successfully got Jira issue links for pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get Jira issue links for pull request:', error);
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.destroy(jiraIntegrationService);
        jiraIntegrationService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (jiraIntegrationService) {
        this.jiraIntegrationServicePool.release(jiraIntegrationService);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get Jira Integration Settings
    server.registerTool(
      'jira_get_integration_settings',
      {
        description: `Obtém configurações de integração com Jira no Bitbucket Data Center.

**Funcionalidades:**
- Configurações de integração
- Status da conexão
- Parâmetros de autenticação

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as configurações de integração com Jira.`,
        inputSchema: GetJiraIntegrationSettingsSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIntegrationSettingsSchema>) => {
        const validatedParams = GetJiraIntegrationSettingsSchema.parse(params);
        return await this.getJiraIntegrationSettings(validatedParams.output);
      }
    );

    // Update Jira Integration Settings
    server.registerTool(
      'jira_update_integration_settings',
      {
        description: `Atualiza configurações de integração com Jira no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Configuração de conexão
- Parâmetros de autenticação

**Parâmetros:**
- \`settings\`: Configurações de integração
- \`settings.jiraUrl\`: URL do Jira (opcional)
- \`settings.username\`: Nome de usuário (opcional)
- \`settings.password\`: Senha (opcional)
- \`settings.enabled\`: Se a integração está habilitada (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as configurações atualizadas.`,
        inputSchema: UpdateJiraIntegrationSettingsSchema.shape,
      },
      async (params: z.infer<typeof UpdateJiraIntegrationSettingsSchema>) => {
        const validatedParams = UpdateJiraIntegrationSettingsSchema.parse(params);
        return await this.updateJiraIntegrationSettings(
          validatedParams.settings,
          validatedParams.output
        );
      }
    );

    // Get Jira Issue
    server.registerTool(
      'jira_get_issue',
      {
        description: `Obtém uma issue do Jira no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da issue
- Status e prioridade
- Informações de atribuição

**Parâmetros:**
- \`issue_key\`: Chave da issue do Jira

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da issue do Jira.`,
        inputSchema: GetJiraIssuesSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIssuesSchema>) => {
        const validatedParams = GetJiraIssuesSchema.parse(params);
        return await this.getJiraIssue(validatedParams.projectKey || '', validatedParams.output);
      }
    );

    // Get Jira Project
    server.registerTool(
      'jira_get_project',
      {
        description: `Obtém um projeto do Jira no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do projeto
- Configurações do projeto
- Informações de permissões

**Parâmetros:**
- \`project_key\`: Chave do projeto do Jira

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do projeto do Jira.`,
        inputSchema: GetJiraProjectsSchema.shape,
      },
      async (params: z.infer<typeof GetJiraProjectsSchema>) => {
        const validatedParams = GetJiraProjectsSchema.parse(params);
        return await this.getJiraProject(validatedParams.output);
      }
    );

    // Create Jira Issue Link
    server.registerTool(
      'jira_create_issue_link',
      {
        description: `Cria um link entre uma issue do Jira e um repositório no Bitbucket Data Center.

**Funcionalidades:**
- Criação de links
- Associação de issues
- Rastreamento de mudanças

**Parâmetros:**
- \`issue_key\`: Chave da issue do Jira
- \`repository_id\`: ID do repositório
- \`commit_hash\`: Hash do commit (opcional)
- \`pull_request_id\`: ID do pull request (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do link criado.`,
        inputSchema: LinkJiraIssueToCommitSchema.shape,
      },
      async (params: z.infer<typeof LinkJiraIssueToCommitSchema>) => {
        const validatedParams = LinkJiraIssueToCommitSchema.parse(params);
        return await this.createJiraIssueLink(
          {
            issue_key: validatedParams.issueKey,
            repository_id: validatedParams.repositorySlug,
            commit_hash: validatedParams.commitHash,
            project_key: validatedParams.projectKey,
          },
          validatedParams.output
        );
      }
    );

    // List Jira Issue Links
    server.registerTool(
      'jira_list_issue_links',
      {
        description: `Lista links entre issues do Jira e repositórios no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de links
- Filtros e paginação
- Informações de associação

**Parâmetros:**
- \`issue_key\`: Chave da issue do Jira (opcional)
- \`repository_id\`: ID do repositório (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de links entre issues do Jira e repositórios.`,
        inputSchema: GetJiraIssuesSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIssuesSchema>) => {
        const validatedParams = GetJiraIssuesSchema.parse(params);
        return await this.listJiraIssueLinks(
          {
            issue_key: validatedParams.projectKey,
            repository_id: validatedParams.status,
            start: validatedParams.assignee,
            limit: 100,
          },
          validatedParams.output
        );
      }
    );

    // Test Jira Integration Connection
    server.registerTool(
      'jira_test_integration_connection',
      {
        description: `Test Jira integration connection from Bitbucket Data Center.

**Funcionalidades:**
- Test Jira connection
- Validate settings
- Check connectivity

**Retorna:** Object with content containing connection test result.`,
        inputSchema: TestJiraConnectionSchema.shape,
      },
      async (params: z.infer<typeof TestJiraConnectionSchema>) => {
        const validatedParams = TestJiraConnectionSchema.parse(params);
        return await this.testJiraIntegrationConnection(validatedParams.output);
      }
    );

    // Get Jira Issue Link
    server.registerTool(
      'jira_get_issue_link',
      {
        description: `Get specific Jira issue link from Bitbucket Data Center.

**Funcionalidades:**
- Get specific issue link
- Link details
- Association information

**Parâmetros:**
- \`linkId\`: Link ID

**Retorna:** Object with content containing Jira issue link details.`,
        inputSchema: GetJiraIssuesSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIssuesSchema>) => {
        const validatedParams = GetJiraIssuesSchema.parse(params);
        return await this.getJiraIssueLink(
          validatedParams.projectKey || '',
          validatedParams.output
        );
      }
    );

    // Delete Jira Issue Link
    server.registerTool(
      'jira_delete_issue_link',
      {
        description: `Delete Jira issue link from Bitbucket Data Center.

**Funcionalidades:**
- Delete issue link
- Remove association
- Clean up links

**Parâmetros:**
- \`linkId\`: Link ID

**Retorna:** Object with content containing deletion result.`,
        inputSchema: GetJiraIssuesSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIssuesSchema>) => {
        const validatedParams = GetJiraIssuesSchema.parse(params);
        return await this.deleteJiraIssueLink(
          validatedParams.projectKey || '',
          validatedParams.output
        );
      }
    );

    // Get Jira Issue Links for Repository
    server.registerTool(
      'jira_get_issue_links_for_repository',
      {
        description: `Get Jira issue links for repository from Bitbucket Data Center.

**Funcionalidades:**
- Get repository issue links
- Repository associations
- Link details

**Parâmetros:**
- \`projectKey\`: Project key
- \`repositorySlug\`: Repository slug
- \`issueKey\`: Issue key (optional)
- \`start\`: Starting index for pagination (optional)
- \`limit\`: Maximum number of results (optional)

**Retorna:** Object with content containing repository issue links.`,
        inputSchema: GetJiraIssuesSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIssuesSchema>) => {
        const validatedParams = GetJiraIssuesSchema.parse(params);
        return await this.getJiraIssueLinksForRepository(
          validatedParams.projectKey || '',
          validatedParams.status || '',
          {
            issueKey: validatedParams.assignee,
            start: 0,
            limit: 100,
          },
          validatedParams.output
        );
      }
    );

    // Get Jira Issue Links for Commit
    server.registerTool(
      'jira_get_issue_links_for_commit',
      {
        description: `Get Jira issue links for commit from Bitbucket Data Center.

**Funcionalidades:**
- Get commit issue links
- Commit associations
- Link details

**Parâmetros:**
- \`projectKey\`: Project key
- \`repositorySlug\`: Repository slug
- \`commitId\`: Commit ID
- \`issueKey\`: Issue key (optional)
- \`start\`: Starting index for pagination (optional)
- \`limit\`: Maximum number of results (optional)

**Retorna:** Object with content containing commit issue links.`,
        inputSchema: GetJiraIssuesSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIssuesSchema>) => {
        const validatedParams = GetJiraIssuesSchema.parse(params);
        return await this.getJiraIssueLinksForCommit(
          validatedParams.projectKey || '',
          validatedParams.status || '',
          validatedParams.assignee || '',
          {
            issueKey: validatedParams.projectKey,
            start: 0,
            limit: 100,
          },
          validatedParams.output
        );
      }
    );

    // Get Jira Issue Links for Pull Request
    server.registerTool(
      'jira_get_issue_links_for_pull_request',
      {
        description: `Get Jira issue links for pull request from Bitbucket Data Center.

**Funcionalidades:**
- Get pull request issue links
- PR associations
- Link details

**Parâmetros:**
- \`projectKey\`: Project key
- \`repositorySlug\`: Repository slug
- \`pullRequestId\`: Pull request ID
- \`issueKey\`: Issue key (optional)
- \`start\`: Starting index for pagination (optional)
- \`limit\`: Maximum number of results (optional)

**Retorna:** Object with content containing pull request issue links.`,
        inputSchema: GetJiraIssuesSchema.shape,
      },
      async (params: z.infer<typeof GetJiraIssuesSchema>) => {
        const validatedParams = GetJiraIssuesSchema.parse(params);
        return await this.getJiraIssueLinksForPullRequest(
          validatedParams.projectKey || '',
          validatedParams.status || '',
          1,
          {
            issueKey: validatedParams.assignee,
            start: 0,
            limit: 100,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center jira integration tools');
  }
}
