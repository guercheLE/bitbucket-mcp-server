import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { PipelineService } from '../../services/cloud/pipeline.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ListPipelinesSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  sort: z.string().optional(),
  q: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional(),
});

const RunPipelineSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  target: z.string().optional(),
  variables: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional(),
});

const GetPipelineSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  pipeline_uuid: z.string(),
  output: z.enum(['markdown', 'json']).optional(),
});

const ListPipelineStepsSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  pipeline_uuid: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional(),
});

const GetPipelineStepSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  pipeline_uuid: z.string(),
  step_uuid: z.string(),
  output: z.enum(['markdown', 'json']).optional(),
});

const GetPipelineStepLogSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  pipeline_uuid: z.string(),
  step_uuid: z.string(),
  log_uuid: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional(),
});

const StopPipelineSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  pipeline_uuid: z.string(),
  output: z.enum(['markdown', 'json']).optional(),
});

const GetConfigurationSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  output: z.enum(['markdown', 'json']).optional(),
});

const UpdateConfigurationSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  config: z.string(),
  output: z.enum(['markdown', 'json']).optional(),
});

const UpdateNextBuildNumberSchema = z.object({
  workspace: z.string(),
  repo_slug: z.string(),
  build_number: z.number(),
  output: z.enum(['markdown', 'json']).optional(),
});

/**
 * Cloud Pipeline Tools
 * Ferramentas para gerenciamento de pipelines no Bitbucket Cloud
 */
export class CloudPipelineTools {
  private static logger = Logger.forContext('CloudPipelineTools');
  private static pipelineServicePool: Pool<PipelineService>;

  static initialize(): void {
    const pipelineServiceFactory = {
      create: async () => new PipelineService(new ApiClient()),
      destroy: async () => {},
    };

    this.pipelineServicePool = createPool(pipelineServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud Pipeline tools initialized');
  }

  static async listPipelines(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listPipelines');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Listing pipelines:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        page: params.page,
        pagelen: params.pagelen,
        sort: params.sort,
        q: params.q,
      });

      const result = await service.listPipelines({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        page: params.page,
        pagelen: params.pagelen,
        sort: params.sort,
        q: params.q,
      });

      methodLogger.info('Successfully listed pipelines');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list pipelines:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async runPipeline(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('runPipeline');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Running pipeline:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        target: params.target,
      });

      const result = await service.runPipeline({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline: {
          ...(params.target && {
            target: {
              type: 'pipeline_ref_target',
              ref_type: 'branch',
              ref_name: params.target,
              selector: { type: 'branches', pattern: params.target },
            },
          }),
          ...(params.variables && { variables: JSON.parse(params.variables) }),
        },
      });

      methodLogger.info('Successfully ran pipeline');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to run pipeline:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async getPipeline(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPipeline');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Getting pipeline:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
      });

      const result = await service.getPipeline({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
      });

      methodLogger.info('Successfully retrieved pipeline');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pipeline:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async listPipelineSteps(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listPipelineSteps');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Listing pipeline steps:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        page: params.page,
        pagelen: params.pagelen,
      });

      const result = await service.listPipelineSteps({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        page: params.page,
        pagelen: params.pagelen,
      });

      methodLogger.info('Successfully listed pipeline steps');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list pipeline steps:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async getPipelineStep(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPipelineStep');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Getting pipeline step:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        step_uuid: params.step_uuid,
      });

      const result = await service.getPipelineStep({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        step_uuid: params.step_uuid,
      });

      methodLogger.info('Successfully retrieved pipeline step');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pipeline step:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async getPipelineStepLog(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getPipelineStepLog');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Getting pipeline step log:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        step_uuid: params.step_uuid,
      });

      const result = await service.getPipelineStepLog({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
        step_uuid: params.step_uuid,
      });

      methodLogger.info('Successfully retrieved pipeline step log');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get pipeline step log:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async stopPipeline(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('stopPipeline');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Stopping pipeline:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
      });

      await service.stopPipeline({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        pipeline_uuid: params.pipeline_uuid,
      });

      methodLogger.info('Successfully stopped pipeline');
      return createMcpResponse({ message: 'Pipeline stopped successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to stop pipeline:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async getConfiguration(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getConfiguration');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Getting configuration:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
      });

      const result = await service.getConfiguration({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
      });

      methodLogger.info('Successfully retrieved configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get configuration:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async updateConfiguration(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('updateConfiguration');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Updating configuration:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
      });

      const result = await service.updateConfiguration({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        config: JSON.parse(params.configuration),
      });

      methodLogger.info('Successfully updated configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update configuration:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static async updateNextBuildNumber(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('updateNextBuildNumber');
    let service: PipelineService | null = null;

    try {
      service = await this.pipelineServicePool.acquire();
      methodLogger.debug('Updating next build number:', {
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        next_build_number: params.next_build_number,
      });

      await service.updateNextBuildNumber({
        workspace: params.workspace,
        repo_slug: params.repo_slug,
        build_number: params.next_build_number,
      });

      methodLogger.info('Successfully updated next build number');
      return createMcpResponse({ message: 'Next build number updated successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to update next build number:', error);
      if (service) {
        this.pipelineServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.pipelineServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // List Pipelines
    server.registerTool(
      'pipeline_list',
      {
        description: `Lista pipelines no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de pipelines
- Filtros e paginação
- Informações de status

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`sort\`: Ordenação (opcional)
- \`q\`: Query de busca (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de pipelines.`,
        inputSchema: ListPipelinesSchema.shape,
      },
      async (params: z.infer<typeof ListPipelinesSchema>) => {
        const validatedParams = ListPipelinesSchema.parse(params);
        return await this.listPipelines(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            page: validatedParams.page,
            pagelen: validatedParams.pagelen,
            sort: validatedParams.sort,
            q: validatedParams.q,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Run Pipeline
    server.registerTool(
      'pipeline_run',
      {
        description: `Executa um pipeline no Bitbucket Cloud.

**Funcionalidades:**
- Execução de pipeline
- Configuração de parâmetros
- Monitoramento de progresso

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`target\`: Target do pipeline (opcional)
- \`variables\`: Variáveis do pipeline (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pipeline executado.`,
        inputSchema: RunPipelineSchema.shape,
      },
      async (params: z.infer<typeof RunPipelineSchema>) => {
        const validatedParams = RunPipelineSchema.parse(params);
        return await this.runPipeline(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            target: validatedParams.target,
            variables: validatedParams.variables,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Get Pipeline
    server.registerTool(
      'pipeline_get',
      {
        description: `Obtém detalhes de um pipeline específico no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes do pipeline
- Status de execução
- Informações de configuração

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`pipeline_uuid\`: UUID do pipeline
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do pipeline.`,
        inputSchema: GetPipelineSchema.shape,
      },
      async (params: z.infer<typeof GetPipelineSchema>) => {
        const validatedParams = GetPipelineSchema.parse(params);
        return await this.getPipeline(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            pipeline_uuid: validatedParams.pipeline_uuid,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // List Pipeline Steps
    server.registerTool(
      'pipeline_list_steps',
      {
        description: `Lista steps de um pipeline no Bitbucket Cloud.

**Funcionalidades:**
- Listagem de steps
- Status de execução
- Informações de progresso

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`pipeline_uuid\`: UUID do pipeline
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de steps do pipeline.`,
        inputSchema: ListPipelineStepsSchema.shape,
      },
      async (params: z.infer<typeof ListPipelineStepsSchema>) => {
        const validatedParams = ListPipelineStepsSchema.parse(params);
        return await this.listPipelineSteps(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            pipeline_uuid: validatedParams.pipeline_uuid,
            page: validatedParams.page,
            pagelen: validatedParams.pagelen,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Get Pipeline Step
    server.registerTool(
      'pipeline_get_step',
      {
        description: `Obtém detalhes de um step específico de pipeline no Bitbucket Cloud.

**Funcionalidades:**
- Detalhes do step
- Status de execução
- Informações de configuração

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`pipeline_uuid\`: UUID do pipeline
- \`step_uuid\`: UUID do step
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do step.`,
        inputSchema: GetPipelineStepSchema.shape,
      },
      async (params: z.infer<typeof GetPipelineStepSchema>) => {
        const validatedParams = GetPipelineStepSchema.parse(params);
        return await this.getPipelineStep(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            pipeline_uuid: validatedParams.pipeline_uuid,
            step_uuid: validatedParams.step_uuid,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Get Pipeline Step Log
    server.registerTool(
      'pipeline_get_step_log',
      {
        description: `Obtém log de um step de pipeline no Bitbucket Cloud.

**Funcionalidades:**
- Logs de execução
- Informações de debug
- Histórico de execução

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`pipeline_uuid\`: UUID do pipeline
- \`step_uuid\`: UUID do step
- \`log_uuid\`: UUID do log (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o log do step.`,
        inputSchema: GetPipelineStepLogSchema.shape,
      },
      async (params: z.infer<typeof GetPipelineStepLogSchema>) => {
        const validatedParams = GetPipelineStepLogSchema.parse(params);
        return await this.getPipelineStepLog(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            pipeline_uuid: validatedParams.pipeline_uuid,
            step_uuid: validatedParams.step_uuid,
            log_uuid: validatedParams.log_uuid,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Stop Pipeline
    server.registerTool(
      'pipeline_stop',
      {
        description: `Para um pipeline em execução no Bitbucket Cloud.

**Funcionalidades:**
- Parada de pipeline
- Cancelamento de execução
- Limpeza de recursos

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`pipeline_uuid\`: UUID do pipeline
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da parada.`,
        inputSchema: StopPipelineSchema.shape,
      },
      async (params: z.infer<typeof StopPipelineSchema>) => {
        const validatedParams = StopPipelineSchema.parse(params);
        return await this.stopPipeline(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            pipeline_uuid: validatedParams.pipeline_uuid,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Get Configuration
    server.registerTool(
      'pipeline_get_configuration',
      {
        description: `Obtém configuração de pipeline no Bitbucket Cloud.

**Funcionalidades:**
- Configuração de pipeline
- Configurações de build
- Informações de ambiente

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração do pipeline.`,
        inputSchema: GetConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetConfigurationSchema>) => {
        const validatedParams = GetConfigurationSchema.parse(params);
        return await this.getConfiguration(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Update Configuration
    server.registerTool(
      'pipeline_update_configuration',
      {
        description: `Atualiza configuração de pipeline no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de configuração
- Modificação de parâmetros
- Configurações de ambiente

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`config\`: Configuração (JSON)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração atualizada.`,
        inputSchema: UpdateConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateConfigurationSchema>) => {
        const validatedParams = UpdateConfigurationSchema.parse(params);
        return await this.updateConfiguration(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            configuration: validatedParams.config,
          },
          validatedParams.output || 'json'
        );
      }
    );

    // Update Next Build Number
    server.registerTool(
      'pipeline_update_next_build_number',
      {
        description: `Atualiza próximo número de build no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de número de build
- Configuração de sequência
- Gerenciamento de builds

**Parâmetros:**
- \`workspace\`: Nome do workspace
- \`repo_slug\`: Slug do repositório
- \`build_number\`: Próximo número de build
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da atualização.`,
        inputSchema: UpdateNextBuildNumberSchema.shape,
      },
      async (params: z.infer<typeof UpdateNextBuildNumberSchema>) => {
        const validatedParams = UpdateNextBuildNumberSchema.parse(params);
        return await this.updateNextBuildNumber(
          {
            workspace: validatedParams.workspace,
            repo_slug: validatedParams.repo_slug,
            next_build_number: validatedParams.build_number,
          },
          validatedParams.output || 'json'
        );
      }
    );

    registerLogger.info('Successfully registered all cloud pipeline tools');
  }
}
