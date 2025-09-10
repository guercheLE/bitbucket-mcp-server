/**
 * SSH Commands for Bitbucket Cloud
 * Handles SSH key-related operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { SSHService } from '../../services/cloud/ssh.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudSSHCommands {
  private static logger = Logger.forContext('CloudSSHCommands');

  private static async handleListKeys(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sshService = new SSHService(apiClient);

      const result = await sshService.listSSHKeys({
        selected_user: options.user || '~',
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar chaves SSH', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateKey(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sshService = new SSHService(apiClient);

      const result = await sshService.createSSHKey({
        selected_user: options.user || '~',
        ssh_key: {
          key: options.key,
          label: options.label,
        },
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar chave SSH', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetKey(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sshService = new SSHService(apiClient);

      const result = await sshService.getSSHKey({
        selected_user: options.user || '~',
        key_id: options.id,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter chave SSH', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateKey(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sshService = new SSHService(apiClient);

      const sshKey: any = {};

      if (options.key) sshKey.key = options.key;
      if (options.label) sshKey.label = options.label;

      const result = await sshService.updateSSHKey({
        selected_user: options.user || '~',
        key_id: options.id,
        ssh_key: sshKey,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar chave SSH', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteKey(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sshService = new SSHService(apiClient);

      await sshService.deleteSSHKey({
        selected_user: options.user || '~',
        key_id: options.id,
      });

      const response = createMcpResponse(
        { message: 'Chave SSH excluída com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir chave SSH', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos SSH');

    const sshCommand = program
      .command('ssh')
      .description('Comandos de chaves SSH do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server ssh <command> --help' para mais informações sobre um comando específico.
`
      );

    sshCommand
      .command('list-keys')
      .description('Lista chaves SSH do usuário')
      .option('-u, --user <user>', 'Nome do usuário (padrão: usuário atual)')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-u, --user\`: Nome do usuário (padrão: usuário atual)
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ssh list-keys
  $ npx -y @guerchele/bitbucket-mcp-server ssh list-keys --user john.doe
  $ npx -y @guerchele/bitbucket-mcp-server ssh list-keys --page 2 --limit 20

**Descrição:**
  Lista todas as chaves SSH associadas a um usuário.`
      )
      .action(async options => {
        await this.handleListKeys(options);
      });

    sshCommand
      .command('create-key')
      .description('Cria uma nova chave SSH')
      .requiredOption('-k, --key <key>', 'Chave pública SSH')
      .requiredOption('-l, --label <label>', 'Rótulo da chave')
      .option('-u, --user <user>', 'Nome do usuário (padrão: usuário atual)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --key\`: Chave pública SSH
- \`-l, --label\`: Rótulo da chave

**Opções disponíveis:**
- \`-u, --user\`: Nome do usuário (padrão: usuário atual)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ssh create-key --key "ssh-rsa AAAAB3NzaC1yc2E..." --label "My Laptop"
  $ npx -y @guerchele/bitbucket-mcp-server ssh create-key --key "ssh-rsa AAAAB3NzaC1yc2E..." --label "Server Key" --user john.doe

**Descrição:**
  Cria uma nova chave SSH para um usuário.`
      )
      .action(async options => {
        await this.handleCreateKey(options);
      });

    sshCommand
      .command('get-key')
      .description('Obtém detalhes de uma chave SSH')
      .requiredOption('-i, --id <id>', 'ID da chave SSH')
      .option('-u, --user <user>', 'Nome do usuário (padrão: usuário atual)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da chave SSH

**Opções disponíveis:**
- \`-u, --user\`: Nome do usuário (padrão: usuário atual)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ssh get-key --id 12345
  $ npx -y @guerchele/bitbucket-mcp-server ssh get-key --id 12345 --user john.doe

**Descrição:**
  Obtém detalhes de uma chave SSH específica.`
      )
      .action(async options => {
        await this.handleGetKey(options);
      });

    sshCommand
      .command('update-key')
      .description('Atualiza uma chave SSH existente')
      .requiredOption('-i, --id <id>', 'ID da chave SSH')
      .option('-k, --key <key>', 'Nova chave pública SSH')
      .option('-l, --label <label>', 'Novo rótulo da chave')
      .option('-u, --user <user>', 'Nome do usuário (padrão: usuário atual)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da chave SSH

**Opções disponíveis:**
- \`-k, --key\`: Nova chave pública SSH
- \`-l, --label\`: Novo rótulo da chave
- \`-u, --user\`: Nome do usuário (padrão: usuário atual)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ssh update-key --id 12345 --label "Updated Label"
  $ npx -y @guerchele/bitbucket-mcp-server ssh update-key --id 12345 --key "ssh-rsa AAAAB3NzaC1yc2E..." --label "New Label"

**Descrição:**
  Atualiza uma chave SSH existente com novos valores.`
      )
      .action(async options => {
        await this.handleUpdateKey(options);
      });

    sshCommand
      .command('delete-key')
      .description('Exclui uma chave SSH')
      .requiredOption('-i, --id <id>', 'ID da chave SSH')
      .option('-u, --user <user>', 'Nome do usuário (padrão: usuário atual)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da chave SSH

**Opções disponíveis:**
- \`-u, --user\`: Nome do usuário (padrão: usuário atual)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ssh delete-key --id 12345
  $ npx -y @guerchele/bitbucket-mcp-server ssh delete-key --id 12345 --user john.doe

**Descrição:**
  Exclui permanentemente uma chave SSH. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteKey(options);
      });

    registerLogger.info('Successfully registered all cloud SSH commands');
  }
}
