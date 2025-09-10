/**
 * Data Center Pull Request Commands
 * CLI commands for Bitbucket Data Center Pull Request Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { PullRequestService } from '../../services/datacenter/pull-request.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterPullRequestCommands {
  private static logger = Logger.forContext('DataCenterPullRequestCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de pull request do Data Center');

    const prCommand = program
      .command('pull-request')
      .description('Comandos de pull request do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server pull-request <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Pull Request Management
    prCommand
      .command('create')
      .description('Cria um novo pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-t, --title <title>', 'Título do pull request')
      .requiredOption('-s, --source <source>', 'Branch de origem')
      .requiredOption('-d, --destination <destination>', 'Branch de destino')
      .option('-b, --description <description>', 'Descrição do pull request')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-t, --title\`: Título do pull request
- \`-s, --source\`: Branch de origem
- \`-d, --destination\`: Branch de destino

**Opções disponíveis:**
- \`-b, --description\`: Descrição do pull request
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create --project MOBILE --repo my-app --title "Feature: Add login" --source feature/login --destination main
  $ npx -y @guerchele/bitbucket-mcp-server pull-request create --project MOBILE --repo my-app --title "Bug fix" --source hotfix/bug123 --destination develop --description "Fix critical bug"

**Descrição:**
  Cria um novo pull request com as configurações especificadas.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const result = await prService.createPullRequest(options.project, options.repo, {
            title: options.title,
            description: options.description,
            fromRef: {
              id: `refs/heads/${options.source}`,
              repository: {
                slug: options.repo,
                project: {
                  key: options.project,
                },
              },
            },
            toRef: {
              id: `refs/heads/${options.destination}`,
              repository: {
                slug: options.repo,
                project: {
                  key: options.project,
                },
              },
            },
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('get')
      .description('Obtém pull request por ID')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get --project MOBILE --repo my-app --pr-id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get --project MOBILE --repo my-app --pr-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de um pull request específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const result = await prService.getPullRequest(
            options.project,
            options.repo,
            parseInt(options.prId)
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('update')
      .description('Atualiza pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .option('-t, --title <title>', 'Título do pull request')
      .option('-b, --description <description>', 'Descrição do pull request')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request

**Opções disponíveis:**
- \`-t, --title\`: Título do pull request
- \`-b, --description\`: Descrição do pull request
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update --project MOBILE --repo my-app --pr-id 123 --title "Updated title"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update --project MOBILE --repo my-app --pr-id 123 --description "Updated description"

**Descrição:**
  Atualiza um pull request existente com novos dados.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const updateData: any = {};
          if (options.title) updateData.title = options.title;
          if (options.description) updateData.description = options.description;

          const result = await prService.updatePullRequest(
            options.project,
            options.repo,
            parseInt(options.prId),
            updateData
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('list')
      .description('Lista pull requests')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-s, --state <state>', 'Estado do pull request (OPEN, MERGED, DECLINED)')
      .option('-a, --author <author>', 'Autor do pull request')
      .option('--page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-s, --state\`: Estado do pull request (OPEN, MERGED, DECLINED)
- \`-a, --author\`: Autor do pull request
- \`--page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list --project MOBILE --repo my-app
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list --project MOBILE --repo my-app --state OPEN
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list --project MOBILE --repo my-app --author john.doe --limit 20

**Descrição:**
  Lista pull requests com opções de filtro e paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const params: any = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
          };

          if (options.state) params.state = options.state;
          if (options.author) params.author = options.author;

          const result = await prService.listPullRequests(options.project, options.repo, params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar pull requests', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('merge')
      .description('Merge pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .option('-m, --message <message>', 'Mensagem de merge')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request

**Opções disponíveis:**
- \`-m, --message\`: Mensagem de merge
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request merge --project MOBILE --repo my-app --pr-id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request merge --project MOBILE --repo my-app --pr-id 123 --message "Merged feature"

**Descrição:**
  Faz merge de um pull request no branch de destino.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          // First get the pull request to obtain the version
          const pr = await prService.getPullRequest(
            options.project,
            options.repo,
            parseInt(options.prId)
          );

          const result = await prService.mergePullRequest(
            options.project,
            options.repo,
            parseInt(options.prId),
            {
              version: pr.version,
              message: options.message,
            }
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao fazer merge do pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('decline')
      .description('Declina pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .option('-m, --message <message>', 'Mensagem de declínio')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request

**Opções disponíveis:**
- \`-m, --message\`: Mensagem de declínio
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request decline --project MOBILE --repo my-app --pr-id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request decline --project MOBILE --repo my-app --pr-id 123 --message "Declined due to conflicts"

**Descrição:**
  Declina um pull request, rejeitando as mudanças propostas.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          // First get the pull request to obtain the version
          const pr = await prService.getPullRequest(
            options.project,
            options.repo,
            parseInt(options.prId)
          );

          const result = await prService.declinePullRequest(
            options.project,
            options.repo,
            parseInt(options.prId),
            {
              version: pr.version,
              message: options.message,
            }
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao declinar pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('reopen')
      .description('Reabre pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .option('-m, --message <message>', 'Mensagem de reabertura')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request

**Opções disponíveis:**
- \`-m, --message\`: Mensagem de reabertura
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request reopen --project MOBILE --repo my-app --pr-id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request reopen --project MOBILE --repo my-app --pr-id 123 --message "Reopened after fixes"

**Descrição:**
  Reabre um pull request que foi fechado anteriormente.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          // First get the pull request to obtain the version
          const pr = await prService.getPullRequest(
            options.project,
            options.repo,
            parseInt(options.prId)
          );

          const result = await prService.reopenPullRequest(
            options.project,
            options.repo,
            parseInt(options.prId),
            {
              version: pr.version,
              message: options.message,
            }
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao reabrir pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Pull Request Comments
    prCommand
      .command('add-comment')
      .description('Adiciona comentário ao pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .requiredOption('-m, --message <message>', 'Mensagem do comentário')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request
- \`-m, --message\`: Mensagem do comentário

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request add-comment --project MOBILE --repo my-app --pr-id 123 --message "Great work!"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request add-comment --project MOBILE --repo my-app --pr-id 123 --message "Please review this change"

**Descrição:**
  Adiciona um novo comentário a um pull request.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const result = await prService.createPullRequestComment(
            options.project,
            options.repo,
            parseInt(options.prId),
            {
              text: options.message,
            }
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao adicionar comentário', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('list-comments')
      .description('Lista comentários do pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .option('--page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request

**Opções disponíveis:**
- \`--page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-comments --project MOBILE --repo my-app --pr-id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request list-comments --project MOBILE --repo my-app --pr-id 123 --limit 20

**Descrição:**
  Lista todos os comentários de um pull request específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const result = await prService.getPullRequestComments(
            options.project,
            options.repo,
            parseInt(options.prId),
            {
              start: (parseInt(options.page) - 1) * parseInt(options.limit),
              limit: parseInt(options.limit),
            }
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar comentários', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('update-comment')
      .description('Atualiza comentário do pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .requiredOption('-c, --comment-id <commentId>', 'ID do comentário')
      .requiredOption('-m, --message <message>', 'Nova mensagem do comentário')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request
- \`-c, --comment-id\`: ID do comentário
- \`-m, --message\`: Nova mensagem do comentário

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update-comment --project MOBILE --repo my-app --pr-id 123 --comment-id 456 --message "Updated comment"
  $ npx -y @guerchele/bitbucket-mcp-server pull-request update-comment --project MOBILE --repo my-app --pr-id 123 --comment-id 456 --message "Corrected information"

**Descrição:**
  Atualiza o conteúdo de um comentário existente em um pull request.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const result = await prService.updatePullRequestComment(
            options.project,
            options.repo,
            parseInt(options.prId),
            parseInt(options.commentId),
            {
              version: 0, // This should be retrieved from the comment first
              text: options.message,
            }
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar comentário', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    prCommand
      .command('delete-comment')
      .description('Exclui comentário do pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .requiredOption('-c, --comment-id <commentId>', 'ID do comentário')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request
- \`-c, --comment-id\`: ID do comentário

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request delete-comment --project MOBILE --repo my-app --pr-id 123 --comment-id 456
  $ npx -y @guerchele/bitbucket-mcp-server pull-request delete-comment --project MOBILE --repo my-app --pr-id 123 --comment-id 456 --output json

**Descrição:**
  Exclui um comentário específico de um pull request.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          await prService.deletePullRequestComment(
            options.project,
            options.repo,
            parseInt(options.prId),
            parseInt(options.commentId)
          );
          const response = createMcpResponse(
            { message: 'Comentário excluído com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir comentário', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Pull Request Activity
    prCommand
      .command('get-activity')
      .description('Obtém atividade do pull request')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-i, --pr-id <prId>', 'ID do pull request')
      .option('--page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-p, --project\`: Chave do projeto
- \`-r, --repo\`: Slug do repositório
- \`-i, --pr-id\`: ID do pull request

**Opções disponíveis:**
- \`--page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-activity --project MOBILE --repo my-app --pr-id 123
  $ npx -y @guerchele/bitbucket-mcp-server pull-request get-activity --project MOBILE --repo my-app --pr-id 123 --limit 20

**Descrição:**
  Obtém o histórico de atividades de um pull request, incluindo comentários, aprovações e mudanças de status.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const prService = new PullRequestService(
            apiClient,
            Logger.forContext('PullRequestService')
          );

          const result = await prService.getPullRequestActivity(
            options.project,
            options.repo,
            parseInt(options.prId),
            {
              start: (parseInt(options.page) - 1) * parseInt(options.limit),
              limit: parseInt(options.limit),
            }
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter atividade do pull request', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center pull request commands');
  }
}
