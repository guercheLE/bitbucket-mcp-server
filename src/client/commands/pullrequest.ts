import { Command } from 'commander';
import { pullRequestService } from '../../services/pullrequest-service';
import { pullRequestCommentsService } from '../../services/pullrequest-comments-service';
import { pullRequestAnalysisService } from '../../services/pullrequest-analysis-service';
import { detectServer } from '../../services/server-detection';

/**
 * Pull Request CLI Commands
 * T026: Pull request CLI commands in src/client/commands/pullrequest.ts
 * 
 * CLI commands for pull request operations
 * Based on contracts and service implementations
 */

export function createPullRequestCommands(program: Command): void {
  const pullRequestCmd = program
    .command('pullrequest')
    .alias('pr')
    .description('Comandos para gerenciar pull requests do Bitbucket');

  // Global options for all pull request commands
  const globalOptions = [
    ['-s, --server <url>', 'URL do servidor Bitbucket'],
    ['-t, --token <token>', 'Token de acesso'],
    ['-p, --project <key>', 'Chave do projeto'],
    ['-r, --repo <slug>', 'Slug do repositório']
  ];

  // Create pull request command
  pullRequestCmd
    .command('create')
    .description('Cria um novo pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .requiredOption('--title <title>', 'Título do pull request')
    .requiredOption('--from <branch>', 'Branch de origem')
    .requiredOption('--to <branch>', 'Branch de destino')
    .option('--description <description>', 'Descrição do pull request')
    .option('--reviewers <reviewers>', 'Lista de revisores (separados por vírgula)')
    .option('--close-source-branch', 'Fechar branch origem após merge')
    .action(async (options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('📝 Criando pull request...');
        const pullRequest = await pullRequestService.createPullRequest({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          title: options.title,
          description: options.description,
          fromRef: options.from,
          toRef: options.to,
          reviewers: options.reviewers ? options.reviewers.split(',').map((r: string) => r.trim()) : undefined,
          closeSourceBranch: options.closeSourceBranch
        });

        console.log('✅ Pull request criado com sucesso!');
        console.log(`   ID: ${pullRequest.id}`);
        console.log(`   Título: ${pullRequest.title}`);
        console.log(`   Estado: ${pullRequest.state}`);
        console.log(`   URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}`);
      } catch (error) {
        console.error('❌ Erro ao criar pull request:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Get pull request command
  pullRequestCmd
    .command('get <id>')
    .description('Obtém detalhes de um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .action(async (id, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('📖 Obtendo pull request...');
        const pullRequest = await pullRequestService.getPullRequest({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(id)
        });

        console.log('✅ Pull request obtido com sucesso!');
        console.log(`   ID: ${pullRequest.id}`);
        console.log(`   Título: ${pullRequest.title}`);
        console.log(`   Estado: ${pullRequest.state}`);
        console.log(`   Autor: ${pullRequest.author.name}`);
        console.log(`   Branch: ${pullRequest.fromRef.displayId} → ${pullRequest.toRef.displayId}`);
        console.log(`   Criado: ${new Date(pullRequest.createdDate).toLocaleString('pt-BR')}`);
        console.log(`   URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}`);
        
        if (pullRequest.description) {
          console.log(`   Descrição: ${pullRequest.description}`);
        }
      } catch (error) {
        console.error('❌ Erro ao obter pull request:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // List pull requests command
  pullRequestCmd
    .command('list')
    .description('Lista pull requests do repositório')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .option('--state <state>', 'Filtrar por estado (OPEN, MERGED, DECLINED, SUPERSEDED, DRAFT)')
    .option('--limit <limit>', 'Número máximo de resultados', '25')
    .option('--start <start>', 'Índice de início', '0')
    .action(async (options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('📋 Listando pull requests...');
        const pullRequestList = await pullRequestService.listPullRequests({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          state: options.state as any,
          start: parseInt(options.start),
          limit: parseInt(options.limit)
        });

        if (pullRequestList.values.length === 0) {
          console.log('📭 Nenhum pull request encontrado.');
          return;
        }

        console.log(`✅ ${pullRequestList.values.length} pull request(s) encontrado(s):`);
        console.log('');
        
        pullRequestList.values.forEach(pr => {
          console.log(`#${pr.id} - ${pr.title}`);
          console.log(`   Estado: ${pr.state}`);
          console.log(`   Autor: ${pr.author.name}`);
          console.log(`   Branch: ${pr.fromRef.displayId} → ${pr.toRef.displayId}`);
          console.log(`   Criado: ${new Date(pr.createdDate).toLocaleString('pt-BR')}`);
          console.log(`   URL: ${pr.links.html?.[0]?.href || 'N/A'}`);
          console.log('');
        });

        if (!pullRequestList.isLastPage) {
          console.log(`📄 Mais páginas disponíveis. Use --start ${pullRequestList.nextPageStart} para ver mais.`);
        }
      } catch (error) {
        console.error('❌ Erro ao listar pull requests:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Merge pull request command
  pullRequestCmd
    .command('merge <id>')
    .description('Faz merge de um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .requiredOption('--version <version>', 'Versão do pull request')
    .option('--message <message>', 'Mensagem personalizada do commit de merge')
    .option('--close-source-branch', 'Fechar branch origem após merge')
    .action(async (id, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('🔀 Fazendo merge do pull request...');
        const pullRequest = await pullRequestService.mergePullRequest({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(id),
          version: parseInt(options.version),
          mergeCommitMessage: options.message,
          closeSourceBranch: options.closeSourceBranch
        });

        console.log('✅ Pull request mergeado com sucesso!');
        console.log(`   ID: ${pullRequest.id}`);
        console.log(`   Estado: ${pullRequest.state}`);
        console.log(`   URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}`);
      } catch (error) {
        console.error('❌ Erro ao fazer merge do pull request:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Decline pull request command
  pullRequestCmd
    .command('decline <id>')
    .description('Recusa um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .requiredOption('--version <version>', 'Versão do pull request')
    .option('--reason <reason>', 'Motivo da recusa')
    .action(async (id, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('❌ Recusando pull request...');
        const pullRequest = await pullRequestService.declinePullRequest({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(id),
          version: parseInt(options.version),
          reason: options.reason
        });

        console.log('✅ Pull request recusado com sucesso!');
        console.log(`   ID: ${pullRequest.id}`);
        console.log(`   Estado: ${pullRequest.state}`);
        console.log(`   URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}`);
      } catch (error) {
        console.error('❌ Erro ao recusar pull request:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Reopen pull request command
  pullRequestCmd
    .command('reopen <id>')
    .description('Reabre um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .requiredOption('--version <version>', 'Versão do pull request')
    .action(async (id, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('🔄 Reabrindo pull request...');
        const pullRequest = await pullRequestService.reopenPullRequest({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(id),
          version: parseInt(options.version)
        });

        console.log('✅ Pull request reaberto com sucesso!');
        console.log(`   ID: ${pullRequest.id}`);
        console.log(`   Estado: ${pullRequest.state}`);
        console.log(`   URL: ${pullRequest.links.html?.[0]?.href || 'N/A'}`);
      } catch (error) {
        console.error('❌ Erro ao reabrir pull request:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Comments subcommand
  const commentsCmd = pullRequestCmd
    .command('comments')
    .description('Comandos para gerenciar comentários de pull requests');

  // List comments command
  commentsCmd
    .command('list <prId>')
    .description('Lista comentários de um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .option('--limit <limit>', 'Número máximo de resultados', '25')
    .option('--start <start>', 'Índice de início', '0')
    .action(async (prId, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('💬 Listando comentários...');
        const commentList = await pullRequestCommentsService.listComments({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(prId),
          start: parseInt(options.start),
          limit: parseInt(options.limit)
        });

        if (commentList.values.length === 0) {
          console.log('📭 Nenhum comentário encontrado.');
          return;
        }

        console.log(`✅ ${commentList.values.length} comentário(s) encontrado(s):`);
        console.log('');
        
        commentList.values.forEach(comment => {
          console.log(`#${comment.id} - ${comment.author.name}`);
          console.log(`   Criado: ${new Date(comment.createdDate).toLocaleString('pt-BR')}`);
          console.log(`   Severidade: ${comment.severity || 'NORMAL'}`);
          if (comment.anchor) {
            console.log(`   Âncora: Linha ${comment.anchor.line} em ${comment.anchor.path}`);
          }
          console.log(`   Texto: ${comment.text.length > 100 ? comment.text.substring(0, 100) + '...' : comment.text}`);
          console.log('');
        });
      } catch (error) {
        console.error('❌ Erro ao listar comentários:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Create comment command
  commentsCmd
    .command('create <prId>')
    .description('Cria um comentário em um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .requiredOption('--text <text>', 'Texto do comentário')
    .option('--parent <parentId>', 'ID do comentário pai (para respostas)')
    .option('--severity <severity>', 'Severidade (NORMAL, BLOCKER, WARNING)', 'NORMAL')
    .action(async (prId, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('💬 Criando comentário...');
        const comment = await pullRequestCommentsService.createComment({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(prId),
          text: options.text,
          parentId: options.parent ? parseInt(options.parent) : undefined,
          severity: options.severity as any
        });

        console.log('✅ Comentário criado com sucesso!');
        console.log(`   ID: ${comment.id}`);
        console.log(`   Autor: ${comment.author.name}`);
        console.log(`   Severidade: ${comment.severity || 'NORMAL'}`);
        console.log(`   URL: ${comment.links.html?.[0]?.href || 'N/A'}`);
      } catch (error) {
        console.error('❌ Erro ao criar comentário:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Analysis subcommand
  const analysisCmd = pullRequestCmd
    .command('analysis')
    .description('Comandos para análise de pull requests');

  // Get diff command
  analysisCmd
    .command('diff <prId>')
    .description('Obtém o diff de um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .option('--context <lines>', 'Linhas de contexto', '3')
    .option('--whitespace <mode>', 'Tratamento de espaços (ignore-all, ignore-change-amount, ignore-eol-at-eof, show-all)', 'show-all')
    .action(async (prId, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('📊 Obtendo diff...');
        const diff = await pullRequestAnalysisService.getDiff({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(prId),
          contextLines: parseInt(options.context),
          whitespace: options.whitespace as any
        });

        console.log('✅ Diff obtido com sucesso!');
        console.log(`   Hash origem: ${diff.fromHash}`);
        console.log(`   Hash destino: ${diff.toHash}`);
        console.log(`   Linhas de contexto: ${diff.contextLines}`);
        console.log(`   Truncado: ${diff.truncated ? 'Sim' : 'Não'}`);
        console.log('');
        console.log('📄 Diff:');
        console.log(diff.diff);
      } catch (error) {
        console.error('❌ Erro ao obter diff:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Get changes command
  analysisCmd
    .command('changes <prId>')
    .description('Obtém as mudanças de um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .option('--limit <limit>', 'Número máximo de resultados', '25')
    .option('--start <start>', 'Índice de início', '0')
    .action(async (prId, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('📊 Obtendo mudanças...');
        const changeList = await pullRequestAnalysisService.getChanges({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(prId),
          start: parseInt(options.start),
          limit: parseInt(options.limit)
        });

        if (changeList.values.length === 0) {
          console.log('📭 Nenhuma mudança encontrada.');
          return;
        }

        console.log(`✅ ${changeList.values.length} mudança(s) encontrada(s):`);
        console.log('');
        
        changeList.values.forEach(change => {
          console.log(`${change.type} - ${change.path}`);
          console.log(`   Tipo: ${change.nodeType}`);
          if (change.percentUnchanged !== undefined) {
            console.log(`   % inalterado: ${change.percentUnchanged}`);
          }
          console.log('');
        });
      } catch (error) {
        console.error('❌ Erro ao obter mudanças:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });

  // Get activities command
  analysisCmd
    .command('activities <prId>')
    .description('Obtém as atividades de um pull request')
    .requiredOption('-s, --server <url>', 'URL do servidor Bitbucket')
    .requiredOption('-t, --token <token>', 'Token de acesso')
    .requiredOption('-p, --project <key>', 'Chave do projeto')
    .requiredOption('-r, --repo <slug>', 'Slug do repositório')
    .option('--limit <limit>', 'Número máximo de resultados', '25')
    .option('--start <start>', 'Índice de início', '0')
    .action(async (prId, options) => {
      try {
        console.log('🔍 Detectando tipo de servidor...');
        const serverInfo = await detectServer(options.server);
        
        console.log('📊 Obtendo atividades...');
        const activityList = await pullRequestAnalysisService.getActivities({
          serverInfo,
          auth: {
            access_token: options.token,
            token_type: 'Bearer'
          },
          projectKey: options.project,
          repositorySlug: options.repo,
          pullRequestId: parseInt(prId),
          start: parseInt(options.start),
          limit: parseInt(options.limit)
        });

        if (activityList.values.length === 0) {
          console.log('📭 Nenhuma atividade encontrada.');
          return;
        }

        console.log(`✅ ${activityList.values.length} atividade(s) encontrada(s):`);
        console.log('');
        
        activityList.values.forEach(activity => {
          console.log(`#${activity.id} - ${activity.action}`);
          console.log(`   Usuário: ${activity.user.name}`);
          console.log(`   Data: ${new Date(activity.createdDate).toLocaleString('pt-BR')}`);
          if (activity.comment) {
            console.log(`   Comentário: ${activity.comment.text.substring(0, 100)}${activity.comment.text.length > 100 ? '...' : ''}`);
          }
          console.log('');
        });
      } catch (error) {
        console.error('❌ Erro ao obter atividades:', error instanceof Error ? error.message : 'Erro desconhecido');
        process.exit(1);
      }
    });
}
