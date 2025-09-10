import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { SamlConfigurationService } from '../../services/datacenter/saml-configuration.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const OutputOnlySchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateSamlConfigurationSchema = z.object({
  name: z.string(),
  entity_id: z.string(),
  sso_url: z.string(),
  certificate: z.string().optional(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSamlConfigurationSchema = z.object({
  configuration_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateSamlConfigurationSchema = z.object({
  configuration_id: z.number(),
  name: z.string().optional(),
  entity_id: z.string().optional(),
  sso_url: z.string().optional(),
  certificate: z.string().optional(),
  enabled: z.boolean().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteSamlConfigurationSchema = z.object({
  configuration_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const TestSamlConfigurationSchema = z.object({
  name: z.string(),
  entity_id: z.string(),
  sso_url: z.string(),
  certificate: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSamlMetadataSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UploadSamlCertificateSchema = z.object({
  certificate_data: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSamlCertificateSchema = z.object({
  certificate_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteSamlCertificateSchema = z.object({
  certificate_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSamlUserMappingsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSamlUserMappingSchema = z.object({
  username: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSamlGroupMappingsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSamlGroupMappingSchema = z.object({
  saml_group: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const EnableSamlConfigurationSchema = z.object({
  configuration_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DisableSamlConfigurationSchema = z.object({
  configuration_id: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * Data Center SAML Configuration Tools
 * Ferramentas para gerenciamento de configurações SAML no Bitbucket Data Center
 */
export class DataCenterSamlConfigurationTools {
  private static logger = Logger.forContext('DataCenterSamlConfigurationTools');
  private static samlConfigurationServicePool: Pool<SamlConfigurationService>;

  static initialize(): void {
    const samlConfigurationServiceFactory = {
      create: async () =>
        new SamlConfigurationService(
          new ApiClient(),
          Logger.forContext('SamlConfigurationService')
        ),
      destroy: async () => {},
    };

    this.samlConfigurationServicePool = createPool(samlConfigurationServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center SAML Configuration tools initialized');
  }

  // Static Methods
  static async listSamlConfigurations(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('listSamlConfigurations');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Listing SAML configurations');

      const result = await service.listSamlConfigurations();

      methodLogger.info('Successfully listed SAML configurations');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list SAML configurations:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async createSamlConfiguration(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('createSamlConfiguration');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Creating SAML configuration:', {
        name: params.name,
        entity_id: params.entity_id,
        sso_url: params.sso_url,
      });

      const result = await service.createSamlConfiguration({
        name: params.name,
        entityId: params.entity_id,
        ssoUrl: params.sso_url,
        certificate: {
          data: params.certificate || '',
        },
        enabled: params.enabled,
        attributeMapping: {
          username: 'username',
          email: 'email',
        },
      });

      methodLogger.info('Successfully created SAML configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create SAML configuration:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async getSamlConfiguration(configurationId: number, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSamlConfiguration');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Getting SAML configuration:', {
        configuration_id: configurationId,
      });

      const result = await service.getSamlConfiguration(configurationId);

      methodLogger.info('Successfully retrieved SAML configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SAML configuration:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async updateSamlConfiguration(
    configurationId: number,
    params: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateSamlConfiguration');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Updating SAML configuration:', {
        configuration_id: configurationId,
        name: params.name,
        entity_id: params.entity_id,
        sso_url: params.sso_url,
      });

      const result = await service.updateSamlConfiguration(configurationId, {
        name: params.name,
        entityId: params.entity_id,
        ssoUrl: params.sso_url,
        certificate: params.certificate
          ? {
              data: params.certificate,
            }
          : undefined,
        enabled: params.enabled,
      });

      methodLogger.info('Successfully updated SAML configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update SAML configuration:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async deleteSamlConfiguration(
    configurationId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteSamlConfiguration');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Deleting SAML configuration:', {
        configuration_id: configurationId,
      });

      await service.deleteSamlConfiguration(configurationId);

      methodLogger.info('Successfully deleted SAML configuration');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete SAML configuration:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async testSamlConfiguration(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('testSamlConfiguration');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Testing SAML configuration:', {
        name: params.name,
        entity_id: params.entity_id,
        sso_url: params.sso_url,
      });

      const result = await service.testSamlConfiguration({
        entityId: params.entity_id,
        ssoUrl: params.sso_url,
        certificate: {
          data: params.certificate || '',
        },
        attributeMapping: {
          username: 'username',
          email: 'email',
        },
      });

      methodLogger.info('Successfully tested SAML configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to test SAML configuration:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async getSamlMetadata(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSamlMetadata');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Getting SAML metadata');

      const result = await service.getSamlMetadata();

      methodLogger.info('Successfully retrieved SAML metadata');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SAML metadata:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async uploadSamlCertificate(params: any, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('uploadSamlCertificate');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Uploading SAML certificate:', {
        certificate_name: params.certificate_name,
      });

      const result = await service.uploadSamlCertificate({
        data: params.certificate_data,
      });

      methodLogger.info('Successfully uploaded SAML certificate');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to upload SAML certificate:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async getSamlCertificate(certificateId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSamlCertificate');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Getting SAML certificate:', {
        certificate_id: certificateId,
      });

      const result = await service.getSamlCertificate(certificateId);

      methodLogger.info('Successfully retrieved SAML certificate');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SAML certificate:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async deleteSamlCertificate(certificateId: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('deleteSamlCertificate');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Deleting SAML certificate:', {
        certificate_id: certificateId,
      });

      await service.deleteSamlCertificate(certificateId);

      methodLogger.info('Successfully deleted SAML certificate');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to delete SAML certificate:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async getSamlUserMappings(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSamlUserMappings');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Getting SAML user mappings');

      const result = await service.getSamlUserMappings();

      methodLogger.info('Successfully retrieved SAML user mappings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SAML user mappings:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async getSamlUserMapping(username: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSamlUserMapping');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Getting SAML user mapping:', {
        username: username,
      });

      const result = await service.getSamlUserMapping(username);

      methodLogger.info('Successfully retrieved SAML user mapping');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SAML user mapping:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async getSamlGroupMappings(output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSamlGroupMappings');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Getting SAML group mappings');

      const result = await service.getSamlGroupMappings();

      methodLogger.info('Successfully retrieved SAML group mappings');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SAML group mappings:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async getSamlGroupMapping(samlGroup: string, output: 'markdown' | 'json' = 'json') {
    const methodLogger = this.logger.forMethod('getSamlGroupMapping');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Getting SAML group mapping:', {
        saml_group: samlGroup,
      });

      const result = await service.getSamlGroupMapping(samlGroup);

      methodLogger.info('Successfully retrieved SAML group mapping');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SAML group mapping:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async enableSamlConfiguration(
    configurationId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('enableSamlConfiguration');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Enabling SAML configuration:', {
        configuration_id: configurationId,
      });

      await service.enableSamlConfiguration(configurationId);

      methodLogger.info('Successfully enabled SAML configuration');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to enable SAML configuration:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static async disableSamlConfiguration(
    configurationId: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('disableSamlConfiguration');
    let service: SamlConfigurationService | null = null;

    try {
      service = await this.samlConfigurationServicePool.acquire();
      methodLogger.debug('Disabling SAML configuration:', {
        configuration_id: configurationId,
      });

      await service.disableSamlConfiguration(configurationId);

      methodLogger.info('Successfully disabled SAML configuration');
      return createMcpResponse({ success: true }, output);
    } catch (error) {
      methodLogger.error('Failed to disable SAML configuration:', error);
      if (service) {
        this.samlConfigurationServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.samlConfigurationServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // List SAML Configurations
    server.registerTool(
      'saml_list_configurations',
      {
        description: `Lista configurações SAML no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de configurações
- Informações de status
- Configurações ativas

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de configurações SAML.`,
        inputSchema: OutputOnlySchema.shape,
      },
      async (params: z.infer<typeof OutputOnlySchema>) => {
        const validatedParams = OutputOnlySchema.parse(params);
        return await this.listSamlConfigurations(validatedParams.output);
      }
    );

    // Create SAML Configuration
    server.registerTool(
      'saml_create_configuration',
      {
        description: `Cria uma nova configuração SAML no Bitbucket Data Center.

**Funcionalidades:**
- Criação de configurações
- Configuração de autenticação
- Metadados da configuração

**Parâmetros:**
- \`name\`: Nome da configuração
- \`entity_id\`: ID da entidade
- \`sso_url\`: URL de SSO
- \`certificate\`: Certificado (opcional)
- \`enabled\`: Se a configuração está habilitada (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração criada.`,
        inputSchema: CreateSamlConfigurationSchema.shape,
      },
      async (params: z.infer<typeof CreateSamlConfigurationSchema>) => {
        const validatedParams = CreateSamlConfigurationSchema.parse(params);
        return await this.createSamlConfiguration(
          {
            name: validatedParams.name,
            entity_id: validatedParams.entity_id,
            sso_url: validatedParams.sso_url,
            certificate: validatedParams.certificate,
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Get SAML Configuration
    server.registerTool(
      'saml_get_configuration',
      {
        description: `Obtém uma configuração SAML específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da configuração
- Informações de status
- Configurações específicas

**Parâmetros:**
- \`configuration_id\`: ID da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração.`,
        inputSchema: GetSamlConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetSamlConfigurationSchema>) => {
        const validatedParams = GetSamlConfigurationSchema.parse(params);
        return await this.getSamlConfiguration(
          validatedParams.configuration_id,
          validatedParams.output
        );
      }
    );

    // Update SAML Configuration
    server.registerTool(
      'saml_update_configuration',
      {
        description: `Atualiza uma configuração SAML existente no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de parâmetros
- Alteração de status

**Parâmetros:**
- \`configuration_id\`: ID da configuração
- \`name\`: Novo nome da configuração (opcional)
- \`entity_id\`: Novo ID da entidade (opcional)
- \`sso_url\`: Nova URL de SSO (opcional)
- \`certificate\`: Novo certificado (opcional)
- \`enabled\`: Se a configuração está habilitada (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da configuração atualizada.`,
        inputSchema: UpdateSamlConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateSamlConfigurationSchema>) => {
        const validatedParams = UpdateSamlConfigurationSchema.parse(params);
        return await this.updateSamlConfiguration(
          validatedParams.configuration_id,
          {
            name: validatedParams.name,
            entity_id: validatedParams.entity_id,
            sso_url: validatedParams.sso_url,
            certificate: validatedParams.certificate,
            enabled: validatedParams.enabled,
          },
          validatedParams.output
        );
      }
    );

    // Delete SAML Configuration
    server.registerTool(
      'saml_delete_configuration',
      {
        description: `Exclui uma configuração SAML no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de configurações
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- \`configuration_id\`: ID da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.`,
        inputSchema: DeleteSamlConfigurationSchema.shape,
      },
      async (params: z.infer<typeof DeleteSamlConfigurationSchema>) => {
        const validatedParams = DeleteSamlConfigurationSchema.parse(params);
        return await this.deleteSamlConfiguration(
          validatedParams.configuration_id,
          validatedParams.output
        );
      }
    );

    // Test SAML Configuration
    server.registerTool(
      'saml_test_configuration',
      {
        description: `Testa uma configuração SAML no Bitbucket Data Center.

**Funcionalidades:**
- Teste de configuração
- Validação de parâmetros
- Verificação de conectividade

**Parâmetros:**
- \`name\`: Nome da configuração
- \`entity_id\`: ID da entidade
- \`sso_url\`: URL de SSO
- \`certificate\`: Certificado (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados do teste.`,
        inputSchema: TestSamlConfigurationSchema.shape,
      },
      async (params: z.infer<typeof TestSamlConfigurationSchema>) => {
        const validatedParams = TestSamlConfigurationSchema.parse(params);
        return await this.testSamlConfiguration(
          {
            name: validatedParams.name,
            entity_id: validatedParams.entity_id,
            sso_url: validatedParams.sso_url,
            certificate: validatedParams.certificate,
          },
          validatedParams.output
        );
      }
    );

    // Get SAML Metadata
    server.registerTool(
      'saml_get_metadata',
      {
        description: `Obtém metadados SAML no Bitbucket Data Center.

**Funcionalidades:**
- Metadados de configuração
- Informações de entidade
- Configurações de SSO

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os metadados SAML.`,
        inputSchema: GetSamlMetadataSchema.shape,
      },
      async (params: z.infer<typeof GetSamlMetadataSchema>) => {
        const validatedParams = GetSamlMetadataSchema.parse(params);
        return await this.getSamlMetadata(validatedParams.output);
      }
    );

    // Upload SAML Certificate
    server.registerTool(
      'saml_upload_certificate',
      {
        description: `Faz upload de um certificado SAML no Bitbucket Data Center.

**Funcionalidades:**
- Upload de certificados
- Validação de formato
- Armazenamento seguro

**Parâmetros:**
- \`certificate_data\`: Dados do certificado
- \`certificate_name\`: Nome do certificado (opcional)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do certificado enviado.`,
        inputSchema: UploadSamlCertificateSchema.shape,
      },
      async (params: z.infer<typeof UploadSamlCertificateSchema>) => {
        const validatedParams = UploadSamlCertificateSchema.parse(params);
        return await this.uploadSamlCertificate(
          {
            certificate_data: validatedParams.certificate_data,
          },
          validatedParams.output
        );
      }
    );

    // Get SAML Certificate
    server.registerTool(
      'saml_get_certificate',
      {
        description: `Obtém um certificado SAML específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do certificado
- Informações de validade
- Dados do certificado

**Parâmetros:**
- \`certificate_id\`: ID do certificado

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do certificado.`,
        inputSchema: GetSamlCertificateSchema.shape,
      },
      async (params: z.infer<typeof GetSamlCertificateSchema>) => {
        const validatedParams = GetSamlCertificateSchema.parse(params);
        return await this.getSamlCertificate(
          validatedParams.certificate_id,
          validatedParams.output
        );
      }
    );

    // Delete SAML Certificate
    server.registerTool(
      'saml_delete_certificate',
      {
        description: `Exclui um certificado SAML no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de certificados
- Limpeza de recursos
- Verificação de dependências

**Parâmetros:**
- \`certificate_id\`: ID do certificado

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da exclusão.`,
        inputSchema: DeleteSamlCertificateSchema.shape,
      },
      async (params: z.infer<typeof DeleteSamlCertificateSchema>) => {
        const validatedParams = DeleteSamlCertificateSchema.parse(params);
        return await this.deleteSamlCertificate(
          validatedParams.certificate_id,
          validatedParams.output
        );
      }
    );

    // Get SAML User Mappings
    server.registerTool(
      'saml_get_user_mappings',
      {
        description: `Obtém mapeamentos de usuários SAML no Bitbucket Data Center.

**Funcionalidades:**
- Lista de mapeamentos
- Configurações de usuário
- Informações de atributos

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de mapeamentos de usuários.`,
        inputSchema: GetSamlUserMappingsSchema.shape,
      },
      async (params: z.infer<typeof GetSamlUserMappingsSchema>) => {
        const validatedParams = GetSamlUserMappingsSchema.parse(params);
        return await this.getSamlUserMappings(validatedParams.output);
      }
    );

    // Get SAML User Mapping
    server.registerTool(
      'saml_get_user_mapping',
      {
        description: `Obtém um mapeamento de usuário SAML específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do mapeamento
- Configurações específicas
- Informações de atributos

**Parâmetros:**
- \`username\`: Nome do usuário

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do mapeamento.`,
        inputSchema: GetSamlUserMappingSchema.shape,
      },
      async (params: z.infer<typeof GetSamlUserMappingSchema>) => {
        const validatedParams = GetSamlUserMappingSchema.parse(params);
        return await this.getSamlUserMapping(validatedParams.username, validatedParams.output);
      }
    );

    // Get SAML Group Mappings
    server.registerTool(
      'saml_get_group_mappings',
      {
        description: `Obtém mapeamentos de grupos SAML no Bitbucket Data Center.

**Funcionalidades:**
- Lista de mapeamentos
- Configurações de grupo
- Informações de atributos

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de mapeamentos de grupos.`,
        inputSchema: GetSamlGroupMappingsSchema.shape,
      },
      async (params: z.infer<typeof GetSamlGroupMappingsSchema>) => {
        const validatedParams = GetSamlGroupMappingsSchema.parse(params);
        return await this.getSamlGroupMappings(validatedParams.output);
      }
    );

    // Get SAML Group Mapping
    server.registerTool(
      'saml_get_group_mapping',
      {
        description: `Obtém um mapeamento de grupo SAML específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do mapeamento
- Configurações específicas
- Informações de atributos

**Parâmetros:**
- \`saml_group\`: Nome do grupo SAML

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do mapeamento.`,
        inputSchema: GetSamlGroupMappingSchema.shape,
      },
      async (params: z.infer<typeof GetSamlGroupMappingSchema>) => {
        const validatedParams = GetSamlGroupMappingSchema.parse(params);
        return await this.getSamlGroupMapping(validatedParams.saml_group, validatedParams.output);
      }
    );

    // Enable SAML Configuration
    server.registerTool(
      'saml_enable_configuration',
      {
        description: `Habilita uma configuração SAML no Bitbucket Data Center.

**Funcionalidades:**
- Habilitação de configuração
- Ativação de autenticação
- Configurações de segurança

**Parâmetros:**
- \`configuration_id\`: ID da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da habilitação.`,
        inputSchema: EnableSamlConfigurationSchema.shape,
      },
      async (params: z.infer<typeof EnableSamlConfigurationSchema>) => {
        const validatedParams = EnableSamlConfigurationSchema.parse(params);
        return await this.enableSamlConfiguration(
          validatedParams.configuration_id,
          validatedParams.output
        );
      }
    );

    // Disable SAML Configuration
    server.registerTool(
      'saml_disable_configuration',
      {
        description: `Desabilita uma configuração SAML no Bitbucket Data Center.

**Funcionalidades:**
- Desabilitação de configuração
- Desativação de autenticação
- Limpeza de configurações

**Parâmetros:**
- \`configuration_id\`: ID da configuração

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da desabilitação.`,
        inputSchema: DisableSamlConfigurationSchema.shape,
      },
      async (params: z.infer<typeof DisableSamlConfigurationSchema>) => {
        const validatedParams = DisableSamlConfigurationSchema.parse(params);
        return await this.disableSamlConfiguration(
          validatedParams.configuration_id,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center SAML configuration tools');
  }
}
