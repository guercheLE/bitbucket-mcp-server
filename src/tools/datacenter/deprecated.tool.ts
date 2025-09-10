import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { DeprecatedService } from '../../services/datacenter/deprecated.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetDeprecatedEndpointsSchema = z.object({
  version: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecatedEndpointSchema = z.object({
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecatedEndpointUsageSchema = z.object({
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  since: z.string().optional(),
  until: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecatedFeaturesSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecatedFeatureSchema = z.object({
  feature: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecatedApiVersionsSchema = z.object({
  version: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecatedApiVersionSchema = z.object({
  version: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecationNoticesSchema = z.object({
  type: z.string().optional(),
  priority: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecationNoticeSchema = z.object({
  noticeId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecationPolicySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetDeprecationTimelineSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  category: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetResourceDeprecationTimelineSchema = z.object({
  resource: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CheckEndpointDeprecationSchema = z.object({
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetMigrationRecommendationsSchema = z.object({
  resource: z.string(),
  type: z.enum(['ENDPOINT', 'FEATURE', 'API_VERSION', 'PARAMETER']),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center Deprecated Tools
 * Ferramentas para gerenciamento de APIs depreciadas no Bitbucket Data Center
 */
export class DataCenterDeprecatedTools {
  private static logger = Logger.forContext('DataCenterDeprecatedTools');
  private static deprecatedServicePool: Pool<DeprecatedService>;

  static initialize(): void {
    const deprecatedServiceFactory = {
      create: async () =>
        new DeprecatedService(new ApiClient(), Logger.forContext('DeprecatedService')),
      destroy: async () => {},
    };

    this.deprecatedServicePool = createPool(deprecatedServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Deprecated tools initialized');
  }

  static async getDeprecatedEndpoints(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecatedEndpoints');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecated endpoints:', { params });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecatedEndpoints(params);

      methodLogger.debug('Successfully got deprecated endpoints');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecated endpoints:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecatedEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getDeprecatedEndpoint');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecated endpoint:', { endpoint, method });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecatedEndpoint(endpoint, method);

      methodLogger.debug('Successfully got deprecated endpoint');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecated endpoint:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecatedEndpointUsage(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecatedEndpointUsage');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecated endpoint usage:', { params });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecatedEndpointUsage(params);

      methodLogger.debug('Successfully got deprecated endpoint usage');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecated endpoint usage:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecatedFeatures(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecatedFeatures');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecated features:', { params });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecatedFeatures(params);

      methodLogger.debug('Successfully got deprecated features');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecated features:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecatedFeature(feature: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecatedFeature');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecated feature:', { feature });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecatedFeature(feature);

      methodLogger.debug('Successfully got deprecated feature');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecated feature:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecatedApiVersions(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecatedApiVersions');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecated API versions:', { params });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecatedApiVersions(params);

      methodLogger.debug('Successfully got deprecated API versions');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecated API versions:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecatedApiVersion(version: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecatedApiVersion');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecated API version:', { version });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecatedApiVersion(version);

      methodLogger.debug('Successfully got deprecated API version');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecated API version:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecationNotices(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecationNotices');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecation notices:', { params });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecationNotices(params);

      methodLogger.debug('Successfully got deprecation notices');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecation notices:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecationNotice(noticeId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecationNotice');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecation notice:', { noticeId });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecationNotice(noticeId);

      methodLogger.debug('Successfully got deprecation notice');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecation notice:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecationPolicy(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecationPolicy');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecation policy');
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecationPolicy();

      methodLogger.debug('Successfully got deprecation policy');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecation policy:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getDeprecationTimeline(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getDeprecationTimeline');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting deprecation timeline:', { params });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getDeprecationTimeline(params);

      methodLogger.debug('Successfully got deprecation timeline');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get deprecation timeline:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getResourceDeprecationTimeline(
    resource: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getResourceDeprecationTimeline');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting resource deprecation timeline:', { resource });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getResourceDeprecationTimeline(resource);

      methodLogger.debug('Successfully got resource deprecation timeline');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get resource deprecation timeline:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async checkEndpointDeprecation(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('checkEndpointDeprecation');
    let deprecatedService = null;

    try {
      methodLogger.debug('Checking endpoint deprecation:', { endpoint, method });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.checkEndpointDeprecation(endpoint, method);

      methodLogger.debug('Successfully checked endpoint deprecation');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to check endpoint deprecation:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static async getMigrationRecommendations(
    resource: string,
    type: 'ENDPOINT' | 'FEATURE' | 'API_VERSION' | 'PARAMETER',
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('getMigrationRecommendations');
    let deprecatedService = null;

    try {
      methodLogger.debug('Getting migration recommendations:', { resource, type });
      deprecatedService = await this.deprecatedServicePool.acquire();

      const result = await deprecatedService.getMigrationRecommendations(resource, type);

      methodLogger.debug('Successfully got migration recommendations');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get migration recommendations:', error);
      if (deprecatedService) {
        this.deprecatedServicePool.destroy(deprecatedService);
        deprecatedService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (deprecatedService) {
        this.deprecatedServicePool.release(deprecatedService);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get Deprecated Endpoints
    server.registerTool(
      'deprecation_get_deprecated_endpoints',
      {
        description: `Obtém lista de endpoints depreciados no Bitbucket Data Center.

**Funcionalidades:**
- Lista de endpoints depreciados
- Informações de depreciação
- Cronograma de remoção

**Parâmetros:**
- \`version\`: Versão da API (opcional)
- \`status\`: Status da depreciação (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de endpoints depreciados.`,
        inputSchema: GetDeprecatedEndpointsSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecatedEndpointsSchema>) => {
        const validatedParams = GetDeprecatedEndpointsSchema.parse(params);
        return await this.getDeprecatedEndpoints(
          {
            version: validatedParams.version,
            status: validatedParams.status,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Deprecated Features
    server.registerTool(
      'deprecation_get_deprecated_features',
      {
        description: `Obtém lista de funcionalidades depreciadas no Bitbucket Data Center.

**Funcionalidades:**
- Lista de funcionalidades depreciadas
- Informações de depreciação
- Alternativas recomendadas

**Parâmetros:**
- \`category\`: Categoria da funcionalidade (opcional)
- \`status\`: Status da depreciação (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de funcionalidades depreciadas.`,
        inputSchema: GetDeprecatedFeaturesSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecatedFeaturesSchema>) => {
        const validatedParams = GetDeprecatedFeaturesSchema.parse(params);
        return await this.getDeprecatedFeatures(
          {
            category: validatedParams.category,
            status: validatedParams.status,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Deprecation Policy
    server.registerTool(
      'deprecation_get_policy',
      {
        description: `Obtém política de depreciação no Bitbucket Data Center.

**Funcionalidades:**
- Política de depreciação
- Cronograma de remoção
- Processo de migração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a política de depreciação.`,
        inputSchema: GetDeprecationPolicySchema.shape,
      },
      async (params: z.infer<typeof GetDeprecationPolicySchema>) => {
        const validatedParams = GetDeprecationPolicySchema.parse(params);
        return await this.getDeprecationPolicy(validatedParams.output);
      }
    );

    // Get Deprecation Timeline
    server.registerTool(
      'deprecation_get_timeline',
      {
        description: `Obtém cronograma de depreciação no Bitbucket Data Center.

**Funcionalidades:**
- Cronograma de depreciação
- Datas importantes
- Marcos de migração

**Parâmetros:**
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`category\`: Categoria (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o cronograma de depreciação.`,
        inputSchema: GetDeprecationTimelineSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecationTimelineSchema>) => {
        const validatedParams = GetDeprecationTimelineSchema.parse(params);
        return await this.getDeprecationTimeline(
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            category: validatedParams.category,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Deprecation Notices
    server.registerTool(
      'deprecation_get_notices',
      {
        description: `Obtém avisos de depreciação no Bitbucket Data Center.

**Funcionalidades:**
- Avisos de depreciação
- Notificações importantes
- Alertas de migração

**Parâmetros:**
- \`type\`: Tipo de aviso (opcional)
- \`priority\`: Prioridade (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os avisos de depreciação.`,
        inputSchema: GetDeprecationNoticesSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecationNoticesSchema>) => {
        const validatedParams = GetDeprecationNoticesSchema.parse(params);
        return await this.getDeprecationNotices(
          {
            type: validatedParams.type,
            priority: validatedParams.priority,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Deprecated Endpoint
    server.registerTool(
      'deprecated_get_endpoint',
      {
        description: `Obtém um endpoint depreciado específico no Bitbucket Data Center.

**Funcionalidades:**
- Endpoint depreciado específico
- Detalhes do endpoint
- Informações de depreciação

**Parâmetros:**
- \`endpoint\`: Caminho do endpoint
- \`method\`: Método HTTP

**Retorna:** Objeto com content contendo detalhes do endpoint depreciado.`,
        inputSchema: GetDeprecatedEndpointSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecatedEndpointSchema>) => {
        const validatedParams = GetDeprecatedEndpointSchema.parse(params);
        return await this.getDeprecatedEndpoint(
          validatedParams.endpoint,
          validatedParams.method,
          validatedParams.output
        );
      }
    );

    // Get Deprecated Endpoint Usage
    server.registerTool(
      'deprecated_get_endpoint_usage',
      {
        description: `Obtém uso de endpoint depreciado no Bitbucket Data Center.

**Funcionalidades:**
- Estatísticas de uso do endpoint
- Padrões de uso
- Dados de migração

**Parâmetros:**
- \`endpoint\`: Caminho do endpoint
- \`method\`: Método HTTP
- \`since\`: Data de início (opcional)
- \`until\`: Data de fim (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo dados de uso do endpoint.`,
        inputSchema: GetDeprecatedEndpointUsageSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecatedEndpointUsageSchema>) => {
        const validatedParams = GetDeprecatedEndpointUsageSchema.parse(params);
        return await this.getDeprecatedEndpointUsage(
          {
            endpoint: validatedParams.endpoint,
            method: validatedParams.method,
            since: validatedParams.since,
            until: validatedParams.until,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Deprecated Feature
    server.registerTool(
      'deprecated_get_feature',
      {
        description: `Obtém uma funcionalidade depreciada específica no Bitbucket Data Center.

**Funcionalidades:**
- Funcionalidade depreciada específica
- Detalhes da funcionalidade
- Cronograma de depreciação

**Parâmetros:**
- \`feature\`: Nome da funcionalidade

**Retorna:** Objeto com content contendo detalhes da funcionalidade depreciada.`,
        inputSchema: GetDeprecatedFeatureSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecatedFeatureSchema>) => {
        const validatedParams = GetDeprecatedFeatureSchema.parse(params);
        return await this.getDeprecatedFeature(validatedParams.feature, validatedParams.output);
      }
    );

    // Get Deprecated API Versions
    server.registerTool(
      'deprecated_get_api_versions',
      {
        description: `Obtém versões de API depreciadas no Bitbucket Data Center.

**Funcionalidades:**
- Versões de API depreciadas
- Detalhes da versão
- Informações de migração

**Parâmetros:**
- \`version\`: Versão da API (opcional)
- \`status\`: Status da depreciação (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)

**Retorna:** Objeto com content contendo versões de API depreciadas.`,
        inputSchema: GetDeprecatedApiVersionsSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecatedApiVersionsSchema>) => {
        const validatedParams = GetDeprecatedApiVersionsSchema.parse(params);
        return await this.getDeprecatedApiVersions(
          {
            version: validatedParams.version,
            status: validatedParams.status,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Deprecated API Version
    server.registerTool(
      'deprecated_get_api_version',
      {
        description: `Obtém uma versão de API depreciada específica no Bitbucket Data Center.

**Funcionalidades:**
- Versão de API depreciada específica
- Detalhes da versão
- Cronograma de migração

**Parâmetros:**
- \`version\`: Versão da API

**Retorna:** Objeto com content contendo detalhes da versão de API depreciada.`,
        inputSchema: GetDeprecatedApiVersionSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecatedApiVersionSchema>) => {
        const validatedParams = GetDeprecatedApiVersionSchema.parse(params);
        return await this.getDeprecatedApiVersion(validatedParams.version, validatedParams.output);
      }
    );

    // Get Deprecation Notice
    server.registerTool(
      'deprecated_get_deprecation_notice',
      {
        description: `Obtém um aviso de depreciação específico no Bitbucket Data Center.

**Funcionalidades:**
- Aviso de depreciação específico
- Detalhes do aviso
- Informações importantes

**Parâmetros:**
- \`noticeId\`: ID do aviso

**Retorna:** Objeto com content contendo detalhes do aviso de depreciação.`,
        inputSchema: GetDeprecationNoticeSchema.shape,
      },
      async (params: z.infer<typeof GetDeprecationNoticeSchema>) => {
        const validatedParams = GetDeprecationNoticeSchema.parse(params);
        return await this.getDeprecationNotice(validatedParams.noticeId, validatedParams.output);
      }
    );

    // Get Resource Deprecation Timeline
    server.registerTool(
      'deprecated_get_resource_deprecation_timeline',
      {
        description: `Obtém cronograma de depreciação de recurso no Bitbucket Data Center.

**Funcionalidades:**
- Cronograma de depreciação de recurso
- Cronograma específico do recurso
- Agendamento de migração

**Parâmetros:**
- \`resource\`: Nome do recurso

**Retorna:** Objeto com content contendo cronograma de depreciação do recurso.`,
        inputSchema: GetResourceDeprecationTimelineSchema.shape,
      },
      async (params: z.infer<typeof GetResourceDeprecationTimelineSchema>) => {
        const validatedParams = GetResourceDeprecationTimelineSchema.parse(params);
        return await this.getResourceDeprecationTimeline(
          validatedParams.resource,
          validatedParams.output
        );
      }
    );

    // Check Endpoint Deprecation
    server.registerTool(
      'deprecated_check_endpoint_deprecation',
      {
        description: `Verifica status de depreciação de endpoint no Bitbucket Data Center.

**Funcionalidades:**
- Verificação de depreciação de endpoint
- Status de depreciação
- Requisitos de migração

**Parâmetros:**
- \`endpoint\`: Caminho do endpoint
- \`method\`: Método HTTP

**Retorna:** Objeto com content contendo status de depreciação do endpoint.`,
        inputSchema: CheckEndpointDeprecationSchema.shape,
      },
      async (params: z.infer<typeof CheckEndpointDeprecationSchema>) => {
        const validatedParams = CheckEndpointDeprecationSchema.parse(params);
        return await this.checkEndpointDeprecation(
          validatedParams.endpoint,
          validatedParams.method,
          validatedParams.output
        );
      }
    );

    // Get Migration Recommendations
    server.registerTool(
      'deprecated_get_migration_recommendations',
      {
        description: `Obtém recomendações de migração no Bitbucket Data Center.

**Funcionalidades:**
- Recomendações de migração
- Melhores práticas
- Guias de migração

**Parâmetros:**
- \`resource\`: Nome do recurso
- \`type\`: Tipo do recurso

**Retorna:** Objeto com content contendo recomendações de migração.`,
        inputSchema: GetMigrationRecommendationsSchema.shape,
      },
      async (params: z.infer<typeof GetMigrationRecommendationsSchema>) => {
        const validatedParams = GetMigrationRecommendationsSchema.parse(params);
        return await this.getMigrationRecommendations(
          validatedParams.resource,
          validatedParams.type,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center deprecated tools');
  }
}
