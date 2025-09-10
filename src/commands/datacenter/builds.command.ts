/**
 * Data Center Builds Commands
 * CLI commands for Bitbucket Data Center Builds Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { BuildsService } from '../../services/datacenter/builds.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterBuildsCommands {
  private static logger = Logger.forContext('DataCenterBuildsCommands');

  private static async handleCreateBuild(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.createBuild({
        name: options.name,
        planKey: options.planKey,
        description: options.description,
      });
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetBuild(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.getBuild(parseInt(options.buildId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateBuild(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const updateData: any = {};
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;

      const result = await buildsService.updateBuild(parseInt(options.buildId), updateData);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteBuild(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      await buildsService.deleteBuild(parseInt(options.buildId));
      const response = createMcpResponse({ message: 'Build excluído com sucesso' }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListBuilds(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      if (options.planKey) params.planKey = options.planKey;
      if (options.status) params.status = options.status;
      if (options.sort) params.sort = options.sort;

      const result = await buildsService.listBuilds(params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar builds', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleStartBuild(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.startBuild(parseInt(options.buildId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao iniciar build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleStopBuild(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      await buildsService.stopBuild(parseInt(options.buildId));
      const response = createMcpResponse({ message: 'Build parado com sucesso' }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao parar build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreatePlan(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.createBuildPlan({
        key: options.key,
        name: options.name,
        description: options.description,
        type: 'BUILD' as any,
        projectKey: 'DEFAULT',
      });
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar plano de build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetPlan(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.getBuildPlan(parseInt(options.planId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter plano de build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdatePlan(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const updateData: any = {};
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;

      const result = await buildsService.updateBuildPlan(parseInt(options.planId), updateData);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar plano de build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeletePlan(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      await buildsService.deleteBuildPlan(parseInt(options.planId));
      const response = createMcpResponse(
        { message: 'Plano de build excluído com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir plano de build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListPlans(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      if (options.sort) params.sort = options.sort;

      const result = await buildsService.listBuildPlans(params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar planos de build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateDeployment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.createDeployment({
        name: options.name,
        environmentId: parseInt(options.environmentId),
        description: options.description,
        buildId: 1,
      });
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar deployment', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetDeployment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.getDeployment(parseInt(options.deploymentId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter deployment', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateDeployment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const updateData: any = {};
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;

      const result = await buildsService.updateDeployment(
        parseInt(options.deploymentId),
        updateData
      );
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar deployment', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteDeployment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      await buildsService.deleteDeployment(parseInt(options.deploymentId));
      const response = createMcpResponse(
        { message: 'Deployment excluído com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir deployment', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListDeployments(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      if (options.environmentId) params.environmentId = parseInt(options.environmentId);
      if (options.status) params.status = options.status;
      if (options.sort) params.sort = options.sort;

      const result = await buildsService.listDeployments(params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar deployments', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleStartDeployment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.startDeployment(parseInt(options.deploymentId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao iniciar deployment', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleStopDeployment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      await buildsService.stopDeployment(parseInt(options.deploymentId));
      const response = createMcpResponse(
        { message: 'Deployment parado com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao parar deployment', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateEnvironment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.createEnvironment({
        name: options.name,
        description: options.description,
        type: options.type,
        projectKey: 'DEFAULT',
      });
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar ambiente', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetEnvironment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const result = await buildsService.getEnvironment(parseInt(options.environmentId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter ambiente', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateEnvironment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const updateData: any = {};
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;

      const result = await buildsService.updateEnvironment(
        parseInt(options.environmentId),
        updateData
      );
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar ambiente', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteEnvironment(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      await buildsService.deleteEnvironment(parseInt(options.environmentId));
      const response = createMcpResponse(
        { message: 'Ambiente excluído com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir ambiente', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListEnvironments(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const buildsService = new BuildsService(apiClient, Logger.forContext('BuildsService'));

      const params: any = {
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      };

      if (options.sort) params.sort = options.sort;

      const result = await buildsService.listEnvironments(params);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar ambientes', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de builds');

    const buildsCommand = program
      .command('builds')
      .description('Comandos de builds e deployments do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server builds <command> --help' para mais informações sobre um comando específico.
`
      );

    // Build Management
    buildsCommand
      .command('create')
      .description('Cria um novo build')
      .requiredOption('-n, --name <name>', 'Nome do build')
      .requiredOption('-k, --plan-key <planKey>', 'Chave do plano de build')
      .option('-d, --description <description>', 'Descrição do build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do build
- \`-k, --plan-key\`: Chave do plano de build

**Opções disponíveis:**
- \`-d, --description\`: Descrição do build
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds create --name "My Build" --plan-key "MY-PLAN"
  $ npx -y @guerchele/bitbucket-mcp-server builds create --name "CI Build" --plan-key "CI-PLAN" --description "Continuous Integration Build"

**Descrição:**
  Cria um novo build no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateBuild(options);
      });

    buildsCommand
      .command('get')
      .description('Obtém build por ID')
      .requiredOption('-i, --build-id <buildId>', 'ID do build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --build-id\`: ID do build

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds get --build-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds get --build-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de um build específico no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetBuild(options);
      });

    buildsCommand
      .command('update')
      .description('Atualiza build')
      .requiredOption('-i, --build-id <buildId>', 'ID do build')
      .option('-n, --name <name>', 'Nome do build')
      .option('-d, --description <description>', 'Descrição do build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --build-id\`: ID do build

**Opções disponíveis:**
- \`-n, --name\`: Nome do build
- \`-d, --description\`: Descrição do build
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds update --build-id 123 --name "Updated Build Name"
  $ npx -y @guerchele/bitbucket-mcp-server builds update --build-id 123 --description "New description"
  $ npx -y @guerchele/bitbucket-mcp-server builds update --build-id 123 --name "New Name" --description "New Description"

**Descrição:**
  Atualiza as propriedades de um build existente no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdateBuild(options);
      });

    buildsCommand
      .command('delete')
      .description('Exclui build')
      .requiredOption('-i, --build-id <buildId>', 'ID do build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --build-id\`: ID do build

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds delete --build-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds delete --build-id 123 --output json

**Descrição:**
  Exclui permanentemente um build do Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleDeleteBuild(options);
      });

    buildsCommand
      .command('list')
      .description('Lista builds')
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
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds list
  $ npx -y @guerchele/bitbucket-mcp-server builds list --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server builds list --sort "name" --output json

**Descrição:**
  Lista builds no Bitbucket Data Center com opções de paginação e ordenação.`
      )
      .action(async options => {
        await this.handleListBuilds(options);
      });

    buildsCommand
      .command('start')
      .description('Inicia build')
      .requiredOption('-i, --build-id <buildId>', 'ID do build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --build-id\`: ID do build

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds start --build-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds start --build-id 123 --output json

**Descrição:**
  Inicia a execução de um build no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleStartBuild(options);
      });

    buildsCommand
      .command('stop')
      .description('Para build')
      .requiredOption('-i, --build-id <buildId>', 'ID do build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --build-id\`: ID do build

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds stop --build-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds stop --build-id 123 --output json

**Descrição:**
  Para a execução de um build em andamento no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleStopBuild(options);
      });

    // Build Plan Management
    buildsCommand
      .command('create-plan')
      .description('Cria um novo plano de build')
      .requiredOption('-k, --key <key>', 'Chave do plano')
      .requiredOption('-n, --name <name>', 'Nome do plano')
      .option('-d, --description <description>', 'Descrição do plano')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-k, --key\`: Chave do plano
- \`-n, --name\`: Nome do plano

**Opções disponíveis:**
- \`-d, --description\`: Descrição do plano
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds create-plan --key "CI-PLAN" --name "CI Build Plan"
  $ npx -y @guerchele/bitbucket-mcp-server builds create-plan --key "DEPLOY-PLAN" --name "Deployment Plan" --description "Production deployment plan"

**Descrição:**
  Cria um novo plano de build no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreatePlan(options);
      });

    buildsCommand
      .command('get-plan')
      .description('Obtém plano de build por ID')
      .requiredOption('-i, --plan-id <planId>', 'ID do plano de build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --plan-id\`: ID do plano de build

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds get-plan --plan-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds get-plan --plan-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de um plano de build específico no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetPlan(options);
      });

    buildsCommand
      .command('update-plan')
      .description('Atualiza plano de build')
      .requiredOption('-i, --plan-id <planId>', 'ID do plano de build')
      .option('-n, --name <name>', 'Nome do plano')
      .option('-d, --description <description>', 'Descrição do plano')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --plan-id\`: ID do plano de build

**Opções disponíveis:**
- \`-n, --name\`: Nome do plano
- \`-d, --description\`: Descrição do plano
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds update-plan --plan-id 123 --name "Updated Plan Name"
  $ npx -y @guerchele/bitbucket-mcp-server builds update-plan --plan-id 123 --description "New description"
  $ npx -y @guerchele/bitbucket-mcp-server builds update-plan --plan-id 123 --name "New Name" --description "New Description"

**Descrição:**
  Atualiza as propriedades de um plano de build existente no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdatePlan(options);
      });

    buildsCommand
      .command('delete-plan')
      .description('Exclui plano de build')
      .requiredOption('-i, --plan-id <planId>', 'ID do plano de build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --plan-id\`: ID do plano de build

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds delete-plan --plan-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds delete-plan --plan-id 123 --output json

**Descrição:**
  Exclui permanentemente um plano de build do Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleDeletePlan(options);
      });

    buildsCommand
      .command('list-plans')
      .description('Lista planos de build')
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
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds list-plans
  $ npx -y @guerchele/bitbucket-mcp-server builds list-plans --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server builds list-plans --sort "name" --output json

**Descrição:**
  Lista planos de build no Bitbucket Data Center com opções de paginação e ordenação.`
      )
      .action(async options => {
        await this.handleListPlans(options);
      });

    // Deployment Management
    buildsCommand
      .command('create-deployment')
      .description('Cria um novo deployment')
      .requiredOption('-n, --name <name>', 'Nome do deployment')
      .requiredOption('-e, --environment-id <environmentId>', 'ID do ambiente')
      .option('-d, --description <description>', 'Descrição do deployment')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do deployment
- \`-e, --environment-id\`: ID do ambiente

**Opções disponíveis:**
- \`-d, --description\`: Descrição do deployment
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds create-deployment --name "Production Deploy" --environment-id 1
  $ npx -y @guerchele/bitbucket-mcp-server builds create-deployment --name "Staging Deploy" --environment-id 2 --description "Deploy to staging environment"

**Descrição:**
  Cria um novo deployment no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateDeployment(options);
      });

    buildsCommand
      .command('get-deployment')
      .description('Obtém deployment por ID')
      .requiredOption('-i, --deployment-id <deploymentId>', 'ID do deployment')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --deployment-id\`: ID do deployment

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds get-deployment --deployment-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds get-deployment --deployment-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de um deployment específico no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetDeployment(options);
      });

    buildsCommand
      .command('update-deployment')
      .description('Atualiza deployment')
      .requiredOption('-i, --deployment-id <deploymentId>', 'ID do deployment')
      .option('-n, --name <name>', 'Nome do deployment')
      .option('-d, --description <description>', 'Descrição do deployment')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --deployment-id\`: ID do deployment

**Opções disponíveis:**
- \`-n, --name\`: Nome do deployment
- \`-d, --description\`: Descrição do deployment
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds update-deployment --deployment-id 123 --name "Updated Deployment Name"
  $ npx -y @guerchele/bitbucket-mcp-server builds update-deployment --deployment-id 123 --description "New description"
  $ npx -y @guerchele/bitbucket-mcp-server builds update-deployment --deployment-id 123 --name "New Name" --description "New Description"

**Descrição:**
  Atualiza as propriedades de um deployment existente no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdateDeployment(options);
      });

    buildsCommand
      .command('delete-deployment')
      .description('Exclui deployment')
      .requiredOption('-i, --deployment-id <deploymentId>', 'ID do deployment')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --deployment-id\`: ID do deployment

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds delete-deployment --deployment-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds delete-deployment --deployment-id 123 --output json

**Descrição:**
  Exclui permanentemente um deployment do Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleDeleteDeployment(options);
      });

    buildsCommand
      .command('list-deployments')
      .description('Lista deployments')
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
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds list-deployments
  $ npx -y @guerchele/bitbucket-mcp-server builds list-deployments --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server builds list-deployments --sort "name" --output json

**Descrição:**
  Lista deployments no Bitbucket Data Center com opções de paginação e ordenação.`
      )
      .action(async options => {
        await this.handleListDeployments(options);
      });

    buildsCommand
      .command('start-deployment')
      .description('Inicia deployment')
      .requiredOption('-i, --deployment-id <deploymentId>', 'ID do deployment')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --deployment-id\`: ID do deployment

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds start-deployment --deployment-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds start-deployment --deployment-id 123 --output json

**Descrição:**
  Inicia a execução de um deployment no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleStartDeployment(options);
      });

    buildsCommand
      .command('stop-deployment')
      .description('Para deployment')
      .requiredOption('-i, --deployment-id <deploymentId>', 'ID do deployment')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --deployment-id\`: ID do deployment

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds stop-deployment --deployment-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds stop-deployment --deployment-id 123 --output json

**Descrição:**
  Para a execução de um deployment em andamento no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleStopDeployment(options);
      });

    // Environment Management
    buildsCommand
      .command('create-environment')
      .description('Cria um novo ambiente')
      .requiredOption('-n, --name <name>', 'Nome do ambiente')
      .requiredOption('-t, --type <type>', 'Tipo do ambiente')
      .option('-d, --description <description>', 'Descrição do ambiente')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do ambiente
- \`-t, --type\`: Tipo do ambiente

**Opções disponíveis:**
- \`-d, --description\`: Descrição do ambiente
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds create-environment --name "Production" --type "PRODUCTION"
  $ npx -y @guerchele/bitbucket-mcp-server builds create-environment --name "Staging" --type "STAGING" --description "Staging environment"

**Descrição:**
  Cria um novo ambiente no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateEnvironment(options);
      });

    buildsCommand
      .command('get-environment')
      .description('Obtém ambiente por ID')
      .requiredOption('-i, --environment-id <environmentId>', 'ID do ambiente')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --environment-id\`: ID do ambiente

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds get-environment --environment-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds get-environment --environment-id 123 --output json

**Descrição:**
  Obtém informações detalhadas de um ambiente específico no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetEnvironment(options);
      });

    buildsCommand
      .command('update-environment')
      .description('Atualiza ambiente')
      .requiredOption('-i, --environment-id <environmentId>', 'ID do ambiente')
      .option('-n, --name <name>', 'Nome do ambiente')
      .option('-t, --type <type>', 'Tipo do ambiente')
      .option('-d, --description <description>', 'Descrição do ambiente')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --environment-id\`: ID do ambiente

**Opções disponíveis:**
- \`-n, --name\`: Nome do ambiente
- \`-t, --type\`: Tipo do ambiente
- \`-d, --description\`: Descrição do ambiente
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds update-environment --environment-id 123 --name "Updated Environment Name"
  $ npx -y @guerchele/bitbucket-mcp-server builds update-environment --environment-id 123 --type "PRODUCTION"
  $ npx -y @guerchele/bitbucket-mcp-server builds update-environment --environment-id 123 --name "New Name" --description "New Description"

**Descrição:**
  Atualiza as propriedades de um ambiente existente no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleUpdateEnvironment(options);
      });

    buildsCommand
      .command('delete-environment')
      .description('Exclui ambiente')
      .requiredOption('-i, --environment-id <environmentId>', 'ID do ambiente')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --environment-id\`: ID do ambiente

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds delete-environment --environment-id 123
  $ npx -y @guerchele/bitbucket-mcp-server builds delete-environment --environment-id 123 --output json

**Descrição:**
  Exclui permanentemente um ambiente do Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleDeleteEnvironment(options);
      });

    buildsCommand
      .command('list-environments')
      .description('Lista ambientes')
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
- \`-s, --sort\`: Ordenação
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server builds list-environments
  $ npx -y @guerchele/bitbucket-mcp-server builds list-environments --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server builds list-environments --sort "name" --output json

**Descrição:**
  Lista ambientes no Bitbucket Data Center com opções de paginação e ordenação.`
      )
      .action(async options => {
        await this.handleListEnvironments(options);
      });

    registerLogger.info('Successfully registered all Data Center builds commands');
  }
}
