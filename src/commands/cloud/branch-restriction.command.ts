/**
 * Branch Restriction Commands for Bitbucket Cloud
 * Handles branch restriction-related operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { BranchRestrictionService } from '../../services/cloud/branch-restriction.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudBranchRestrictionCommands {
  private static logger = Logger.forContext('CloudBranchRestrictionCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleListBranchRestrictions(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const branchRestrictionService = new BranchRestrictionService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      };

      if (options.kind) params.kind = options.kind;
      if (options.pattern) params.pattern = options.pattern;

      const result = await branchRestrictionService.listBranchRestrictions(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar restrições de branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateBranchRestriction(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const branchRestrictionService = new BranchRestrictionService(apiClient);

      const restriction: any = {
        kind: options.kind,
        pattern: options.pattern,
      };

      if (options.users) {
        restriction.users = options.users.split(',').map((u: string) => ({ username: u.trim() }));
      }

      if (options.groups) {
        restriction.groups = options.groups.split(',').map((g: string) => ({ name: g.trim() }));
      }

      const result = await branchRestrictionService.createBranchRestriction({
        workspace: options.workspace,
        repo_slug: options.repo,
        branch_restriction: restriction,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar restrição de branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetBranchRestriction(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const branchRestrictionService = new BranchRestrictionService(apiClient);

      const result = await branchRestrictionService.getBranchRestriction({
        workspace: options.workspace,
        repo_slug: options.repo,
        id: options.id,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter restrição de branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateBranchRestriction(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const branchRestrictionService = new BranchRestrictionService(apiClient);

      const restriction: any = {};

      if (options.kind) restriction.kind = options.kind;
      if (options.pattern) restriction.pattern = options.pattern;
      if (options.users) {
        restriction.users = options.users.split(',').map((u: string) => ({ username: u.trim() }));
      }
      if (options.groups) {
        restriction.groups = options.groups.split(',').map((g: string) => ({ name: g.trim() }));
      }

      const result = await branchRestrictionService.updateBranchRestriction({
        workspace: options.workspace,
        repo_slug: options.repo,
        id: options.id,
        branch_restriction: restriction,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar restrição de branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteBranchRestriction(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const branchRestrictionService = new BranchRestrictionService(apiClient);

      await branchRestrictionService.deleteBranchRestriction({
        workspace: options.workspace,
        repo_slug: options.repo,
        id: options.id,
      });

      const response = createMcpResponse(
        { message: 'Restrição de branch excluída com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir restrição de branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de restrição de branch');

    const branchRestrictionCommand = program
      .command('branch-restriction')
      .description('Comandos de restrições de branch do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server branch-restriction <command> --help' para mais informações sobre um comando específico.
  `
      );

    branchRestrictionCommand
      .command('list')
      .description('Lista restrições de branch de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-k, --kind <kind>', 'Tipo de restrição (push, delete, force)')
      .option('-t, --pattern <pattern>', 'Padrão do branch')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-k, --kind\`: Tipo de restrição (push, delete, force)
- \`-t, --pattern\`: Padrão do branch
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction list --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction list --workspace my-company --repo my-project --kind push
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction list --workspace my-company --repo my-project --pattern "main"

**Descrição:**
  Lista todas as restrições de branch configuradas para um repositório.`
      )
      .action(async options => {
        await this.handleListBranchRestrictions(options);
      });

    branchRestrictionCommand
      .command('create')
      .description('Cria uma nova restrição de branch')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-k, --kind <kind>', 'Tipo de restrição (push, delete, force)')
      .requiredOption('-p, --pattern <pattern>', 'Padrão do branch')
      .option('-u, --users <users>', 'Usuários permitidos (separados por vírgula)')
      .option('-g, --groups <groups>', 'Grupos permitidos (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-k, --kind\`: Tipo de restrição (push, delete, force)
- \`-p, --pattern\`: Padrão do branch

**Opções disponíveis:**
- \`-u, --users\`: Usuários permitidos (separados por vírgula)
- \`-g, --groups\`: Grupos permitidos (separados por vírgula)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction create --workspace my-company --repo my-project --kind push --pattern "main"
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction create --workspace my-company --repo my-project --kind delete --pattern "develop" --users "user1,user2"
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction create --workspace my-company --repo my-project --kind force --pattern "feature/*" --groups "developers"

**Descrição:**
  Cria uma nova restrição de branch para um repositório. As restrições controlam quem pode fazer push, delete ou force push em branches específicos.`
      )
      .action(async options => {
        await this.handleCreateBranchRestriction(options);
      });

    branchRestrictionCommand
      .command('get')
      .description('Obtém detalhes de uma restrição de branch')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da restrição')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-i, --id\`: ID da restrição de branch

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction get --workspace my-company --repo my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction get --workspace my-company --repo my-project --id 123 --output json

**Descrição:**
  Obtém os detalhes completos de uma restrição de branch específica, incluindo tipo, padrão, usuários e grupos permitidos.`
      )
      .action(async options => {
        await this.handleGetBranchRestriction(options);
      });

    branchRestrictionCommand
      .command('update')
      .description('Atualiza uma restrição de branch existente')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da restrição')
      .option('-k, --kind <kind>', 'Tipo de restrição (push, delete, force)')
      .option('-p, --pattern <pattern>', 'Padrão do branch')
      .option('-u, --users <users>', 'Usuários permitidos (separados por vírgula)')
      .option('-g, --groups <groups>', 'Grupos permitidos (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-i, --id\`: ID da restrição de branch

**Opções disponíveis:**
- \`-k, --kind\`: Tipo de restrição (push, delete, force)
- \`-p, --pattern\`: Padrão do branch
- \`-u, --users\`: Usuários permitidos (separados por vírgula)
- \`-g, --groups\`: Grupos permitidos (separados por vírgula)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction update --workspace my-company --repo my-project --id 123 --kind push
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction update --workspace my-company --repo my-project --id 123 --pattern "main" --users "user1,user2"
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction update --workspace my-company --repo my-project --id 123 --groups "developers,admins"

**Descrição:**
  Atualiza uma restrição de branch existente. Apenas os campos fornecidos serão atualizados, mantendo os valores existentes para os campos não especificados.`
      )
      .action(async options => {
        await this.handleUpdateBranchRestriction(options);
      });

    branchRestrictionCommand
      .command('delete')
      .description('Exclui uma restrição de branch')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --id <id>', 'ID da restrição')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-i, --id\`: ID da restrição de branch

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction delete --workspace my-company --repo my-project --id 123
  $ npx -y @guerchele/bitbucket-mcp-server branch-restriction delete --workspace my-company --repo my-project --id 123 --output json

**Descrição:**
  Remove permanentemente uma restrição de branch do repositório. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteBranchRestriction(options);
      });

    registerLogger.info('Successfully registered all cloud branch restriction commands');
  }
}
