/**
 * Data Center Mirroring Commands
 * CLI commands for Bitbucket Data Center Mirroring Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { MirroringService } from '../../services/datacenter/mirroring.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterMirroringCommands {
  private static logger = Logger.forContext('DataCenterMirroringCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de mirroring');

    const mirrorCommand = program
      .command('mirror')
      .description('Comandos de espelhamento do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server mirror <command> --help' para mais informações sobre um comando específico.
`
      );

    // Mirror Configuration Management
    mirrorCommand
      .command('list-configurations')
      .description('Lista configurações de espelhamento')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror  list-configurations
  $ npx -y @guerchele/bitbucket-mcp-server mirror  list-configurations --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server mirror  list-configurations --status ACTIVE

**Descrição:**
  Lista todas as configurações de espelhamento com opções de paginação e filtro.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const params: any = {
            start: (parseInt(options.page) - 1) * parseInt(options.limit),
            limit: parseInt(options.limit),
          };

          if (options.status) params.status = options.status;

          const result = await mirroringService.listMirrorConfigurations(params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar configurações de espelhamento', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('create-configuration')
      .description('Cria configuração de espelhamento')
      .requiredOption('-n, --name <name>', 'Nome da configuração')
      .requiredOption('-u, --upstream-url <upstreamUrl>', 'URL do repositório upstream')
      .requiredOption('-r, --repository <repository>', 'Repositório de destino')
      .option('-d, --description <description>', 'Descrição da configuração')
      .option('-v, --interval <interval>', 'Intervalo de sincronização em minutos', '60')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da configuração
- \`-u, --upstream-url\`: URL do repositório upstream
- \`-r, --repository\`: Repositório de destino

**Opções disponíveis:**
- \`-d, --description\`: Descrição da configuração
- \`-v, --interval\`: Intervalo de sincronização em minutos (padrão: 60)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror  create-configuration --name "Main Mirror" --upstream-url "https://github.com/user/repo.git" --repository "PROJECT/repo"
  $ npx -y @guerchele/bitbucket-mcp-server mirror  create-configuration --name "Daily Sync" --upstream-url "https://github.com/user/repo.git" --repository "PROJECT/repo" --interval 1440

**Descrição:**
  Cria uma nova configuração de espelhamento para sincronizar um repositório upstream.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const result = await mirroringService.createMirrorConfiguration({
            name: options.name,
            description: options.description,
            sourceRepository: {
              slug: options.repository.split('/')[1] || options.repository,
              project: {
                key: options.repository.split('/')[0] || 'PROJECT',
              },
            },
            targetRepository: {
              slug: options.repository.split('/')[1] || options.repository,
              project: {
                key: options.repository.split('/')[0] || 'PROJECT',
              },
            },
            direction: 'PULL',
            enabled: true,
            schedule: {
              enabled: true,
              cronExpression: `0 */${options.interval} * * *`, // Convert minutes to cron expression
            },
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar configuração de espelhamento', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('get-configuration')
      .description('Obtém configuração de espelhamento')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror get-configuration --config-id 123
  $ npx -y @guerchele/bitbucket-mcp-server mirror get-configuration --config-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de uma configuração de espelhamento específica.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const result = await mirroringService.getMirrorConfiguration(parseInt(options.configId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração de espelhamento', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('update-configuration')
      .description('Atualiza configuração de espelhamento')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-n, --name <name>', 'Nome da configuração')
      .option('-u, --upstream-url <upstreamUrl>', 'URL do repositório upstream')
      .option('-d, --description <description>', 'Descrição da configuração')
      .option('-v, --interval <interval>', 'Intervalo de sincronização em minutos')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-n, --name\`: Nome da configuração
- \`-u, --upstream-url\`: URL do repositório upstream
- \`-d, --description\`: Descrição da configuração
- \`-v, --interval\`: Intervalo de sincronização em minutos
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror update-configuration --config-id 123 --name "Updated Mirror"
  $ npx -y @guerchele/bitbucket-mcp-server mirror update-configuration --config-id 123 --interval 120 --description "Updated description"

**Descrição:**
  Atualiza uma configuração de espelhamento existente com novos parâmetros.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.upstreamUrl) updateData.upstreamUrl = options.upstreamUrl;
          if (options.description) updateData.description = options.description;
          if (options.interval) updateData.syncInterval = parseInt(options.interval);

          const result = await mirroringService.updateMirrorConfiguration(
            parseInt(options.configId),
            updateData
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar configuração de espelhamento', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('delete-configuration')
      .description('Exclui configuração de espelhamento')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror delete-configuration --config-id 123
  $ npx -y @guerchele/bitbucket-mcp-server mirror delete-configuration --config-id 123 --output json

**Descrição:**
  Exclui uma configuração de espelhamento. Esta ação é irreversível.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          await mirroringService.deleteMirrorConfiguration(parseInt(options.configId));
          const response = createMcpResponse(
            { message: 'Configuração de espelhamento excluída com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir configuração de espelhamento', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Mirror Synchronization
    mirrorCommand
      .command('sync')
      .description('Sincroniza espelhamento')
      .requiredOption('-i, --config-id <configId>', 'ID da configuração')
      .option('-f, --force', 'Forçar sincronização')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --config-id\`: ID da configuração

**Opções disponíveis:**
- \`-f, --force\`: Forçar sincronização mesmo se já estiver em andamento
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror sync --config-id 123
  $ npx -y @guerchele/bitbucket-mcp-server mirror sync --config-id 123 --force
  $ npx -y @guerchele/bitbucket-mcp-server mirror sync --config-id 123 --output json

**Descrição:**
  Inicia uma sincronização manual de uma configuração de espelhamento.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const result = await mirroringService.startMirrorSync(parseInt(options.configId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao sincronizar espelhamento', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('list-sync-results')
      .description('Lista resultados de sincronização')
      .option('-i, --config-id <configId>', 'ID da configuração')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --status <status>', 'Filtrar por status')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-i, --config-id\`: ID da configuração (opcional)
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --status\`: Filtrar por status
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror list-sync-results
  $ npx -y @guerchele/bitbucket-mcp-server mirror list-sync-results --config-id 123
  $ npx -y @guerchele/bitbucket-mcp-server mirror list-sync-results --status SUCCESS --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server mirror list-sync-results --page 2 --limit 5

**Descrição:**
  Lista resultados de sincronização com opções de paginação e filtro.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const params: any = {
            start: (parseInt(options.page) - 1) * parseInt(options.limit),
            limit: parseInt(options.limit),
          };

          if (options.configId) params.configId = parseInt(options.configId);
          if (options.status) params.status = options.status;

          const result = await mirroringService.getMirrorSyncResults(params.configId || 0, params);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar resultados de sincronização', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('get-sync-result')
      .description('Obtém resultado de sincronização')
      .requiredOption('-i, --result-id <resultId>', 'ID do resultado')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --result-id\`: ID do resultado

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror get-sync-result --result-id 456
  $ npx -y @guerchele/bitbucket-mcp-server mirror get-sync-result --result-id 456 --output json

**Descrição:**
  Obtém informações detalhadas de um resultado de sincronização específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const result = await mirroringService.getMirrorSyncResult(
            0, // mirrorId - would need to be provided or derived
            parseInt(options.resultId)
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter resultado de sincronização', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Upstream Mirror Management
    mirrorCommand
      .command('list-upstream')
      .description('Lista espelhos upstream')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror list-upstream
  $ npx -y @guerchele/bitbucket-mcp-server mirror list-upstream --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server mirror list-upstream --output json

**Descrição:**
  Lista todos os espelhos upstream configurados com opções de paginação.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const result = await mirroringService.listUpstreamMirrors({
            start: (parseInt(options.page) - 1) * parseInt(options.limit),
            limit: parseInt(options.limit),
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar espelhos upstream', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('create-upstream')
      .description('Cria espelho upstream')
      .requiredOption('-n, --name <name>', 'Nome do espelho upstream')
      .requiredOption('-u, --url <url>', 'URL do espelho upstream')
      .option('-d, --description <description>', 'Descrição do espelho upstream')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do espelho upstream
- \`-u, --url\`: URL do espelho upstream

**Opções disponíveis:**
- \`-d, --description\`: Descrição do espelho upstream
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror create-upstream --name "GitHub Mirror" --url "https://github.com/user/repo.git"
  $ npx -y @guerchele/bitbucket-mcp-server mirror create-upstream --name "GitLab Mirror" --url "https://gitlab.com/user/repo.git" --description "GitLab repository mirror"

**Descrição:**
  Cria um novo espelho upstream para sincronização de repositórios.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const result = await mirroringService.createUpstreamMirror({
            name: options.name,
            sourceUrl: options.url,
            description: options.description,
            targetRepository: {
              slug: 'default-repo',
              project: {
                key: 'PROJECT',
              },
            },
            direction: 'PULL',
            enabled: true,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao criar espelho upstream', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('get-upstream')
      .description('Obtém espelho upstream')
      .requiredOption('-i, --id <mirrorId>', 'ID do espelho upstream')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do espelho upstream

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror get-upstream --id 789
  $ npx -y @guerchele/bitbucket-mcp-server mirror get-upstream --id 789 --output json

**Descrição:**
  Obtém informações detalhadas de um espelho upstream específico.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const result = await mirroringService.getUpstreamMirror(parseInt(options.mirrorId));
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter espelho upstream', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('update-upstream')
      .description('Atualiza espelho upstream')
      .requiredOption('-i, --id <mirrorId>', 'ID do espelho upstream')
      .option('-n, --name <name>', 'Nome do espelho upstream')
      .option('-u, --url <url>', 'URL do espelho upstream')
      .option('-d, --description <description>', 'Descrição do espelho upstream')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do espelho upstream

**Opções disponíveis:**
- \`-n, --name\`: Nome do espelho upstream
- \`-u, --url\`: URL do espelho upstream
- \`-d, --description\`: Descrição do espelho upstream
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror update-upstream --id 789 --name "Updated Mirror"
  $ npx -y @guerchele/bitbucket-mcp-server mirror update-upstream --id 789 --url "https://new-url.com/repo.git"
  $ npx -y @guerchele/bitbucket-mcp-server mirror update-upstream --id 789 --description "Updated description"

**Descrição:**
  Atualiza um espelho upstream existente com novos parâmetros.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          const updateData: any = {};
          if (options.name) updateData.name = options.name;
          if (options.url) updateData.sourceUrl = options.url;
          if (options.description) updateData.description = options.description;

          const result = await mirroringService.updateUpstreamMirror(
            parseInt(options.mirrorId),
            updateData
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar espelho upstream', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    mirrorCommand
      .command('delete-upstream')
      .description('Exclui espelho upstream')
      .requiredOption('-i, --id <mirrorId>', 'ID do espelho upstream')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do espelho upstream

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server mirror delete-upstream --id 789
  $ npx -y @guerchele/bitbucket-mcp-server mirror delete-upstream --id 789 --output json

**Descrição:**
  Exclui um espelho upstream. Esta ação é irreversível.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const mirroringService = new MirroringService(
            apiClient,
            Logger.forContext('MirroringService')
          );

          await mirroringService.deleteUpstreamMirror(parseInt(options.mirrorId));
          const response = createMcpResponse(
            { message: 'Espelho upstream excluído com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao excluir espelho upstream', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center mirroring commands');
  }
}
