/**
 * Data Center Capabilities Commands
 * CLI commands for Bitbucket Data Center Capabilities Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { CapabilitiesService } from '../../services/datacenter/capabilities.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterCapabilitiesCommands {
  private static logger = Logger.forContext('DataCenterCapabilitiesCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetSystemCapabilities(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.getSystemCapabilities();
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter capacidades do sistema', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListCapabilities(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      if (options.sort) params.sort = options.sort;

      const result = await capabilitiesService.listCapabilities(params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar capacidades', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.getCapability(options.capabilityId);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleEnableCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.enableCapability(options.capabilityId);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao habilitar capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDisableCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.disableCapability(options.capabilityId);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao desabilitar capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetCapabilityConfiguration(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.getCapabilityConfiguration(options.capabilityId);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter configuração da capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateCapabilityConfiguration(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const config = JSON.parse(options.config);
      const result = await capabilitiesService.updateCapabilityConfiguration(
        options.capabilityId,
        config
      );
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar configuração da capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetCapabilityStatus(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.getCapabilityStatus(options.capabilityId);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter status da capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListCapabilityStatuses(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.listCapabilityStatuses();
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar status das capacidades', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetCapabilityMetrics(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.getCapabilityMetrics(options.capabilityId);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter métricas da capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListCapabilityMetrics(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.listCapabilityMetrics();
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar métricas das capacidades', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListSystemCapabilities(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      if (options.sort) params.sort = options.sort;

      const result = await capabilitiesService.getSystemCapabilities();
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar capacidades do sistema', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListUserCapabilities(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      if (options.sort) params.sort = options.sort;

      const result = await capabilitiesService.listCapabilities(params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar capacidades do usuário', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListPluginCapabilities(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.listPluginCapabilities();
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar capacidades do plugin', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetPluginCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.getPluginCapability(options.pluginKey);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter capacidade do plugin', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleEnablePluginCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.enablePluginCapability(options.pluginKey);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao habilitar capacidade do plugin', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDisablePluginCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.disablePluginCapability(options.pluginKey);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao desabilitar capacidade do plugin', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListFeatureCapabilities(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.listFeatureCapabilities();
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar capacidades de funcionalidades', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetFeatureCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.getFeatureCapability(options.featureKey);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter capacidade de funcionalidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleEnableFeatureCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.enableFeatureCapability(options.featureKey);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao habilitar capacidade de funcionalidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDisableFeatureCapability(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const result = await capabilitiesService.disableFeatureCapability(options.featureKey);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao desabilitar capacidade de funcionalidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetCapabilityEvents(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      const result = await capabilitiesService.getCapabilityEvents(options.capabilityId, params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter eventos da capacidade', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListCapabilityEvents(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const capabilitiesService = new CapabilitiesService(
        apiClient,
        Logger.forContext('CapabilitiesService')
      );

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      const result = await capabilitiesService.listCapabilityEvents(params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar eventos das capacidades', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de capabilities');

    const capabilitiesCommand = program
      .command('capabilities')
      .description('Comandos de capacidades do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server capabilities <command> --help' para mais informações sobre um comando específico.
      `
      );

    // System Capabilities
    capabilitiesCommand
      .command('get-system')
      .description('Obtém capacidades do sistema')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-system
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-system --output json

**Descrição:**
  Obtém as capacidades do sistema do Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetSystemCapabilities(options);
      });

    capabilitiesCommand
      .command('list')
      .description('Lista todas as capacidades')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-s, --sort\`: Ordenação dos resultados
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list --sort "name" --output json

**Descrição:**
  Lista todas as capacidades disponíveis no Bitbucket Data Center com opções de paginação e ordenação.`
      )
      .action(async options => {
        await this.handleListCapabilities(options);
      });

    capabilitiesCommand
      .command('get')
      .description('Obtém capacidade por ID')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Obtém detalhes de uma capacidade específica pelo seu ID no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetCapability(options);
      });

    capabilitiesCommand
      .command('enable')
      .description('Habilita capacidade')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Habilita uma capacidade específica no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleEnableCapability(options);
      });

    capabilitiesCommand
      .command('disable')
      .description('Desabilita capacidade')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Desabilita uma capacidade específica no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleDisableCapability(options);
      });

    capabilitiesCommand
      .command('get-configuration')
      .description('Obtém configuração da capacidade')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-configuration --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-configuration --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Obtém a configuração atual de uma capacidade específica no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetCapabilityConfiguration(options);
      });

    capabilitiesCommand
      .command('update-configuration')
      .description('Atualiza configuração da capacidade')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .requiredOption('-c, --config <config>', 'Configuração JSON')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade
- \`-c, --config\`: Configuração JSON da capacidade

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities update-configuration --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --config '{"enabled": true}'
  $ npx -y @guerchele/bitbucket-mcp-server capabilities update-configuration --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --config '{"enabled": false}' --output json

**Descrição:**
  Atualiza a configuração de uma capacidade específica no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdateCapabilityConfiguration(options);
      });

    capabilitiesCommand
      .command('get-status')
      .description('Obtém status da capacidade')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-status --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-status --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Obtém o status atual de uma capacidade específica no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetCapabilityStatus(options);
      });

    capabilitiesCommand
      .command('list-statuses')
      .description('Lista statuses de capacidades')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-statuses
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-statuses --output json

**Descrição:**
  Lista os statuses de todas as capacidades no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleListCapabilityStatuses(options);
      });

    capabilitiesCommand
      .command('get-metrics')
      .description('Obtém métricas da capacidade')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-metrics --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-metrics --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Obtém métricas de performance de uma capacidade específica no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetCapabilityMetrics(options);
      });

    capabilitiesCommand
      .command('list-metrics')
      .description('Lista métricas de capacidades')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-metrics
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-metrics --output json

**Descrição:**
  Lista métricas de performance de todas as capacidades no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleListCapabilityMetrics(options);
      });

    capabilitiesCommand
      .command('get-events')
      .description('Obtém eventos da capacidade')
      .requiredOption('-i, --capability-id <capabilityId>', 'ID da capacidade')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --capability-id\`: ID da capacidade

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-events --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-events --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-events --capability-id "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Obtém eventos relacionados a uma capacidade específica no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetCapabilityEvents(options);
      });

    capabilitiesCommand
      .command('list-events')
      .description('Lista eventos de capacidades')
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
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-events
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-events --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-events --output json

**Descrição:**
  Lista eventos de todas as capacidades no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleListCapabilityEvents(options);
      });

    // Plugin Capabilities
    capabilitiesCommand
      .command('list-plugins')
      .description('Lista capacidades de plugins')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-plugins
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-plugins --output json

**Descrição:**
  Lista capacidades disponíveis de todos os plugins no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleListPluginCapabilities(options);
      });

    capabilitiesCommand
      .command('get-plugin')
      .description('Obtém capacidade de plugin')
      .requiredOption('-k, --plugin-key <pluginKey>', 'Chave do plugin')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --plugin-key\`: Chave do plugin

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-plugin --plugin-key "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-plugin --plugin-key "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Obtém capacidades de um plugin específico no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetPluginCapability(options);
      });

    capabilitiesCommand
      .command('enable-plugin')
      .description('Habilita capacidade de plugin')
      .requiredOption('-k, --plugin-key <pluginKey>', 'Chave do plugin')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --plugin-key\`: Chave do plugin

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable-plugin --plugin-key "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable-plugin --plugin-key "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Habilita capacidades de um plugin específico no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleEnablePluginCapability(options);
      });

    capabilitiesCommand
      .command('disable-plugin')
      .description('Desabilita capacidade de plugin')
      .requiredOption('-k, --plugin-key <pluginKey>', 'Chave do plugin')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --plugin-key\`: Chave do plugin

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable-plugin --plugin-key "com.atlassian.bitbucket.server.bitbucket-branch-permissions"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable-plugin --plugin-key "com.atlassian.bitbucket.server.bitbucket-branch-permissions" --output json

**Descrição:**
  Desabilita capacidades de um plugin específico no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.disablePluginCapability(options.pluginKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao desabilitar capacidade de plugin', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Feature Capabilities
    capabilitiesCommand
      .command('list-features')
      .description('Lista capacidades de features')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-features
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-features --output json

**Descrição:**
  Lista capacidades de features disponíveis no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.listFeatureCapabilities();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar capacidades de features', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    capabilitiesCommand
      .command('get-feature')
      .description('Obtém capacidade de feature')
      .requiredOption('-k, --feature-key <featureKey>', 'Chave da feature')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --feature-key\`: Chave da feature

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-feature --feature-key "pull-request-merge"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-feature --feature-key "pull-request-merge" --output json

**Descrição:**
  Obtém capacidades de uma feature específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.getFeatureCapability(options.featureKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter capacidade de feature', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    capabilitiesCommand
      .command('enable-feature')
      .description('Habilita capacidade de feature')
      .requiredOption('-k, --feature-key <featureKey>', 'Chave da feature')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --feature-key\`: Chave da feature

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable-feature --feature-key "pull-request-merge"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable-feature --feature-key "pull-request-merge" --output json

**Descrição:**
  Habilita capacidades de uma feature específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.enableFeatureCapability(options.featureKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao habilitar capacidade de feature', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    capabilitiesCommand
      .command('disable-feature')
      .description('Desabilita capacidade de feature')
      .requiredOption('-k, --feature-key <featureKey>', 'Chave da feature')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --feature-key\`: Chave da feature

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable-feature --feature-key "pull-request-merge"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable-feature --feature-key "pull-request-merge" --output json

**Descrição:**
  Desabilita capacidades de uma feature específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.disableFeatureCapability(options.featureKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao desabilitar capacidade de feature', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    // Integration Capabilities
    capabilitiesCommand
      .command('list-integrations')
      .description('Lista capacidades de integrações')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-integrations
  $ npx -y @guerchele/bitbucket-mcp-server capabilities list-integrations --output json

**Descrição:**
  Lista capacidades de integrações disponíveis no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.listIntegrationCapabilities();
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao listar capacidades de integrações', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    capabilitiesCommand
      .command('get-integration')
      .description('Obtém capacidade de integração')
      .requiredOption('-k, --integration-key <integrationKey>', 'Chave da integração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --integration-key\`: Chave da integração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-integration --integration-key "jira-integration"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities get-integration --integration-key "jira-integration" --output json

**Descrição:**
  Obtém capacidades de uma integração específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.getIntegrationCapability(options.integrationKey);
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao obter capacidade de integração', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    capabilitiesCommand
      .command('enable-integration')
      .description('Habilita capacidade de integração')
      .requiredOption('-k, --integration-key <integrationKey>', 'Chave da integração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --integration-key\`: Chave da integração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable-integration --integration-key "jira-integration"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities enable-integration --integration-key "jira-integration" --output json

**Descrição:**
  Habilita capacidades de uma integração específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.enableIntegrationCapability(
            options.integrationKey
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao habilitar capacidade de integração', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    capabilitiesCommand
      .command('disable-integration')
      .description('Desabilita capacidade de integração')
      .requiredOption('-k, --integration-key <integrationKey>', 'Chave da integração')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --integration-key\`: Chave da integração

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable-integration --integration-key "jira-integration"
  $ npx -y @guerchele/bitbucket-mcp-server capabilities disable-integration --integration-key "jira-integration" --output json

**Descrição:**
  Desabilita capacidades de uma integração específica no Bitbucket Data Center.`
      )
      .action(async options => {
        try {
          const apiClient = new ApiClient();
          const capabilitiesService = new CapabilitiesService(
            apiClient,
            Logger.forContext('CapabilitiesService')
          );

          const result = await capabilitiesService.disableIntegrationCapability(
            options.integrationKey
          );
          const response = createMcpResponse(result, options.output);
          console.log(response.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Erro ao desabilitar capacidade de integração', { error, options });
          console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all Data Center capabilities commands');
  }
}
