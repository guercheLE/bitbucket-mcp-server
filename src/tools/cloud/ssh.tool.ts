import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { SSHService } from '../../services/cloud/ssh.service.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const ListSSHKeysSchema = z.object({
  selectedUser: z.string(),
  page: z.number().optional(),
  pagelen: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateSSHKeySchema = z.object({
  selectedUser: z.string(),
  sshKey: z.any(),
  expiresOn: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSSHKeySchema = z.object({
  selectedUser: z.string(),
  keyId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateSSHKeySchema = z.object({
  selectedUser: z.string(),
  keyId: z.string(),
  sshKey: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteSSHKeySchema = z.object({
  selectedUser: z.string(),
  keyId: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

/**
 * SSH Tools for Bitbucket Cloud
 *
 * Comprehensive SSH key management including:
 * - List SSH keys
 * - Create SSH keys
 * - Get SSH keys
 * - Update SSH keys
 * - Delete SSH keys
 */
export class CloudSSHTools {
  private static logger = Logger.forContext('CloudSSHTools');
  private static sshServicePool: Pool<SSHService>;

  static initialize(): void {
    const sshServiceFactory = {
      create: async () => new SSHService(new ApiClient()),
      destroy: async () => {},
    };

    this.sshServicePool = createPool(sshServiceFactory, { min: 2, max: 10 });
    this.logger.info('Cloud SSH tools initialized');
  }

  /**
   * List SSH keys
   */
  static async listSSHKeys(
    selectedUser: string,
    page?: number,
    pagelen?: number,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('listSSHKeys');
    let sshService = null;

    try {
      methodLogger.debug('Listing SSH keys:', { selectedUser, page, pagelen });
      sshService = await this.sshServicePool.acquire();

      const result = await sshService.listSSHKeys({
        selected_user: selectedUser,
        page: page || 1,
        pagelen: pagelen || 10,
      });

      methodLogger.debug('Successfully listed SSH keys');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list SSH keys:', error);
      if (sshService) {
        this.sshServicePool.destroy(sshService);
        sshService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sshService) {
        this.sshServicePool.release(sshService);
      }
    }
  }

  /**
   * Create a SSH key
   */
  static async createSSHKey(
    selectedUser: string,
    sshKey: any,
    expiresOn?: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('createSSHKey');
    let sshService = null;

    try {
      methodLogger.debug('Creating SSH key:', { selectedUser, sshKey, expiresOn });
      sshService = await this.sshServicePool.acquire();

      const result = await sshService.createSSHKey({
        selected_user: selectedUser,
        ssh_key: sshKey,
        expires_on: expiresOn,
      });

      methodLogger.debug('Successfully created SSH key');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create SSH key:', error);
      if (sshService) {
        this.sshServicePool.destroy(sshService);
        sshService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sshService) {
        this.sshServicePool.release(sshService);
      }
    }
  }

  /**
   * Get a SSH key
   */
  static async getSSHKey(
    selectedUser: string,
    keyId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('getSSHKey');
    let sshService = null;

    try {
      methodLogger.debug('Getting SSH key:', { selectedUser, keyId });
      sshService = await this.sshServicePool.acquire();

      const result = await sshService.getSSHKey({
        selected_user: selectedUser,
        key_id: keyId,
      });

      methodLogger.debug('Successfully retrieved SSH key');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get SSH key:', error);
      if (sshService) {
        this.sshServicePool.destroy(sshService);
        sshService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sshService) {
        this.sshServicePool.release(sshService);
      }
    }
  }

  /**
   * Update a SSH key
   */
  static async updateSSHKey(
    selectedUser: string,
    keyId: string,
    sshKey: any,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('updateSSHKey');
    let sshService = null;

    try {
      methodLogger.debug('Updating SSH key:', { selectedUser, keyId, sshKey });
      sshService = await this.sshServicePool.acquire();

      const result = await sshService.updateSSHKey({
        selected_user: selectedUser,
        key_id: keyId,
        ssh_key: sshKey,
      });

      methodLogger.debug('Successfully updated SSH key');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update SSH key:', error);
      if (sshService) {
        this.sshServicePool.destroy(sshService);
        sshService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sshService) {
        this.sshServicePool.release(sshService);
      }
    }
  }

  /**
   * Delete a SSH key
   */
  static async deleteSSHKey(
    selectedUser: string,
    keyId: string,
    output: 'markdown' | 'json' = 'json'
  ) {
    const methodLogger = this.logger.forMethod('deleteSSHKey');
    let sshService = null;

    try {
      methodLogger.debug('Deleting SSH key:', { selectedUser, keyId });
      sshService = await this.sshServicePool.acquire();

      await sshService.deleteSSHKey({
        selected_user: selectedUser,
        key_id: keyId,
      });

      methodLogger.debug('Successfully deleted SSH key');
      return createMcpResponse({ message: 'SSH key deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete SSH key:', error);
      if (sshService) {
        this.sshServicePool.destroy(sshService);
        sshService = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (sshService) {
        this.sshServicePool.release(sshService);
      }
    }
  }

  /**
   * Register all SSH tools with the MCP server
   */
  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Register list SSH keys tool
    server.registerTool(
      'ssh_list_keys',
      {
        description: `Lista chaves SSH de um usuário.

**Funcionalidades:**
- Listagem de chaves SSH com paginação
- Informações detalhadas de cada chave
- Metadados e configurações

**Parâmetros:**
- \`selectedUser\`: Usuário para listar as chaves SSH
- \`page\`: Número da página (opcional)
- \`pagelen\`: Tamanho da página (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a lista de chaves SSH.`,
        inputSchema: ListSSHKeysSchema.shape,
      },
      async (params: z.infer<typeof ListSSHKeysSchema>) => {
        const validatedParams = ListSSHKeysSchema.parse(params);
        return this.listSSHKeys(
          validatedParams.selectedUser,
          validatedParams.page,
          validatedParams.pagelen,
          validatedParams.output
        );
      }
    );

    // Register create SSH key tool
    server.registerTool(
      'ssh_create_key',
      {
        description: `Cria uma nova chave SSH.

**Funcionalidades:**
- Criação de chaves SSH
- Configuração de chave pública
- Metadados e informações da chave

**Parâmetros:**
- \`selectedUser\`: Usuário para criar a chave SSH
- \`sshKey\`: Objeto com configurações da chave SSH
- \`expiresOn\`: Data de expiração (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes da chave SSH criada.`,
        inputSchema: CreateSSHKeySchema.shape,
      },
      async (params: z.infer<typeof CreateSSHKeySchema>) => {
        const validatedParams = CreateSSHKeySchema.parse(params);
        return this.createSSHKey(
          validatedParams.selectedUser,
          validatedParams.sshKey,
          validatedParams.expiresOn,
          validatedParams.output
        );
      }
    );

    // Register get SSH key tool
    server.registerTool(
      'ssh_get_key',
      {
        description: `Obtém detalhes de uma chave SSH específica.

**Funcionalidades:**
- Informações detalhadas da chave SSH
- Metadados e configurações
- Status e permissões

**Parâmetros:**
- \`selectedUser\`: Usuário proprietário da chave SSH
- \`keyId\`: ID da chave SSH
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes da chave SSH.`,
        inputSchema: GetSSHKeySchema.shape,
      },
      async (params: z.infer<typeof GetSSHKeySchema>) => {
        const validatedParams = GetSSHKeySchema.parse(params);
        return this.getSSHKey(
          validatedParams.selectedUser,
          validatedParams.keyId,
          validatedParams.output
        );
      }
    );

    // Register update SSH key tool
    server.registerTool(
      'ssh_update_key',
      {
        description: `Atualiza uma chave SSH existente.

**Funcionalidades:**
- Modificação de chaves SSH existentes
- Atualização de metadados
- Ajuste de configurações

**Parâmetros:**
- \`selectedUser\`: Usuário proprietário da chave SSH
- \`keyId\`: ID da chave SSH
- \`sshKey\`: Objeto com novas configurações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com os detalhes da chave SSH atualizada.`,
        inputSchema: UpdateSSHKeySchema.shape,
      },
      async (params: z.infer<typeof UpdateSSHKeySchema>) => {
        const validatedParams = UpdateSSHKeySchema.parse(params);
        return this.updateSSHKey(
          validatedParams.selectedUser,
          validatedParams.keyId,
          validatedParams.sshKey,
          validatedParams.output
        );
      }
    );

    // Register delete SSH key tool
    server.registerTool(
      'ssh_delete_key',
      {
        description: `Remove uma chave SSH.

**Funcionalidades:**
- Remoção de chaves SSH
- Limpeza de chaves obsoletas
- Controle de acesso

**Parâmetros:**
- \`selectedUser\`: Usuário proprietário da chave SSH
- \`keyId\`: ID da chave SSH
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com \`content\` contendo array de objetos com \`type: 'text'\` e \`text\` com a confirmação da remoção.`,
        inputSchema: DeleteSSHKeySchema.shape,
      },
      async (params: z.infer<typeof DeleteSSHKeySchema>) => {
        const validatedParams = DeleteSSHKeySchema.parse(params);
        return this.deleteSSHKey(
          validatedParams.selectedUser,
          validatedParams.keyId,
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud SSH tools');
  }
}
