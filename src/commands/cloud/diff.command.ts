import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { DiffService } from '../../services/cloud/diff.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Diff Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for diff operations including:
 * - Compare two commits
 * - Get diff statistics
 * - Get patches for commits
 * - Find common ancestors between commits
 */
export class DiffCommands {
  private static logger = Logger.forContext('DiffCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetDiff(spec: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting diff for spec: ${spec}`);
      const diffService = new DiffService(new ApiClient());
      const result = await diffService.getDiff({
        workspace: options.workspaceSlug,
        repo_slug: options.repoSlug,
        spec,
        context: parseInt(options.context),
        path: options.path,
        ignore_whitespace: options.ignoreWhitespace,
        binary: options.binary,
        renames: options.renames,
        merge: options.merge,
        topic: options.topic,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get diff:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetDiffStat(spec: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting diff stat for spec: ${spec}`);
      const diffService = new DiffService(new ApiClient());
      const result = await diffService.getDiffStat({
        workspace: options.workspaceSlug,
        repo_slug: options.repoSlug,
        spec,
        ignore_whitespace: options.ignoreWhitespace,
        merge: options.merge,
        path: options.path,
        renames: options.renames,
        topic: options.topic,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get diff stat:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetPatch(spec: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting patch for spec: ${spec}`);
      const diffService = new DiffService(new ApiClient());
      const result = await diffService.getPatch({
        workspace: options.workspaceSlug,
        repo_slug: options.repoSlug,
        spec,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get patch:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleGetMergeBase(revspec: string, options: any): Promise<void> {
    try {
      this.logger.info(`Getting merge base for revspec: ${revspec}`);
      const diffService = new DiffService(new ApiClient());
      const result = await diffService.getMergeBase({
        workspace: options.workspaceSlug,
        repo_slug: options.repoSlug,
        revspec,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get merge base:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all diff commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de diff');

    const diffCommand = program.command('diff').description('Comandos de diff do Bitbucket Cloud');

    // Add help text for main diff command
    diffCommand.addHelpText(
      'after',
      `
Use 'bitbucket-mcp-server diff <command> --help' para mais informações sobre um comando específico.
`
    );

    // Get diff command
    diffCommand
      .command('get')
      .description('Compara dois commits e retorna um diff bruto')
      .argument('<spec>', 'Especificação dos commits (ex: "main..feature", "abc123..def456")')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--project-key <key>', 'Chave do projeto (opcional)')
      .option('-c, --context <lines>', 'Número de linhas de contexto', '3')
      .option('-p, --path <path>', 'Caminho do arquivo para filtrar')
      .option('--ignore-whitespace', 'Ignorar mudanças de espaços em branco')
      .option('--binary', 'Incluir arquivos binários')
      .option('--renames', 'Detectar renomeações')
      .option('--merge', 'Incluir commits de merge')
      .option('--topic', 'Incluir tópicos')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`spec\`: Especificação dos commits (ex: "main..feature", "abc123..def456")

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--project-key\`: Chave do projeto (opcional)
- \`-c, --context\`: Número de linhas de contexto (padrão: 3)
- \`-p, --path\`: Caminho do arquivo para filtrar
- \`--ignore-whitespace\`: Ignorar mudanças de espaços em branco
- \`--binary\`: Incluir arquivos binários
- \`--renames\`: Detectar renomeações
- \`--merge\`: Incluir commits de merge
- \`--topic\`: Incluir tópicos
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server diff get "main..feature" --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get "abc123..def456" --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get "main..feature" --workspace my-company --repo-slug my-project --context 5
  $ npx -y @guerchele/bitbucket-mcp-server diff get "main..feature" --workspace my-company --repo-slug my-project --path "src/"
  $ npx -y @guerchele/bitbucket-mcp-server diff get "main..feature" --workspace my-company --repo-slug my-project --ignore-whitespace
  $ npx -y @guerchele/bitbucket-mcp-server diff get "main..feature" --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Compara dois commits e retorna um diff bruto no formato git.
  Use as opções para filtrar por arquivo, ajustar contexto e controlar o formato da saída.`
      )
      .action(async (spec, options) => {
        await this.handleGetDiff(spec, options);
      });

    // Get diff stat command
    diffCommand
      .command('get-stat')
      .description('Obtém estatísticas de diff entre dois commits')
      .argument('<spec>', 'Especificação dos commits (ex: "main..feature")')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--project-key <key>', 'Chave do projeto (opcional)')
      .option('--ignore-whitespace', 'Ignorar mudanças de espaços em branco')
      .option('--merge', 'Incluir commits de merge')
      .option('-p, --path <path>', 'Caminho do arquivo para filtrar')
      .option('--renames', 'Detectar renomeações')
      .option('--topic', 'Incluir tópicos')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`spec\`: Especificação dos commits (ex: "main..feature", "abc123..def456")

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--project-key\`: Chave do projeto (opcional)
- \`--ignore-whitespace\`: Ignorar mudanças de espaços em branco
- \`--merge\`: Incluir commits de merge
- \`-p, --path\`: Caminho do arquivo para filtrar
- \`--renames\`: Detectar renomeações
- \`--topic\`: Incluir tópicos
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server diff get-stat "main..feature" --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get-stat "abc123..def456" --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get-stat "main..feature" --workspace my-company --repo-slug my-project --ignore-whitespace
  $ npx -y @guerchele/bitbucket-mcp-server diff get-stat "main..feature" --workspace my-company --repo-slug my-project --path "src/"
  $ npx -y @guerchele/bitbucket-mcp-server diff get-stat "main..feature" --workspace my-company --repo-slug my-project --renames
  $ npx -y @guerchele/bitbucket-mcp-server diff get-stat "main..feature" --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém estatísticas de diff entre dois commits, incluindo contagem de linhas
  adicionadas/removidas e informações sobre arquivos modificados.`
      )
      .action(async (spec, options) => {
        await this.handleGetDiffStat(spec, options);
      });

    // Get patch command
    diffCommand
      .command('get-patch')
      .description('Obtém um patch para commits específicos')
      .argument('<spec>', 'Especificação dos commits (ex: "abc123", "main..feature")')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--project-key <key>', 'Chave do projeto (opcional)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`spec\`: Especificação dos commits (ex: "abc123", "main..feature")

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--project-key\`: Chave do projeto (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server diff get-patch "abc123" --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get-patch "main..feature" --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get-patch "def456" --workspace my-company --repo-slug my-project --project-key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server diff get-patch "abc123" --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Obtém um patch bruto para commits específicos ou uma série de patches
  para uma especificação de revisão.`
      )
      .action(async (spec, options) => {
        await this.handleGetPatch(spec, options);
      });

    // Get merge base command
    diffCommand
      .command('get-merge-base')
      .description('Encontra o ancestral comum entre dois commits')
      .argument('<revspec>', 'Especificação de revisão (ex: "main...feature")')
      .option('-w, --workspace <workspace>', 'Workspace (opcional)')
      .requiredOption('-r, --repo-slug <slug>', 'Slug do repositório')
      .option('--project-key <key>', 'Chave do projeto (opcional)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Parâmetros:**
- \`revspec\`: Especificação de revisão (ex: "main...feature", "abc123...def456")

**Opções obrigatórias:**
- \`-r, --repo-slug\`: Slug do repositório

**Opções disponíveis:**
- \`-w, --workspace\`: Workspace (opcional)
- \`--project-key\`: Chave do projeto (opcional)
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server diff get-merge-base "main...feature" --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get-merge-base "abc123...def456" --workspace my-company --repo-slug my-project
  $ npx -y @guerchele/bitbucket-mcp-server diff get-merge-base "develop...hotfix" --workspace my-company --repo-slug my-project --project-key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server diff get-merge-base "main...feature" --workspace my-company --repo-slug my-project --output json

**Descrição:**
  Encontra o melhor ancestral comum entre dois commits, útil para
  operações de merge e análise de divergência entre branches.`
      )
      .action(async (revspec, options) => {
        await this.handleGetMergeBase(revspec, options);
      });

    registerLogger.info('Successfully registered all cloud diff commands');
  }
}
