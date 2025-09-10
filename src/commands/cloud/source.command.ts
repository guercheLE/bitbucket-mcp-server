/**
 * Source Commands for Bitbucket Cloud
 * Handles source-related operations (file browsing and commits)
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { SourceService } from '../../services/cloud/source.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudSourceCommands {
  private static logger = Logger.forContext('CloudSourceCommands');

  /**
   * Handle list file history command
   */
  private static async handleListFileHistory(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sourceService = new SourceService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        commit: options.commit,
        path: options.path,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
        renames: options.renames === 'true',
      };

      if (options.query) params.q = options.query;
      if (options.sort) params.sort = options.sort;

      const result = await sourceService.listFileHistory(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar histórico do arquivo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  /**
   * Handle get root directory command
   */
  private static async handleGetRootDirectory(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sourceService = new SourceService(apiClient);

      const result = await sourceService.getRootDirectory({
        workspace: options.workspace,
        repo_slug: options.repo,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter diretório raiz', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  /**
   * Handle get file or directory command
   */
  private static async handleGetFileOrDirectory(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sourceService = new SourceService(apiClient);

      const result = await sourceService.getFileOrDirectory({
        workspace: options.workspace,
        repo_slug: options.repo,
        commit: options.commit,
        path: options.path,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter arquivo ou diretório', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  /**
   * Handle create commit command
   */
  private static async handleCreateCommit(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const sourceService = new SourceService(apiClient);

      const commit: any = {
        message: options.message,
        branch: options.branch,
      };

      if (options.author) commit.author = options.author;
      if (options.date) commit.date = options.date;
      if (options.parents) {
        commit.parents = options.parents.split(',').map((p: string) => ({ hash: p.trim() }));
      }

      const result = await sourceService.createCommit({
        workspace: options.workspace,
        repo_slug: options.repo,
        commit: commit,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar commit', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de source');

    const sourceCommand = program
      .command('source')
      .description('Comandos de código-fonte do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server source <command> --help' para mais informações sobre um comando específico.
`
      );

    sourceCommand
      .command('list-file-history')
      .description('Lista histórico de commits que modificaram um arquivo')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-c, --commit <commit>', 'Hash do commit')
      .requiredOption('-p, --path <path>', 'Caminho do arquivo')
      .option('--page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-q, --query <query>', 'Consulta de busca')
      .option('-s, --sort <sort>', 'Ordenação (date, -date)')
      .option('--renames <renames>', 'Incluir renomeações (true|false)', 'false')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-c, --commit\`: Hash do commit
- \`-p, --path\`: Caminho do arquivo

**Opções disponíveis:**
- \`--page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-q, --query\`: Consulta de busca
- \`-s, --sort\`: Ordenação (date, -date)
- \`--renames\`: Incluir renomeações (true|false) - padrão: false
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server source list-file-history --workspace my-company --repo my-project --commit abc123 --path "src/main.js"
  $ npx -y @guerchele/bitbucket-mcp-server source list-file-history --workspace my-company --repo my-project --commit abc123 --path "src/main.js" --renames true

**Descrição:**
  Lista o histórico de commits que modificaram um arquivo específico.`
      )
      .action(async options => {
        await this.handleListFileHistory(options);
      });

    sourceCommand
      .command('get-root-directory')
      .description('Obtém diretório raiz de um commit')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-c, --commit <commit>', 'Hash do commit')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-c, --commit\`: Hash do commit

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server source get-root-directory --workspace my-company --repo my-project --commit abc123
  $ npx -y @guerchele/bitbucket-mcp-server source get-root-directory --workspace my-company --repo my-project --commit abc123 --output json

**Descrição:**
  Obtém o diretório raiz de um commit específico.`
      )
      .action(async options => {
        await this.handleGetRootDirectory(options);
      });

    sourceCommand
      .command('get-file-or-directory')
      .description('Obtém arquivo ou diretório de um commit')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-c, --commit <commit>', 'Hash do commit')
      .requiredOption('-p, --path <path>', 'Caminho do arquivo ou diretório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-c, --commit\`: Hash do commit
- \`-p, --path\`: Caminho do arquivo ou diretório

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server source get-file-or-directory --workspace my-company --repo my-project --commit abc123 --path "src/main.js"
  $ npx -y @guerchele/bitbucket-mcp-server source get-file-or-directory --workspace my-company --repo my-project --commit abc123 --path "src/"

**Descrição:**
  Obtém o conteúdo de um arquivo ou diretório específico de um commit.`
      )
      .action(async options => {
        await this.handleGetFileOrDirectory(options);
      });

    sourceCommand
      .command('create-commit')
      .description('Cria um novo commit')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-m, --message <message>', 'Mensagem do commit')
      .requiredOption('-b, --branch <branch>', 'Branch de destino')
      .option('-a, --author <author>', 'Autor do commit')
      .option('-d, --date <date>', 'Data do commit (ISO 8601)')
      .option('-p, --parents <parents>', 'Commits pais (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-m, --message\`: Mensagem do commit
- \`-b, --branch\`: Branch de destino

**Opções disponíveis:**
- \`-a, --author\`: Autor do commit
- \`-d, --date\`: Data do commit (ISO 8601)
- \`-p, --parents\`: Commits pais (separados por vírgula)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server source create-commit --workspace my-company --repo my-project --message "Initial commit" --branch main
  $ npx -y @guerchele/bitbucket-mcp-server source create-commit --workspace my-company --repo my-project --message "Fix bug" --branch develop --author "John Doe"

**Descrição:**
  Cria um novo commit no repositório especificado.`
      )
      .action(async options => {
        await this.handleCreateCommit(options);
      });

    registerLogger.info('Successfully registered all cloud source commands');
  }
}
