/**
 * Data Center Pull Request Tools
 * Ferramentas para gerenciamento de pull requests no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { PullRequestService } from '../../services/datacenter/pull-request.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const CreatePullRequestSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  source_branch: z.string(),
  destination_branch: z.string(),
  reviewers: z.array(z.string()).optional(),
  closeSourceBranch: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdatePullRequestSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeletePullRequestSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListPullRequestsSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  state: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const MergePullRequestSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  merge_strategy: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeclinePullRequestSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  reason: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ReopenPullRequestSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreatePullRequestCommentSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  text: z.string(),
  parent_id: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestCommentSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  comment_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdatePullRequestCommentSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  comment_id: z.number(),
  text: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeletePullRequestCommentSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  comment_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestActivitySchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestDiffSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  context_lines: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestChangesSchema = z.object({
  project_key: z.string(),
  repo_slug: z.string(),
  pull_request_id: z.number(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ReopenPullRequestDataCenterSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreatePullRequestCommentDataCenterSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  text: z.string(),
  parent: z.any().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestCommentDataCenterSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  commentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdatePullRequestCommentDataCenterSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  commentId: z.number(),
  version: z.number(),
  text: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeletePullRequestCommentDataCenterSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  commentId: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetPullRequestActivityDataCenterSchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  pullRequestId: z.number(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Pull Request Tools
 * Ferramentas para gerenciamento de pull requests no Bitbucket Data Center
 */
export class DataCenterPullRequestTools {
  private static logger = Logger.forContext('DataCenterPullRequestTools');
  private static pullRequestServicePool: Pool<PullRequestService>;

  static initialize(): void {
    const pullRequestServiceFactory = {
      create: async () =>
        new PullRequestService(new ApiClient(), Logger.forContext('PullRequestService')),
      destroy: async () => {},
    };

    this.pullRequestServicePool = createPool(pullRequestServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Pull Request tools initialized');
  }

  static async createPullRequest(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createPullRequest');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Creating pull request:', {
        project_key: params.project_key,
        repo_slug: params.repo_slug,
        title: params.title,
      });

      const result = await service.createPullRequest(params.project_key, params.repo_slug, params);

      methodLogger.info('Successfully created pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create pull request:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async getPullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequest');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Getting pull request:', {
        project_key: projectKey,
        repo_slug: repoSlug,
        pull_request_id: pullRequestId,
      });

      const result = await service.getPullRequest(projectKey, repoSlug, pullRequestId);

      methodLogger.info('Successfully retrieved pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async updatePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updatePullRequest');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Updating pull request:', {
        project_key: projectKey,
        repo_slug: repoSlug,
        pull_request_id: pullRequestId,
      });

      const result = await service.updatePullRequest(projectKey, repoSlug, pullRequestId, params);

      methodLogger.info('Successfully updated pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update pull request:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async listPullRequests(
    projectKey: string,
    repoSlug: string,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listPullRequests');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Listing pull requests:', {
        project_key: projectKey,
        repo_slug: repoSlug,
      });

      const result = await service.listPullRequests(projectKey, repoSlug, params);

      methodLogger.info('Successfully listed pull requests');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list pull requests:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async mergePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('mergePullRequest');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Merging pull request:', {
        project_key: projectKey,
        repo_slug: repoSlug,
        pull_request_id: pullRequestId,
      });

      const result = await service.mergePullRequest(projectKey, repoSlug, pullRequestId, params);

      methodLogger.info('Successfully merged pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to merge pull request:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async declinePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('declinePullRequest');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Declining pull request:', {
        project_key: projectKey,
        repo_slug: repoSlug,
        pull_request_id: pullRequestId,
      });

      const result = await service.declinePullRequest(projectKey, repoSlug, pullRequestId, params);

      methodLogger.info('Successfully declined pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to decline pull request:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async getPullRequestComments(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestComments');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Getting pull request comments:', {
        project_key: projectKey,
        repo_slug: repoSlug,
        pull_request_id: pullRequestId,
      });

      const result = await service.getPullRequestComments(projectKey, repoSlug, pullRequestId);

      methodLogger.info('Successfully retrieved pull request comments');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request comments:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async deletePullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deletePullRequest');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Deleting pull request:', { projectKey, repositorySlug, pullRequestId });

      await service.deletePullRequest(projectKey, repositorySlug, pullRequestId);

      methodLogger.info('Successfully deleted pull request');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete pull request:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async reopenPullRequest(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('reopenPullRequest');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Reopening pull request:', { projectKey, repositorySlug, pullRequestId });

      const result = await service.reopenPullRequest(projectKey, repositorySlug, pullRequestId, {
        version: 0,
      });

      methodLogger.info('Successfully reopened pull request');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to reopen pull request:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async createPullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    request: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createPullRequestComment');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Creating pull request comment:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        request,
      });

      const result = await service.createPullRequestComment(
        projectKey,
        repositorySlug,
        pullRequestId,
        request
      );

      methodLogger.info('Successfully created pull request comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create pull request comment:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async getPullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    commentId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestComment');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Getting pull request comment:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
      });

      const result = await service.getPullRequestComment(
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId
      );

      methodLogger.info('Successfully retrieved pull request comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request comment:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async updatePullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    commentId: number,
    request: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updatePullRequestComment');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Updating pull request comment:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
        request,
      });

      const result = await service.updatePullRequestComment(
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
        request
      );

      methodLogger.info('Successfully updated pull request comment');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update pull request comment:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async deletePullRequestComment(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    commentId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deletePullRequestComment');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Deleting pull request comment:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        commentId,
      });

      await service.deletePullRequestComment(projectKey, repositorySlug, pullRequestId, commentId);

      methodLogger.info('Successfully deleted pull request comment');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete pull request comment:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async getPullRequestActivity(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestActivity');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Getting pull request activity:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
      });

      const result = await service.getPullRequestActivity(
        projectKey,
        repositorySlug,
        pullRequestId,
        params
      );

      methodLogger.info('Successfully retrieved pull request activity');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request activity:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async getPullRequestDiff(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestDiff');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Getting pull request diff:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
      });

      const result = await service.getPullRequestDiff(
        projectKey,
        repositorySlug,
        pullRequestId,
        params
      );

      methodLogger.info('Successfully retrieved pull request diff');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request diff:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static async getPullRequestChanges(
    projectKey: string,
    repositorySlug: string,
    pullRequestId: number,
    params?: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getPullRequestChanges');
    let service: PullRequestService | null = null;

    try {
      service = await this.pullRequestServicePool.acquire();
      methodLogger.debug('Getting pull request changes:', {
        projectKey,
        repositorySlug,
        pullRequestId,
        params,
      });

      const result = await service.getPullRequestChanges(
        projectKey,
        repositorySlug,
        pullRequestId,
        params
      );

      methodLogger.info('Successfully retrieved pull request changes');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pull request changes:', error);
      if (service) {
        this.pullRequestServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pullRequestServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Create Pull Request
    server.registerTool(
      'pull_request_create',
      {
        description: `Cria um novo pull request no Bitbucket Data Center.

**Funcionalidades:**
- Criação de pull requests
- Configuração de revisores
- Metadados do pull request

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`title\`: Título do pull request
- \`description\`: Descrição do pull request (opcional)
- \`source_branch\`: Branch de origem
- \`destination_branch\`: Branch de destino
- \`reviewers\`: Lista de revisores (opcional)
- \`closeSourceBranch\`: Se deve fechar a branch de origem após merge (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request criado.`,
        inputSchema: CreatePullRequestSchema.shape,
      },
      async (params: z.infer<typeof CreatePullRequestSchema>) => {
        const validatedParams = CreatePullRequestSchema.parse(params);
        return await this.createPullRequest(
          {
            project_key: validatedParams.project_key,
            repo_slug: validatedParams.repo_slug,
            title: validatedParams.title,
            description: validatedParams.description,
            fromRef: {
              id: validatedParams.source_branch,
              repository: {
                slug: validatedParams.repo_slug,
                project: {
                  key: validatedParams.project_key,
                },
              },
            },
            toRef: {
              id: validatedParams.destination_branch,
              repository: {
                slug: validatedParams.repo_slug,
                project: {
                  key: validatedParams.project_key,
                },
              },
            },
            reviewers: validatedParams.reviewers?.map((reviewer: string) => ({
              user: { name: reviewer },
            })),
            closeSourceBranch: validatedParams.closeSourceBranch,
          },
          validatedParams.output
        );
      }
    );

    // Get Pull Request
    server.registerTool(
      'pull_request_get',
      {
        description: `Obtém um pull request específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do pull request
- Metadados e configurações
- Informações de revisores

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`pull_request_id\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request.`,
        inputSchema: GetPullRequestSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestSchema>) => {
        const validatedParams = GetPullRequestSchema.parse(params);
        return await this.getPullRequest(
          validatedParams.project_key,
          validatedParams.repo_slug,
          validatedParams.pull_request_id,
          validatedParams.output
        );
      }
    );

    // Update Pull Request
    server.registerTool(
      'pull_request_update',
      {
        description: `Atualiza um pull request existente no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de metadados
- Modificação de revisores
- Alteração de configurações

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`pull_request_id\`: ID do pull request
- \`updates\`: Objeto com as atualizações a serem aplicadas
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request atualizado.`,
        inputSchema: UpdatePullRequestSchema.shape,
      },
      async (params: z.infer<typeof UpdatePullRequestSchema>) => {
        const validatedParams = UpdatePullRequestSchema.parse(params);
        return await this.updatePullRequest(
          validatedParams.project_key,
          validatedParams.repo_slug,
          validatedParams.pull_request_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Delete Pull Request
    server.registerTool(
      'pull_request_delete',
      {
        description: `Exclui um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de pull requests
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`pull_request_id\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.`,
        inputSchema: DeletePullRequestSchema.shape,
      },
      async (params: z.infer<typeof DeletePullRequestSchema>) => {
        const validatedParams = DeletePullRequestSchema.parse(params);
        return await this.deletePullRequest(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    // List Pull Requests
    server.registerTool(
      'pull_request_list',
      {
        description: `Lista pull requests no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de pull requests
- Filtros e paginação
- Informações resumidas

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`state\`: Estado do pull request (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de pull requests.`,
        inputSchema: ListPullRequestsSchema.shape,
      },
      async (params: z.infer<typeof ListPullRequestsSchema>) => {
        const validatedParams = ListPullRequestsSchema.parse(params);
        return await this.listPullRequests(
          validatedParams.project_key,
          validatedParams.repo_slug,
          {
            state: validatedParams.state as any,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Merge Pull Request
    server.registerTool(
      'pull_request_merge',
      {
        description: `Faz merge de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Merge de pull requests
- Configuração de estratégias
- Fechamento de branches

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`pull_request_id\`: ID do pull request
- \`merge_strategy\`: Estratégia de merge (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do merge.`,
        inputSchema: MergePullRequestSchema.shape,
      },
      async (params: z.infer<typeof MergePullRequestSchema>) => {
        const validatedParams = MergePullRequestSchema.parse(params);
        return await this.mergePullRequest(
          validatedParams.project_key,
          validatedParams.repo_slug,
          validatedParams.pull_request_id,
          {
            mergeStrategy: validatedParams.merge_strategy as any,
          } as any,
          validatedParams.output
        );
      }
    );

    // Decline Pull Request
    server.registerTool(
      'pull_request_decline',
      {
        description: `Recusa um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Recusa de pull requests
- Configuração de motivos
- Notificações

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`pull_request_id\`: ID do pull request
- \`reason\`: Motivo da recusa (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da recusa.`,
        inputSchema: DeclinePullRequestSchema.shape,
      },
      async (params: z.infer<typeof DeclinePullRequestSchema>) => {
        const validatedParams = DeclinePullRequestSchema.parse(params);
        return await this.declinePullRequest(
          validatedParams.project_key,
          validatedParams.repo_slug,
          validatedParams.pull_request_id,
          {
            message: validatedParams.reason,
          },
          validatedParams.output
        );
      }
    );

    // Reopen Pull Request
    server.registerTool(
      'pull_request_reopen',
      {
        description: `Reabre um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Reabertura de pull request
- Restauração de estado
- Aplicação de mudanças

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pull request reaberto.`,
        inputSchema: ReopenPullRequestDataCenterSchema.shape,
      },
      async (params: z.infer<typeof ReopenPullRequestDataCenterSchema>) => {
        const validatedParams = ReopenPullRequestDataCenterSchema.parse(params);
        return await this.reopenPullRequest(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.output
        );
      }
    );

    // Create Pull Request Comment
    server.registerTool(
      'pull_request_create_comment',
      {
        description: `Cria um comentário em um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Criação de comentário
- Discussão de código
- Feedback de revisão

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`text\`: Texto do comentário
- \`parent\`: Comentário pai (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário criado.`,
        inputSchema: CreatePullRequestCommentDataCenterSchema.shape,
      },
      async (params: z.infer<typeof CreatePullRequestCommentDataCenterSchema>) => {
        const validatedParams = CreatePullRequestCommentDataCenterSchema.parse(params);
        return await this.createPullRequestComment(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          {
            text: validatedParams.text,
            parent: validatedParams.parent,
          },
          validatedParams.output
        );
      }
    );

    // Get Pull Request Comment
    server.registerTool(
      'pull_request_get_comment',
      {
        description: `Obtém um comentário específico de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do comentário
- Informações de autor
- Histórico de edições

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`commentId\`: ID do comentário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário.`,
        inputSchema: GetPullRequestCommentDataCenterSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestCommentDataCenterSchema>) => {
        const validatedParams = GetPullRequestCommentDataCenterSchema.parse(params);
        return await this.getPullRequestComment(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.commentId,
          validatedParams.output
        );
      }
    );

    // Update Pull Request Comment
    server.registerTool(
      'pull_request_update_comment',
      {
        description: `Atualiza um comentário de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de comentário
- Edição de texto
- Aplicação de mudanças

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`commentId\`: ID do comentário
- \`version\`: Versão do comentário
- \`text\`: Novo texto do comentário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do comentário atualizado.`,
        inputSchema: UpdatePullRequestCommentDataCenterSchema.shape,
      },
      async (params: z.infer<typeof UpdatePullRequestCommentDataCenterSchema>) => {
        const validatedParams = UpdatePullRequestCommentDataCenterSchema.parse(params);
        return await this.updatePullRequestComment(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.commentId,
          {
            version: validatedParams.version,
            text: validatedParams.text,
          },
          validatedParams.output
        );
      }
    );

    // Delete Pull Request Comment
    server.registerTool(
      'pull_request_delete_comment',
      {
        description: `Remove um comentário de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de comentário
- Limpeza de dados
- Confirmação de operação

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`commentId\`: ID do comentário
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o resultado da operação.`,
        inputSchema: DeletePullRequestCommentDataCenterSchema.shape,
      },
      async (params: z.infer<typeof DeletePullRequestCommentDataCenterSchema>) => {
        const validatedParams = DeletePullRequestCommentDataCenterSchema.parse(params);
        return await this.deletePullRequestComment(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          validatedParams.commentId,
          validatedParams.output
        );
      }
    );

    // Get Pull Request Activity
    server.registerTool(
      'pull_request_get_activity',
      {
        description: `Obtém a atividade de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Histórico de atividades
- Log de eventos
- Rastreamento de mudanças

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`start\`: Índice inicial para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a atividade do pull request.`,
        inputSchema: GetPullRequestActivityDataCenterSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestActivityDataCenterSchema>) => {
        const validatedParams = GetPullRequestActivityDataCenterSchema.parse(params);
        return await this.getPullRequestActivity(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          validatedParams.pullRequestId,
          {
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Pull Request Diff
    server.registerTool(
      'pull_request_get_diff',
      {
        description: `Obtém o diff de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Diferenças de código
- Comparação de arquivos
- Visualização de mudanças

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`pullRequestId\`: ID do pull request
- \`context_lines\`: Linhas de contexto (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o diff do pull request.`,
        inputSchema: GetPullRequestDiffSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestDiffSchema>) => {
        const validatedParams = GetPullRequestDiffSchema.parse(params);
        return await this.getPullRequestDiff(
          validatedParams.project_key,
          validatedParams.repo_slug,
          validatedParams.pull_request_id,
          {
            context: validatedParams.context_lines,
          },
          validatedParams.output
        );
      }
    );

    // Get Pull Request Changes
    server.registerTool(
      'pull_request_get_changes',
      {
        description: `Obtém as mudanças de um pull request no Bitbucket Data Center.

**Funcionalidades:**
- Lista de arquivos alterados
- Estatísticas de mudanças
- Informações de commits

**Parâmetros:**
- \`project_key\`: Chave do projeto
- \`repo_slug\`: Slug do repositório
- \`pull_request_id\`: ID do pull request
- \`start\`: Índice inicial para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as mudanças do pull request.`,
        inputSchema: GetPullRequestChangesSchema.shape,
      },
      async (params: z.infer<typeof GetPullRequestChangesSchema>) => {
        const validatedParams = GetPullRequestChangesSchema.parse(params);
        return await this.getPullRequestChanges(
          validatedParams.project_key,
          validatedParams.repo_slug,
          validatedParams.pull_request_id,
          {
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center pull request tools');
  }
}
