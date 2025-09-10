/**
 * Pipeline Commands for Bitbucket Cloud
 * Handles pipeline-related operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { PipelineService } from '../../services/cloud/pipeline.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudPipelineCommands {
  private static logger = Logger.forContext('CloudPipelineCommands');

  // Static methods for handling command actions
  private static async handleListPipelines(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      };

      if (options.sort) params.sort = options.sort;
      if (options.query) params.q = options.query;

      const result = await pipelineService.listPipelines(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar pipelines', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRunPipeline(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const pipeline: any = {};

      if (options.branch) {
        pipeline.target = { ref_type: 'branch', ref_name: options.branch };
      } else if (options.tag) {
        pipeline.target = { ref_type: 'tag', ref_name: options.tag };
      } else if (options.commit) {
        pipeline.target = { ref_type: 'commit', ref_name: options.commit };
      }

      const result = await pipelineService.runPipeline({
        workspace: options.workspace,
        repo_slug: options.repo,
        pipeline: pipeline,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao executar pipeline', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetPipeline(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.getPipeline({
        workspace: options.workspace,
        repo_slug: options.repo,
        pipeline_uuid: options.uuid,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter pipeline', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleStopPipeline(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      await pipelineService.stopPipeline({
        workspace: options.workspace,
        repo_slug: options.repo,
        pipeline_uuid: options.uuid,
      });

      const response = createMcpResponse(
        { message: 'Pipeline parado com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao parar pipeline', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListPipelineSteps(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.listPipelineSteps({
        workspace: options.workspace,
        repo_slug: options.repo,
        pipeline_uuid: options.uuid,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar steps do pipeline', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetPipelineStep(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.getPipelineStep({
        workspace: options.workspace,
        repo_slug: options.repo,
        pipeline_uuid: options.uuid,
        step_uuid: options.stepUuid,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter step do pipeline', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetPipelineStepLog(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        pipeline_uuid: options.uuid,
        step_uuid: options.stepUuid,
      };

      if (options.logUuid) params.log_uuid = options.logUuid;

      const result = await pipelineService.getPipelineStepLog(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter log do step', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetConfiguration(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.getConfiguration({
        workspace: options.workspace,
        repo_slug: options.repo,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter configuração do pipeline', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateConfiguration(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const config: any = {};

      if (options.enabled !== undefined) {
        config.enabled = options.enabled === 'true';
      }

      const result = await pipelineService.updateConfiguration({
        workspace: options.workspace,
        repo_slug: options.repo,
        config: config,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar configuração do pipeline', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateBuildNumber(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      await pipelineService.updateNextBuildNumber({
        workspace: options.workspace,
        repo_slug: options.repo,
        build_number: parseInt(options.buildNumber),
      });

      const response = createMcpResponse(
        { message: 'Número de build atualizado com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar número de build', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListSchedules(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.listSchedules({
        workspace: options.workspace,
        repo_slug: options.repo,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar agendamentos', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateSchedule(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const schedule: any = {
        type: options.type,
        cron_pattern: options.cron,
      };

      if (options.branch) {
        schedule.target = { ref_type: 'branch', ref_name: options.branch };
      }

      const result = await pipelineService.createSchedule({
        workspace: options.workspace,
        repo_slug: options.repo,
        schedule: schedule,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar agendamento', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListVariables(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      };

      if (options.environment) params.environment_uuid = options.environment;

      const result = await pipelineService.listVariables(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar variáveis', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateVariable(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const variable: any = {
        key: options.key,
        value: options.value,
        secured: options.secured === 'true',
      };

      const params: any = {
        workspace: options.workspace,
        repo_slug: options.repo,
        variable: variable,
      };

      if (options.environment) params.environment_uuid = options.environment;

      const result = await pipelineService.createVariable(params);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar variável', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListCaches(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.listCaches({
        workspace: options.workspace,
        repo_slug: options.repo,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar caches', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteCaches(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      await pipelineService.deleteCaches({
        workspace: options.workspace,
        repo_slug: options.repo,
      });

      const response = createMcpResponse(
        { message: 'Caches excluídos com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir caches', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetSchedule(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.getSchedule({
        workspace: options.workspace,
        repo_slug: options.repo,
        schedule_uuid: options.scheduleId,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter agendamento', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateSchedule(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const schedule: any = {};
      if (options.target) schedule.target = { ref_name: options.target, ref_type: 'BRANCH' };
      if (options.cron) schedule.cron_pattern = options.cron;
      if (options.enabled !== undefined) schedule.enabled = options.enabled === 'true';

      const result = await pipelineService.updateSchedule({
        workspace: options.workspace,
        repo_slug: options.repo,
        schedule_uuid: options.scheduleId,
        schedule,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar agendamento', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteSchedule(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      await pipelineService.deleteSchedule({
        workspace: options.workspace,
        repo_slug: options.repo,
        schedule_uuid: options.scheduleId,
      });

      const response = createMcpResponse(
        { message: 'Agendamento excluído com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir agendamento', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetVariable(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.getVariable({
        workspace: options.workspace,
        repo_slug: options.repo,
        variable_uuid: options.variableId,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter variável', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateVariable(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const variable: any = {};
      if (options.key) variable.key = options.key;
      if (options.value) variable.value = options.value;
      if (options.secured !== undefined) variable.secured = options.secured === 'true';

      const result = await pipelineService.updateVariable({
        workspace: options.workspace,
        repo_slug: options.repo,
        variable_uuid: options.variableId,
        variable,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar variável', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteVariable(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      await pipelineService.deleteVariable({
        workspace: options.workspace,
        repo_slug: options.repo,
        variable_uuid: options.variableId,
      });

      const response = createMcpResponse(
        { message: 'Variável excluída com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir variável', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteCache(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      await pipelineService.deleteCache({
        workspace: options.workspace,
        repo_slug: options.repo,
        cache_uuid: options.cacheId,
      });

      const response = createMcpResponse({ message: 'Cache excluído com sucesso' }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir cache', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetCacheContentUri(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const pipelineService = new PipelineService(apiClient);

      const result = await pipelineService.getCacheContentUri({
        workspace: options.workspace,
        repo_slug: options.repo,
        cache_uuid: options.cacheId,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter URI do cache', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de pipeline');

    const pipelineCommand = program
      .command('pipeline')
      .description('Comandos de pipeline do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server pipeline <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Pipeline Management
    pipelineCommand
      .command('list')
      .description('Lista pipelines de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-s, --sort <sort>', 'Ordenação (created_on, -created_on)')
      .option('-q, --query <query>', 'Consulta de busca')
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
- \`-s, --sort\`: Ordenação (created_on, -created_on)
- \`-q, --query\`: Consulta de busca
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list --workspace my-company --repo my-project --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list --workspace my-company --repo my-project --sort -created_on --output json
`
      )
      .action(async options => {
        await this.handleListPipelines(options);
      });

    pipelineCommand
      .command('run')
      .description('Executa um pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-b, --branch <branch>', 'Branch para executar')
      .option('-t, --tag <tag>', 'Tag para executar')
      .option('-c, --commit <commit>', 'Commit para executar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-b, --branch\`: Branch para executar o pipeline
- \`-t, --tag\`: Tag para executar o pipeline
- \`-c, --commit\`: Commit específico para executar o pipeline
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Nota:** Especifique apenas uma das opções: branch, tag ou commit.

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline run --workspace my-company --repo my-project --branch main
  $ npx -y @guerchele/bitbucket-mcp-server pipeline run --workspace my-company --repo my-project --tag v1.0.0
  $ npx -y @guerchele/bitbucket-mcp-server pipeline run --workspace my-company --repo my-project --commit abc123 --output json
`
      )
      .action(async options => {
        await this.handleRunPipeline(options);
      });

    pipelineCommand
      .command('get')
      .description('Obtém detalhes de um pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-u, --uuid <uuid>', 'UUID do pipeline')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-u, --uuid\`: UUID do pipeline

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get --workspace my-company --repo my-project --uuid {pipeline-uuid}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get --workspace my-company --repo my-project --uuid {pipeline-uuid} --output json
`
      )
      .action(async options => {
        await this.handleGetPipeline(options);
      });

    pipelineCommand
      .command('stop')
      .description('Para um pipeline em execução')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-u, --uuid <uuid>', 'UUID do pipeline')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-u, --uuid\`: UUID do pipeline

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline stop --workspace my-company --repo my-project --uuid {pipeline-uuid}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline stop --workspace my-company --repo my-project --uuid {pipeline-uuid} --output json
`
      )
      .action(async options => {
        await this.handleStopPipeline(options);
      });

    // Pipeline Steps
    pipelineCommand
      .command('list-steps')
      .description('Lista steps de um pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-u, --uuid <uuid>', 'UUID do pipeline')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-u, --uuid\`: UUID do pipeline

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-steps --workspace my-company --repo my-project --uuid {pipeline-uuid}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-steps --workspace my-company --repo my-project --uuid {pipeline-uuid} --page 2 --limit 20
`
      )
      .action(async options => {
        await this.handleListPipelineSteps(options);
      });

    pipelineCommand
      .command('get-step')
      .description('Obtém detalhes de um step do pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-u, --uuid <uuid>', 'UUID do pipeline')
      .requiredOption('-s, --step-uuid <stepUuid>', 'UUID do step')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-u, --uuid\`: UUID do pipeline
- \`-s, --step-uuid\`: UUID do step

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-step --workspace my-company --repo my-project --uuid {pipeline-uuid} --step-uuid {step-uuid}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-step --workspace my-company --repo my-project --uuid {pipeline-uuid} --step-uuid {step-uuid} --output json
`
      )
      .action(async options => {
        await this.handleGetPipelineStep(options);
      });

    pipelineCommand
      .command('get-step-log')
      .description('Obtém log de um step do pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-u, --uuid <uuid>', 'UUID do pipeline')
      .requiredOption('-s, --step-uuid <stepUuid>', 'UUID do step')
      .option('-l, --log-uuid <logUuid>', 'UUID do log específico')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-u, --uuid\`: UUID do pipeline
- \`-s, --step-uuid\`: UUID do step

**Opções disponíveis:**
- \`-l, --log-uuid\`: UUID do log específico (opcional)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-step-log --workspace my-company --repo my-project --uuid {pipeline-uuid} --step-uuid {step-uuid}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-step-log --workspace my-company --repo my-project --uuid {pipeline-uuid} --step-uuid {step-uuid} --log-uuid {log-uuid}
`
      )
      .action(async options => {
        await this.handleGetPipelineStepLog(options);
      });

    // Pipeline Configuration
    pipelineCommand
      .command('get-config')
      .description('Obtém configuração de pipeline do repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-config --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-config --workspace my-company --repo my-project --output json
`
      )
      .action(async options => {
        await this.handleGetConfiguration(options);
      });

    pipelineCommand
      .command('update-config')
      .description('Atualiza configuração de pipeline do repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-e, --enabled <enabled>', 'Habilitar/desabilitar pipeline (true|false)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-e, --enabled\`: Habilitar/desabilitar pipeline (true|false)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-config --workspace my-company --repo my-project --enabled true
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-config --workspace my-company --repo my-project --enabled false --output json
`
      )
      .action(async options => {
        await this.handleUpdateConfiguration(options);
      });

    pipelineCommand
      .command('update-build-number')
      .description('Atualiza o próximo número de build')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --build-number <buildNumber>', 'Próximo número de build')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --build-number\`: Próximo número de build

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-build-number --workspace my-company --repo my-project --build-number 100
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-build-number --workspace my-company --repo my-project --build-number 200 --output json
`
      )
      .action(async options => {
        await this.handleUpdateBuildNumber(options);
      });

    // Pipeline Schedules
    pipelineCommand
      .command('list-schedules')
      .description('Lista agendamentos de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
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
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-schedules --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-schedules --workspace my-company --repo my-project --page 2 --limit 20
`
      )
      .action(async options => {
        await this.handleListSchedules(options);
      });

    pipelineCommand
      .command('create-schedule')
      .description('Cria um agendamento de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-t, --type <type>', 'Tipo de agendamento (daily, weekly, monthly)')
      .requiredOption('-c, --cron <cron>', 'Expressão cron')
      .option('-b, --branch <branch>', 'Branch para executar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-t, --type\`: Tipo de agendamento (daily, weekly, monthly)
- \`-c, --cron\`: Expressão cron

**Opções disponíveis:**
- \`-b, --branch\`: Branch para executar o pipeline
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline create-schedule --workspace my-company --repo my-project --type daily --cron "0 9 * * *"
  $ npx -y @guerchele/bitbucket-mcp-server pipeline create-schedule --workspace my-company --repo my-project --type weekly --cron "0 9 * * 1" --branch main
`
      )
      .action(async options => {
        await this.handleCreateSchedule(options);
      });

    // Pipeline Variables
    pipelineCommand
      .command('list-variables')
      .description('Lista variáveis de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-e, --environment <environment>', 'UUID do ambiente')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-e, --environment\`: UUID do ambiente
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-variables --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-variables --workspace my-company --repo my-project --environment {env-uuid}
`
      )
      .action(async options => {
        await this.handleListVariables(options);
      });

    pipelineCommand
      .command('create-variable')
      .description('Cria uma variável de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-k, --key <key>', 'Chave da variável')
      .requiredOption('-v, --value <value>', 'Valor da variável')
      .option('-e, --environment <environment>', 'UUID do ambiente')
      .option('-s, --secured <secured>', 'Variável segura (true|false)', 'false')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-k, --key\`: Chave da variável
- \`-v, --value\`: Valor da variável

**Opções disponíveis:**
- \`-e, --environment\`: UUID do ambiente
- \`-s, --secured\`: Variável segura (true|false) (padrão: false)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline create-variable --workspace my-company --repo my-project --key API_KEY --value "my-api-key"
  $ npx -y @guerchele/bitbucket-mcp-server pipeline create-variable --workspace my-company --repo my-project --key SECRET --value "secret-value" --secured true
`
      )
      .action(async options => {
        await this.handleCreateVariable(options);
      });

    // Pipeline Caches
    pipelineCommand
      .command('list-caches')
      .description('Lista caches de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-caches --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server pipeline list-caches --workspace my-company --repo my-project --output json
`
      )
      .action(async options => {
        await this.handleListCaches(options);
      });

    pipelineCommand
      .command('delete-caches')
      .description('Exclui todos os caches de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-caches --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-caches --workspace my-company --repo my-project --output json
`
      )
      .action(async options => {
        await this.handleDeleteCaches(options);
      });

    // Get schedule command
    pipelineCommand
      .command('get-schedule')
      .description('Obtém detalhes de um agendamento de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-s, --schedule-id <id>', 'ID do agendamento')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-s, --schedule-id\`: ID do agendamento

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-schedule --workspace my-company --repo my-project --schedule-id {schedule-id}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-schedule --workspace my-company --repo my-project --schedule-id {schedule-id} --output json
`
      )
      .action(async options => {
        await this.handleGetSchedule(options);
      });

    // Update schedule command
    pipelineCommand
      .command('update-schedule')
      .description('Atualiza um agendamento de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-s, --schedule-id <id>', 'ID do agendamento')
      .option('-t, --target <target>', 'Branch ou tag alvo')
      .option('-c, --cron <cron>', 'Expressão cron')
      .option('-e, --enabled <enabled>', 'Se o agendamento está ativo (true/false)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-s, --schedule-id\`: ID do agendamento

**Opções disponíveis:**
- \`-t, --target\`: Branch ou tag alvo
- \`-c, --cron\`: Expressão cron
- \`-e, --enabled\`: Se o agendamento está ativo (true/false)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-schedule --workspace my-company --repo my-project --schedule-id {schedule-id} --enabled false
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-schedule --workspace my-company --repo my-project --schedule-id {schedule-id} --cron "0 10 * * *" --target main
`
      )
      .action(async options => {
        await this.handleUpdateSchedule(options);
      });

    // Delete schedule command
    pipelineCommand
      .command('delete-schedule')
      .description('Exclui um agendamento de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-s, --schedule-id <id>', 'ID do agendamento')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-s, --schedule-id\`: ID do agendamento

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-schedule --workspace my-company --repo my-project --schedule-id {schedule-id}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-schedule --workspace my-company --repo my-project --schedule-id {schedule-id} --output json
`
      )
      .action(async options => {
        await this.handleDeleteSchedule(options);
      });

    // Get variable command
    pipelineCommand
      .command('get-variable')
      .description('Obtém detalhes de uma variável de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-v, --variable-id <id>', 'ID da variável')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-v, --variable-id\`: ID da variável

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-variable --workspace my-company --repo my-project --variable-id {variable-id}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-variable --workspace my-company --repo my-project --variable-id {variable-id} --output json
`
      )
      .action(async options => {
        await this.handleGetVariable(options);
      });

    // Update variable command
    pipelineCommand
      .command('update-variable')
      .description('Atualiza uma variável de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-v, --variable-id <id>', 'ID da variável')
      .option('-k, --key <key>', 'Chave da variável')
      .option('-val, --value <value>', 'Valor da variável')
      .option('-s, --secured <secured>', 'Se a variável é segura (true/false)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-v, --variable-id\`: ID da variável

**Opções disponíveis:**
- \`-k, --key\`: Chave da variável
- \`-val, --value\`: Valor da variável
- \`-s, --secured\`: Se a variável é segura (true/false)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-variable --workspace my-company --repo my-project --variable-id {variable-id} --value "new-value"
  $ npx -y @guerchele/bitbucket-mcp-server pipeline update-variable --workspace my-company --repo my-project --variable-id {variable-id} --secured true
`
      )
      .action(async options => {
        await this.handleUpdateVariable(options);
      });

    // Delete variable command
    pipelineCommand
      .command('delete-variable')
      .description('Exclui uma variável de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-v, --variable-id <id>', 'ID da variável')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-v, --variable-id\`: ID da variável

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-variable --workspace my-company --repo my-project --variable-id {variable-id}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-variable --workspace my-company --repo my-project --variable-id {variable-id} --output json
`
      )
      .action(async options => {
        await this.handleDeleteVariable(options);
      });

    // Delete cache command
    pipelineCommand
      .command('delete-cache')
      .description('Exclui um cache específico de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-c, --cache-id <id>', 'ID do cache')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-c, --cache-id\`: ID do cache

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-cache --workspace my-company --repo my-project --cache-id {cache-id}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline delete-cache --workspace my-company --repo my-project --cache-id {cache-id} --output json
`
      )
      .action(async options => {
        await this.handleDeleteCache(options);
      });

    // Get cache content URI command
    pipelineCommand
      .command('get-cache-uri')
      .description('Obtém URI de conteúdo de um cache de pipeline')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-c, --cache-id <id>', 'ID do cache')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-c, --cache-id\`: ID do cache

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-cache-uri --workspace my-company --repo my-project --cache-id {cache-id}
  $ npx -y @guerchele/bitbucket-mcp-server pipeline get-cache-uri --workspace my-company --repo my-project --cache-id {cache-id} --output json
`
      )
      .action(async options => {
        await this.handleGetCacheContentUri(options);
      });

    registerLogger.info('Successfully registered all cloud pipeline commands');
  }
}
