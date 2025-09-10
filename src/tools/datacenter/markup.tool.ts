import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { MarkupService } from '../../services/datacenter/markup.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const RenderMarkupSchema = z.object({
  type: z.string(),
  content: z.string(),
  context: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const PreviewMarkupSchema = z.object({
  type: z.string(),
  content: z.string(),
  context: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateMarkupSchema = z.object({
  type: z.string(),
  content: z.string(),
  strict: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSupportedMarkupTypesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RenderMarkupForRepositorySchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  type: z.string(),
  content: z.string(),
  context: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const PreviewMarkupForRepositorySchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  type: z.string(),
  content: z.string(),
  context: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateMarkupForRepositorySchema = z.object({
  projectKey: z.string(),
  repositorySlug: z.string(),
  type: z.string(),
  content: z.string(),
  strict: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RenderMarkupForProjectSchema = z.object({
  projectKey: z.string(),
  type: z.string(),
  content: z.string(),
  context: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const PreviewMarkupForProjectSchema = z.object({
  projectKey: z.string(),
  type: z.string(),
  content: z.string(),
  context: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateMarkupForProjectSchema = z.object({
  projectKey: z.string(),
  type: z.string(),
  content: z.string(),
  strict: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Markup Tools
 * Ferramentas para processamento de markup no Bitbucket Data Center
 */
export class DataCenterMarkupTools {
  private static logger = Logger.forContext('DataCenterMarkupTools');
  private static markupServicePool: Pool<MarkupService>;

  static initialize(): void {
    const markupServiceFactory = {
      create: async () => new MarkupService(new ApiClient(), Logger.forContext('MarkupService')),
      destroy: async () => {},
    };

    this.markupServicePool = createPool(markupServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Markup tools initialized');
  }

  static async renderMarkup(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('renderMarkup');
    let service: MarkupService | null = null;

    try {
      service = await this.markupServicePool.acquire();
      methodLogger.debug('Rendering markup:', {
        type: params.type,
        content_length: params.content?.length,
      });

      const result = await service.renderMarkup(params);

      methodLogger.info('Successfully rendered markup');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to render markup:', error);
      if (service) {
        this.markupServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.markupServicePool.release(service);
      }
    }
  }

  static async validateMarkup(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('validateMarkup');
    let service: MarkupService | null = null;

    try {
      service = await this.markupServicePool.acquire();
      methodLogger.debug('Validating markup:', {
        type: params.type,
        content_length: params.content?.length,
      });

      const result = await service.validateMarkup(params);

      methodLogger.info('Successfully validated markup');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate markup:', error);
      if (service) {
        this.markupServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.markupServicePool.release(service);
      }
    }
  }

  static async getMarkupTypes(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getMarkupTypes');
    let service: MarkupService | null = null;

    try {
      service = await this.markupServicePool.acquire();
      methodLogger.debug('Getting markup types');

      const result = await service.getSupportedMarkupTypes();

      methodLogger.info('Successfully retrieved markup types');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get markup types:', error);
      if (service) {
        this.markupServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.markupServicePool.release(service);
      }
    }
  }

  static async previewMarkup(request: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('previewMarkup');
    let service: MarkupService | null = null;

    try {
      service = await this.markupServicePool.acquire();
      methodLogger.debug('Previewing markup');

      const result = await service.previewMarkup(request);

      methodLogger.info('Successfully previewed markup');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to preview markup:', error);
      if (service) {
        this.markupServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.markupServicePool.release(service);
      }
    }
  }

  static async getSupportedMarkupTypes(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSupportedMarkupTypes');
    let service: MarkupService | null = null;

    try {
      service = await this.markupServicePool.acquire();
      methodLogger.debug('Getting supported markup types');

      const result = await service.getSupportedMarkupTypes();

      methodLogger.info('Successfully retrieved supported markup types');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get supported markup types:', error);
      if (service) {
        this.markupServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.markupServicePool.release(service);
      }
    }
  }

  static async renderMarkupForRepository(
    projectKey: string,
    repositorySlug: string,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('renderMarkupForRepository');
    let markupService = null;

    try {
      methodLogger.debug('Rendering markup for repository:', {
        projectKey,
        repositorySlug,
        request,
      });
      markupService = await this.markupServicePool.acquire();

      const result = await markupService.renderMarkupForRepository(
        projectKey,
        repositorySlug,
        request
      );

      methodLogger.debug('Successfully rendered markup for repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to render markup for repository:', error);
      if (markupService) {
        this.markupServicePool.destroy(markupService);
        markupService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (markupService) {
        this.markupServicePool.release(markupService);
      }
    }
  }

  static async previewMarkupForRepository(
    projectKey: string,
    repositorySlug: string,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('previewMarkupForRepository');
    let markupService = null;

    try {
      methodLogger.debug('Previewing markup for repository:', {
        projectKey,
        repositorySlug,
        request,
      });
      markupService = await this.markupServicePool.acquire();

      const result = await markupService.previewMarkupForRepository(
        projectKey,
        repositorySlug,
        request
      );

      methodLogger.debug('Successfully previewed markup for repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to preview markup for repository:', error);
      if (markupService) {
        this.markupServicePool.destroy(markupService);
        markupService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (markupService) {
        this.markupServicePool.release(markupService);
      }
    }
  }

  static async validateMarkupForRepository(
    projectKey: string,
    repositorySlug: string,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('validateMarkupForRepository');
    let markupService = null;

    try {
      methodLogger.debug('Validating markup for repository:', {
        projectKey,
        repositorySlug,
        request,
      });
      markupService = await this.markupServicePool.acquire();

      const result = await markupService.validateMarkupForRepository(
        projectKey,
        repositorySlug,
        request
      );

      methodLogger.debug('Successfully validated markup for repository');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate markup for repository:', error);
      if (markupService) {
        this.markupServicePool.destroy(markupService);
        markupService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (markupService) {
        this.markupServicePool.release(markupService);
      }
    }
  }

  static async renderMarkupForProject(
    projectKey: string,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('renderMarkupForProject');
    let markupService = null;

    try {
      methodLogger.debug('Rendering markup for project:', {
        projectKey,
        request,
      });
      markupService = await this.markupServicePool.acquire();

      const result = await markupService.renderMarkupForProject(projectKey, request);

      methodLogger.debug('Successfully rendered markup for project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to render markup for project:', error);
      if (markupService) {
        this.markupServicePool.destroy(markupService);
        markupService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (markupService) {
        this.markupServicePool.release(markupService);
      }
    }
  }

  static async previewMarkupForProject(
    projectKey: string,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('previewMarkupForProject');
    let markupService = null;

    try {
      methodLogger.debug('Previewing markup for project:', {
        projectKey,
        request,
      });
      markupService = await this.markupServicePool.acquire();

      const result = await markupService.previewMarkupForProject(projectKey, request);

      methodLogger.debug('Successfully previewed markup for project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to preview markup for project:', error);
      if (markupService) {
        this.markupServicePool.destroy(markupService);
        markupService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (markupService) {
        this.markupServicePool.release(markupService);
      }
    }
  }

  static async validateMarkupForProject(
    projectKey: string,
    request: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('validateMarkupForProject');
    let markupService = null;

    try {
      methodLogger.debug('Validating markup for project:', {
        projectKey,
        request,
      });
      markupService = await this.markupServicePool.acquire();

      const result = await markupService.validateMarkupForProject(projectKey, request);

      methodLogger.debug('Successfully validated markup for project');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate markup for project:', error);
      if (markupService) {
        this.markupServicePool.destroy(markupService);
        markupService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (markupService) {
        this.markupServicePool.release(markupService);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Render Markup
    server.registerTool(
      'markup_render',
      {
        description: `Renderiza markup para HTML no Bitbucket Data Center.

**Funcionalidades:**
- Renderização de markup
- Conversão para HTML
- Suporte a múltiplos formatos

**Parâmetros:**
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`context\`: Contexto de renderização (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o HTML renderizado.`,
        inputSchema: RenderMarkupSchema.shape,
      },
      async (params: z.infer<typeof RenderMarkupSchema>) => {
        const validatedParams = RenderMarkupSchema.parse(params);
        return await this.renderMarkup(
          {
            type: validatedParams.type,
            content: validatedParams.content,
            context: validatedParams.context,
          },
          validatedParams.output
        );
      }
    );

    // Preview Markup
    server.registerTool(
      'markup_preview',
      {
        description: `Visualiza markup no Bitbucket Data Center.

**Funcionalidades:**
- Visualização de markup
- Preview em tempo real
- Validação de sintaxe

**Parâmetros:**
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`context\`: Contexto de renderização (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o preview do markup.`,
        inputSchema: PreviewMarkupSchema.shape,
      },
      async (params: z.infer<typeof PreviewMarkupSchema>) => {
        const validatedParams = PreviewMarkupSchema.parse(params);
        return await this.previewMarkup(
          {
            type: validatedParams.type,
            content: validatedParams.content,
            context: validatedParams.context,
          },
          validatedParams.output
        );
      }
    );

    // Validate Markup
    server.registerTool(
      'markup_validate',
      {
        description: `Valida markup no Bitbucket Data Center.

**Funcionalidades:**
- Validação de sintaxe
- Verificação de erros
- Sugestões de correção

**Parâmetros:**
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`strict\`: Validação rigorosa (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateMarkupSchema.shape,
      },
      async (params: z.infer<typeof ValidateMarkupSchema>) => {
        const validatedParams = ValidateMarkupSchema.parse(params);
        return await this.validateMarkup(
          {
            type: validatedParams.type,
            content: validatedParams.content,
            strict: validatedParams.strict,
          },
          validatedParams.output
        );
      }
    );

    // Get Supported Markup Types
    server.registerTool(
      'markup_get_supported_types',
      {
        description: `Obtém tipos de markup suportados no Bitbucket Data Center.

**Funcionalidades:**
- Lista de tipos suportados
- Informações sobre cada tipo
- Configurações disponíveis

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os tipos de markup suportados.`,
        inputSchema: GetSupportedMarkupTypesSchema.shape,
      },
      async (params: z.infer<typeof GetSupportedMarkupTypesSchema>) => {
        const validatedParams = GetSupportedMarkupTypesSchema.parse(params);
        return await this.getSupportedMarkupTypes(validatedParams.output);
      }
    );

    // Render Markup for Repository
    server.registerTool(
      'markup_render_for_repository',
      {
        description: `Renderiza markup para HTML em um repositório específico no Bitbucket Data Center.

**Funcionalidades:**
- Renderização de markup para repositório
- Conversão para HTML
- Suporte a múltiplos formatos

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`context\`: Contexto de renderização (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o HTML renderizado.`,
        inputSchema: RenderMarkupForRepositorySchema.shape,
      },
      async (params: z.infer<typeof RenderMarkupForRepositorySchema>) => {
        const validatedParams = RenderMarkupForRepositorySchema.parse(params);
        return await this.renderMarkupForRepository(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          {
            type: validatedParams.type,
            content: validatedParams.content,
            context: validatedParams.context,
          },
          validatedParams.output
        );
      }
    );

    // Preview Markup for Repository
    server.registerTool(
      'markup_preview_for_repository',
      {
        description: `Visualiza markup em um repositório específico no Bitbucket Data Center.

**Funcionalidades:**
- Visualização de markup para repositório
- Preview em tempo real
- Validação de sintaxe

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`context\`: Contexto de renderização (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o preview do markup.`,
        inputSchema: PreviewMarkupForRepositorySchema.shape,
      },
      async (params: z.infer<typeof PreviewMarkupForRepositorySchema>) => {
        const validatedParams = PreviewMarkupForRepositorySchema.parse(params);
        return await this.previewMarkupForRepository(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          {
            type: validatedParams.type,
            content: validatedParams.content,
            context: validatedParams.context,
          },
          validatedParams.output
        );
      }
    );

    // Validate Markup for Repository
    server.registerTool(
      'markup_validate_for_repository',
      {
        description: `Valida markup em um repositório específico no Bitbucket Data Center.

**Funcionalidades:**
- Validação de sintaxe para repositório
- Verificação de erros
- Sugestões de correção

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`repositorySlug\`: Slug do repositório
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`strict\`: Validação rigorosa (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateMarkupForRepositorySchema.shape,
      },
      async (params: z.infer<typeof ValidateMarkupForRepositorySchema>) => {
        const validatedParams = ValidateMarkupForRepositorySchema.parse(params);
        return await this.validateMarkupForRepository(
          validatedParams.projectKey,
          validatedParams.repositorySlug,
          {
            type: validatedParams.type,
            content: validatedParams.content,
            strict: validatedParams.strict,
          },
          validatedParams.output
        );
      }
    );

    // Render Markup for Project
    server.registerTool(
      'markup_render_for_project',
      {
        description: `Renderiza markup para HTML em um projeto específico no Bitbucket Data Center.

**Funcionalidades:**
- Renderização de markup para projeto
- Conversão para HTML
- Suporte a múltiplos formatos

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`context\`: Contexto de renderização (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o HTML renderizado.`,
        inputSchema: RenderMarkupForProjectSchema.shape,
      },
      async (params: z.infer<typeof RenderMarkupForProjectSchema>) => {
        const validatedParams = RenderMarkupForProjectSchema.parse(params);
        return await this.renderMarkupForProject(
          validatedParams.projectKey,
          {
            type: validatedParams.type,
            content: validatedParams.content,
            context: validatedParams.context,
          },
          validatedParams.output
        );
      }
    );

    // Preview Markup for Project
    server.registerTool(
      'markup_preview_for_project',
      {
        description: `Visualiza markup em um projeto específico no Bitbucket Data Center.

**Funcionalidades:**
- Visualização de markup para projeto
- Preview em tempo real
- Validação de sintaxe

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`context\`: Contexto de renderização (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o preview do markup.`,
        inputSchema: PreviewMarkupForProjectSchema.shape,
      },
      async (params: z.infer<typeof PreviewMarkupForProjectSchema>) => {
        const validatedParams = PreviewMarkupForProjectSchema.parse(params);
        return await this.previewMarkupForProject(
          validatedParams.projectKey,
          {
            type: validatedParams.type,
            content: validatedParams.content,
            context: validatedParams.context,
          },
          validatedParams.output
        );
      }
    );

    // Validate Markup for Project
    server.registerTool(
      'markup_validate_for_project',
      {
        description: `Valida markup em um projeto específico no Bitbucket Data Center.

**Funcionalidades:**
- Validação de sintaxe para projeto
- Verificação de erros
- Sugestões de correção

**Parâmetros:**
- \`projectKey\`: Chave do projeto
- \`type\`: Tipo de markup (markdown, textile, etc.)
- \`content\`: Conteúdo em markup
- \`strict\`: Validação rigorosa (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateMarkupForProjectSchema.shape,
      },
      async (params: z.infer<typeof ValidateMarkupForProjectSchema>) => {
        const validatedParams = ValidateMarkupForProjectSchema.parse(params);
        return await this.validateMarkupForProject(
          validatedParams.projectKey,
          {
            type: validatedParams.type,
            content: validatedParams.content,
            strict: validatedParams.strict,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center markup tools');
  }
}
