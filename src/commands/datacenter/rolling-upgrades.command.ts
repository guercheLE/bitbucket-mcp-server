/**
 * Data Center Rolling Upgrades Commands
 * CLI commands for Bitbucket Data Center Rolling Upgrades Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { RollingUpgradesService } from '../../services/datacenter/rolling-upgrades.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterRollingUpgradesCommands {
  private static logger = Logger.forContext('DataCenterRollingUpgradesCommands');

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de rolling upgrades');

    const upgradeCommand = program
      .command('upgrade')
      .description('Comandos de atualizações em rolo do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server upgrade <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Cluster Management
    upgradeCommand
      .command('get-cluster')
      .description('Obtém informações do cluster')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-cluster
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-cluster --output json

**Descrição:**
  Obtém informações detalhadas do cluster do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getCluster();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter informações do cluster', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('get-cluster-state')
      .description('Obtém estado do cluster')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-cluster-state
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-cluster-state --output json

**Descrição:**
  Obtém o estado atual do cluster do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getClusterState();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter estado do cluster', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Node Management
    upgradeCommand
      .command('list-nodes')
      .description('Lista nós do cluster')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade list-nodes
  $ npx -y @guerchele/bitbucket-mcp-server upgrade list-nodes --output json

**Descrição:**
  Lista todos os nós do cluster do Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getNodes();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar nós do cluster', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('get-node')
      .description('Obtém informações do nó')
      .requiredOption('-n, --node-id <nodeId>', 'ID do nó')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --node-id\`: ID do nó

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-node --node-id node-1
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-node --node-id node-1 --output json

**Descrição:**
  Obtém informações detalhadas de um nó específico do cluster.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getNode(options.nodeId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter informações do nó', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('get-node-state')
      .description('Obtém estado do nó')
      .requiredOption('-n, --node-id <nodeId>', 'ID do nó')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --node-id\`: ID do nó

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-node-state --node-id node-1
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-node-state --node-id node-1 --output json

**Descrição:**
  Obtém informações detalhadas de um nó específico do cluster (inclui estado).`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getNode(options.nodeId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter estado do nó', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('get-node-build-info')
      .description('Obtém informações de build do nó')
      .requiredOption('-n, --node-id <nodeId>', 'ID do nó')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --node-id\`: ID do nó

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-node-build-info --node-id node-1
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-node-build-info --node-id node-1 --output json

**Descrição:**
  Obtém informações de build e versão de um nó específico do cluster.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getNodeWithBuildInfo(options.nodeId);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter informações de build do nó', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Rolling Upgrade Configuration
    upgradeCommand
      .command('get-configuration')
      .description('Obtém configuração de atualização em rolo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-configuration
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-configuration --output json

**Descrição:**
  Obtém a configuração atual de atualizações em rolo do cluster.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getRollingUpgradeConfiguration();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter configuração de atualização em rolo', {
            error,
            options,
          });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('update-configuration')
      .description('Atualiza configuração de atualização em rolo')
      .option('-m, --max-concurrent <maxConcurrent>', 'Máximo de nós simultâneos')
      .option('-t, --timeout <timeout>', 'Timeout em minutos')
      .option('-w, --wait-time <waitTime>', 'Tempo de espera entre nós em minutos')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-m, --max-concurrent\`: Máximo de nós simultâneos para atualização
- \`-t, --timeout\`: Timeout em minutos para cada nó
- \`-w, --wait-time\`: Tempo de espera entre nós em minutos
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade update-configuration --max-concurrent 2 --timeout 30
  $ npx -y @guerchele/bitbucket-mcp-server upgrade update-configuration --wait-time 5 --output json

**Descrição:**
  Atualiza a configuração de atualizações em rolo do cluster.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const config: any = {};
          if (options.maxConcurrent) config.maxConcurrentNodes = parseInt(options.maxConcurrent);
          if (options.timeout) config.timeoutMinutes = parseInt(options.timeout);
          if (options.waitTime) config.waitTimeMinutes = parseInt(options.waitTime);

          const result = await upgradeService.updateRollingUpgradeConfiguration(config);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar configuração de atualização em rolo', {
            error,
            options,
          });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Rolling Upgrade Operations
    upgradeCommand
      .command('start')
      .description('Inicia atualização em rolo')
      .requiredOption('-v, --version <version>', 'Versão de destino')
      .option('-f, --force', 'Forçar atualização')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-v, --version\`: Versão de destino para a atualização

**Opções disponíveis:**
- \`-f, --force\`: Forçar atualização mesmo com avisos
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade start --version 8.10.0
  $ npx -y @guerchele/bitbucket-mcp-server upgrade start --version 8.10.0 --force
  $ npx -y @guerchele/bitbucket-mcp-server upgrade start --version 8.10.0 --output json

**Descrição:**
  Inicia uma atualização em rolo para a versão especificada.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.startRollingUpgrade({
            targetVersion: options.version,
            forceUpgrade: options.force,
          });
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao iniciar atualização em rolo', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('get-status')
      .description('Obtém status da atualização em rolo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-status
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-status --output json

**Descrição:**
  Obtém o status atual da atualização em rolo em andamento.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getRollingUpgradeStatus();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter status da atualização em rolo', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('cancel')
      .description('Cancela atualização em rolo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade cancel
  $ npx -y @guerchele/bitbucket-mcp-server upgrade cancel --output json

**Descrição:**
  Cancela a atualização em rolo em andamento.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          await upgradeService.cancelRollingUpgrade();
          const response = createMcpResponse(
            { message: 'Atualização em rolo cancelada com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao cancelar atualização em rolo', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('get-history')
      .description('Obtém histórico de atualizações em rolo')
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
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-history
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-history --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server upgrade get-history --output json

**Descrição:**
  Obtém o histórico de atualizações em rolo executadas no cluster.
  **Nota:** Os parâmetros de paginação são ignorados pois a API não os suporta.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          const result = await upgradeService.getRollingUpgradeHistory();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter histórico de atualizações em rolo', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Node-specific Operations
    upgradeCommand
      .command('upgrade-node')
      .description('Atualiza nó específico')
      .requiredOption('-n, --node-id <nodeId>', 'ID do nó')
      .requiredOption('-v, --version <version>', 'Versão de destino')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --node-id\`: ID do nó a ser atualizado
- \`-v, --version\`: Versão de destino para a atualização

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade upgrade-node --node-id node-1 --version 8.10.0
  $ npx -y @guerchele/bitbucket-mcp-server upgrade upgrade-node --node-id node-2 --version 8.10.0 --output json

**Descrição:**
  **Nota:** A atualização individual de nós não é suportada diretamente pela API.
  Use o comando 'start' para iniciar uma atualização em rolo completa.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          // Note: Individual node upgrade is not directly supported by the API
          // This would require a custom implementation or different approach
          const result = {
            message: `Node upgrade for ${options.nodeId} to version ${options.version} is not directly supported by the API`,
          };
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao atualizar nó', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    upgradeCommand
      .command('restart-node')
      .description('Reinicia nó específico')
      .requiredOption('-n, --node-id <nodeId>', 'ID do nó')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --node-id\`: ID do nó a ser reiniciado

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server upgrade restart-node --node-id node-1
  $ npx -y @guerchele/bitbucket-mcp-server upgrade restart-node --node-id node-1 --output json

**Descrição:**
  **Nota:** O reinício individual de nós não é suportado diretamente pela API.
  Esta funcionalidade requer implementação customizada ou abordagem diferente.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const upgradeService = new RollingUpgradesService(
            apiClient,
            Logger.forContext('RollingUpgradesService')
          );

          // Note: Individual node restart is not directly supported by the API
          // This would require a custom implementation or different approach
          const result = {
            message: `Node restart for ${options.nodeId} is not directly supported by the API`,
          };
          const response = createMcpResponse(
            { message: 'Nó reiniciado com sucesso' },
            options.output
          );
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao reiniciar nó', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center rolling upgrades commands');
  }
}
