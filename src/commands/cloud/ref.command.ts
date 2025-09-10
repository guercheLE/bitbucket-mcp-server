/**
 * Ref Commands for Bitbucket Cloud
 * Handles ref-related operations (branches and tags)
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { RefService } from '../../services/cloud/ref.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudRefCommands {
  private static logger = Logger.forContext('CloudRefCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleListBranches(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      };

      if (options.query) params.q = options.query;
      if (options.sort) params.sort = options.sort;

      const result = await refService.listBranches(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar branches', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateBranch(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      const result = await refService.createBranch({
        workspace: options.workspace,
        repo_slug: options.repo,
        branch: {
          name: options.name,
          target: { hash: options.target },
        },
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetBranch(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      const result = await refService.getBranch({
        workspace: options.workspace,
        repo_slug: options.repo,
        name: options.name,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteBranch(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      await refService.deleteBranch({
        workspace: options.workspace,
        repo_slug: options.repo,
        name: options.name,
      });

      const response = createMcpResponse(
        { message: 'Branch excluída com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir branch', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListTags(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      };

      if (options.query) params.q = options.query;
      if (options.sort) params.sort = options.sort;

      const result = await refService.listTags(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tags', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateTag(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      const tag: any = {
        name: options.name,
        target: { hash: options.target },
      };

      if (options.message) tag.message = options.message;

      const result = await refService.createTag({
        workspace: options.workspace,
        repo_slug: options.repo,
        tag: tag,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar tag', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetTag(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      const result = await refService.getTag({
        workspace: options.workspace,
        repo_slug: options.repo,
        name: options.name,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter tag', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteTag(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      await refService.deleteTag({
        workspace: options.workspace,
        repo_slug: options.repo,
        name: options.name,
      });

      const response = createMcpResponse({ message: 'Tag excluída com sucesso' }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir tag', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListRefs(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const refService = new RefService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      };

      if (options.query) params.q = options.query;
      if (options.sort) params.sort = options.sort;

      const result = await refService.listRefs(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar referências', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de ref');

    const refCommand = program
      .command('ref')
      .description('Comandos de referências (branches e tags) do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server ref <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Branch Commands
    refCommand
      .command('list-branches')
      .description('Lista branches de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-q, --query <query>', 'Consulta de busca')
      .option('-s, --sort <sort>', 'Ordenação (name, -name)')
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
- \`-q, --query\`: Consulta de busca
- \`-s, --sort\`: Ordenação (name, -name)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref list-branches --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server ref list-branches --workspace my-company --repo my-project --query "feature"

**Descrição:**
  Lista todas as branches de um repositório com opções de filtro e paginação.`
      )
      .action(async options => {
        await this.handleListBranches(options);
      });

    refCommand
      .command('create-branch')
      .description('Cria uma nova branch')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da branch')
      .requiredOption('-t, --target <target>', 'Branch ou commit de origem')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome da branch
- \`-t, --target\`: Branch ou commit de origem

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref create-branch --workspace my-company --repo my-project --name "feature/new-feature" --target main
  $ npx -y @guerchele/bitbucket-mcp-server ref create-branch --workspace my-company --repo my-project --name "hotfix/bug-fix" --target abc123

**Descrição:**
  Cria uma nova branch a partir de uma branch ou commit existente.`
      )
      .action(async options => {
        await this.handleCreateBranch(options);
      });

    refCommand
      .command('get-branch')
      .description('Obtém detalhes de uma branch')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da branch')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome da branch

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref get-branch --workspace my-company --repo my-project --name main
  $ npx -y @guerchele/bitbucket-mcp-server ref get-branch --workspace my-company --repo my-project --name "feature/new-feature" --output json

**Descrição:**
  Obtém informações detalhadas sobre uma branch específica, incluindo o último commit e metadados.`
      )
      .action(async options => {
        await this.handleGetBranch(options);
      });

    refCommand
      .command('delete-branch')
      .description('Exclui uma branch')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da branch')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome da branch

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref delete-branch --workspace my-company --repo my-project --name "feature/old-feature"
  $ npx -y @guerchele/bitbucket-mcp-server ref delete-branch --workspace my-company --repo my-project --name "hotfix/completed" --output json

**Descrição:**
  Exclui permanentemente uma branch do repositório. Use com cuidado, pois esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteBranch(options);
      });

    // Tag Commands
    refCommand
      .command('list-tags')
      .description('Lista tags de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-q, --query <query>', 'Consulta de busca')
      .option('-s, --sort <sort>', 'Ordenação (name, -name)')
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
- \`-q, --query\`: Consulta de busca
- \`-s, --sort\`: Ordenação (name, -name)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref list-tags --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server ref list-tags --workspace my-company --repo my-project --query "v1"
  $ npx -y @guerchele/bitbucket-mcp-server ref list-tags --workspace my-company --repo my-project --sort "-name" --limit 20

**Descrição:**
  Lista todas as tags de um repositório com opções de filtro e paginação.`
      )
      .action(async options => {
        await this.handleListTags(options);
      });

    refCommand
      .command('create-tag')
      .description('Cria uma nova tag')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da tag')
      .requiredOption('-t, --target <target>', 'Commit de destino')
      .option('-m, --message <message>', 'Mensagem da tag')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome da tag
- \`-t, --target\`: Commit de destino (hash do commit)

**Opções disponíveis:**
- \`-m, --message\`: Mensagem da tag
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref create-tag --workspace my-company --repo my-project --name "v1.0.0" --target abc123
  $ npx -y @guerchele/bitbucket-mcp-server ref create-tag --workspace my-company --repo my-project --name "v1.0.0" --target abc123 --message "Release version 1.0.0"

**Descrição:**
  Cria uma nova tag anotada no commit especificado. Tags são úteis para marcar releases e versões específicas.`
      )
      .action(async options => {
        await this.handleCreateTag(options);
      });

    refCommand
      .command('get-tag')
      .description('Obtém detalhes de uma tag')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da tag')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome da tag

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref get-tag --workspace my-company --repo my-project --name "v1.0.0"
  $ npx -y @guerchele/bitbucket-mcp-server ref get-tag --workspace my-company --repo my-project --name "release-2024" --output json

**Descrição:**
  Obtém informações detalhadas sobre uma tag específica, incluindo o commit associado e metadados.`
      )
      .action(async options => {
        await this.handleGetTag(options);
      });

    refCommand
      .command('delete-tag')
      .description('Exclui uma tag')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome da tag')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome da tag

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref delete-tag --workspace my-company --repo my-project --name "v1.0.0"
  $ npx -y @guerchele/bitbucket-mcp-server ref delete-tag --workspace my-company --repo my-project --name "release-2024" --output json

**Descrição:**
  Exclui permanentemente uma tag do repositório. Use com cuidado, pois esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteTag(options);
      });

    // General Ref Commands
    refCommand
      .command('list-refs')
      .description('Lista todas as referências (branches e tags)')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-q, --query <query>', 'Consulta de busca')
      .option('-s, --sort <sort>', 'Ordenação (name, -name)')
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
- \`-q, --query\`: Consulta de busca
- \`-s, --sort\`: Ordenação (name, -name)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server ref list-refs --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server ref list-refs --workspace my-company --repo my-project --query "feature"
  $ npx -y @guerchele/bitbucket-mcp-server ref list-refs --workspace my-company --repo my-project --sort "-name" --limit 50

**Descrição:**
  Lista todas as referências (branches e tags) de um repositório com opções de filtro e paginação.`
      )
      .action(async options => {
        await this.handleListRefs(options);
      });

    registerLogger.info('Successfully registered all cloud ref commands');
  }
}
