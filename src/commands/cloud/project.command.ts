import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ProjectService } from '../../services/cloud/project.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';

/**
 * Project Commands for Bitbucket Cloud CLI
 *
 * Provides command line interface for project operations including:
 * - Get project details
 * - Create/update/delete projects
 * - Manage default reviewers
 * - Manage project permissions
 */
export class CloudProjectCommands {
  private static logger = Logger.forContext('CloudProjectCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetProject(options: any): Promise<void> {
    try {
      this.logger.info(`Getting project: ${options.workspace}/${options.projectKey}`);
      const projectService = new ProjectService(new ApiClient());
      const result = await projectService.getProject({
        workspace: options.workspace,
        project_key: options.projectKey,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to get project:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleCreateProject(options: any): Promise<void> {
    try {
      this.logger.info(`Creating project: ${options.workspace}/${options.projectKey}`);
      const projectService = new ProjectService(new ApiClient());
      const projectData: any = {
        key: options.projectKey,
        name: options.name,
        description: options.description,
        is_private: options.isPrivate || false,
      };

      const result = await projectService.createProject({
        workspace: options.workspace,
        project: projectData,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to create project:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleUpdateProject(options: any): Promise<void> {
    try {
      this.logger.info(`Updating project: ${options.workspace}/${options.projectKey}`);
      const projectService = new ProjectService(new ApiClient());
      const projectData: any = {};

      if (options.name) projectData.name = options.name;
      if (options.description) projectData.description = options.description;
      if (options.isPrivate !== undefined) projectData.is_private = options.isPrivate;

      const result = await projectService.updateProject({
        workspace: options.workspace,
        project_key: options.projectKey,
        project: projectData,
      });
      const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to update project:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private static async handleDeleteProject(options: any): Promise<void> {
    try {
      this.logger.info(`Deleting project: ${options.workspace}/${options.projectKey}`);
      const projectService = new ProjectService(new ApiClient());
      await projectService.deleteProject({
        workspace: options.workspace,
        project_key: options.projectKey,
      });
      const mcpResponse = createMcpResponse(
        { message: 'Project deleted successfully' },
        options.output as 'markdown' | 'json'
      );
      console.log(mcpResponse.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Failed to delete project:', error);
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Register all project commands with the CLI program
   */
  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de projeto');

    const projectCommand = program
      .command('project')
      .description('Comandos de Projeto do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server project <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Get project command
    projectCommand
      .command('get')
      .description('Obtém detalhes de um projeto específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project get --workspace my-company --key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server project get --workspace my-company --key MOBILE --output json

**Descrição:**
  Obtém informações detalhadas de um projeto específico, incluindo
  metadados, configurações e permissões.`
      )
      .action(async options => {
        await this.handleGetProject(options);
      });

    // Create project command
    projectCommand
      .command('create')
      .description('Cria um novo projeto')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-n, --name <name>', 'Nome do projeto')
      .option('-d, --description <description>', 'Descrição do projeto')
      .option('--is-private', 'Projeto privado')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-n, --name\`: Nome do projeto

**Opções disponíveis:**
- \`-d, --description\`: Descrição do projeto
- \`--is-private\`: Projeto privado
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project create --workspace my-company --key MOBILE --name "Mobile App"
  $ npx -y @guerchele/bitbucket-mcp-server project create --workspace my-company --key MOBILE --name "Mobile App" --description "Mobile application project"
  $ npx -y @guerchele/bitbucket-mcp-server project create --workspace my-company --key MOBILE --name "Mobile App" --is-private

**Descrição:**
  Cria um novo projeto com as configurações especificadas.`
      )
      .action(async options => {
        await this.handleCreateProject(options);
      });

    // Update project command
    projectCommand
      .command('update')
      .description('Atualiza um projeto existente')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .option('-n, --name <name>', 'Nome do projeto')
      .option('-d, --description <description>', 'Descrição do projeto')
      .option('--is-private', 'Projeto privado')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto

**Opções disponíveis:**
- \`-n, --name\`: Nome do projeto
- \`-d, --description\`: Descrição do projeto
- \`--is-private\`: Projeto privado
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project update --workspace my-company --key MOBILE --name "Updated Mobile App"
  $ npx -y @guerchele/bitbucket-mcp-server project update --workspace my-company --key MOBILE --description "Updated description"
  $ npx -y @guerchele/bitbucket-mcp-server project update --workspace my-company --key MOBILE --is-private

**Descrição:**
  Atualiza um projeto existente com as configurações especificadas.`
      )
      .action(async options => {
        await this.handleUpdateProject(options);
      });

    // Delete project command
    projectCommand
      .command('delete')
      .description('Exclui um projeto')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project delete --workspace my-company --key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server project delete --workspace my-company --key MOBILE --output json

**Descrição:**
  Exclui um projeto permanentemente. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteProject(options);
      });

    // List default reviewers command
    projectCommand
      .command('list-default-reviewers')
      .description('Lista revisores padrão de um projeto')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project list-default-reviewers --workspace my-company --key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server project list-default-reviewers --workspace my-company --key MOBILE --page 2
  $ npx -y @guerchele/bitbucket-mcp-server project list-default-reviewers --workspace my-company --key MOBILE --output json

**Descrição:**
  Lista os revisores padrão configurados para um projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing default reviewers: ${options.projectKey}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.listDefaultReviewers({
            workspace: options.workspace,
            project_key: options.projectKey,
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list default reviewers:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Add default reviewer command
    projectCommand
      .command('add-default-reviewer')
      .description('Adiciona um revisor padrão ao projeto')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-u, --user <user>', 'Usuário a ser adicionado como revisor padrão')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-u, --user\`: Usuário a ser adicionado como revisor padrão

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project add-default-reviewer --workspace my-company --key MOBILE --user john.doe
  $ npx -y @guerchele/bitbucket-mcp-server project add-default-reviewer --workspace my-company --key MOBILE --user john.doe --output json

**Descrição:**
  Adiciona um usuário como revisor padrão para o projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(
            `Adding default reviewer: ${options.user} to project ${options.projectKey}`
          );
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.addDefaultReviewer({
            workspace: options.workspace,
            project_key: options.projectKey,
            selected_user: options.user,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to add default reviewer:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Remove default reviewer command
    projectCommand
      .command('remove-default-reviewer')
      .description('Remove um revisor padrão do projeto')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-u, --user <user>', 'Usuário a ser removido dos revisores padrão')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-u, --user\`: Usuário a ser removido dos revisores padrão

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project remove-default-reviewer --workspace my-company --key MOBILE --user john.doe
  $ npx -y @guerchele/bitbucket-mcp-server project remove-default-reviewer --workspace my-company --key MOBILE --user john.doe --output json

**Descrição:**
  Remove um usuário dos revisores padrão do projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(
            `Removing default reviewer: ${options.user} from project ${options.projectKey}`
          );
          const projectService = new ProjectService(new ApiClient());
          await projectService.removeDefaultReviewer({
            workspace: options.workspace,
            project_key: options.projectKey,
            selected_user: options.user,
          });
          const mcpResponse = createMcpResponse(
            { message: 'Default reviewer removed successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to remove default reviewer:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get default reviewer command
    projectCommand
      .command('get-default-reviewer')
      .description('Obtém detalhes de um revisor padrão específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-u, --username <username>', 'Nome de usuário do revisor')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-u, --username\`: Nome de usuário do revisor

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project get-default-reviewer --workspace my-company --key MOBILE --username john.doe
  $ npx -y @guerchele/bitbucket-mcp-server project get-default-reviewer --workspace my-company --key MOBILE --username john.doe --output json

**Descrição:**
  Obtém informações detalhadas de um revisor padrão específico do projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting default reviewer: ${options.username}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.getDefaultReviewer({
            workspace: options.workspace,
            project_key: options.projectKey,
            selected_user: options.username,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get default reviewer:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List group permissions command
    projectCommand
      .command('list-group-permissions')
      .description('Lista permissões de grupos do projeto')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project list-group-permissions --workspace my-company --key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server project list-group-permissions --workspace my-company --key MOBILE --page 2
  $ npx -y @guerchele/bitbucket-mcp-server project list-group-permissions --workspace my-company --key MOBILE --output json

**Descrição:**
  Lista todas as permissões de grupos configuradas para o projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing group permissions for project: ${options.projectKey}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.listGroupPermissions({
            workspace: options.workspace,
            project_key: options.projectKey,
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list group permissions:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get group permission command
    projectCommand
      .command('get-group-permission')
      .description('Obtém permissão de um grupo específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-g, --group-slug <slug>', 'Slug do grupo')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-g, --group-slug\`: Slug do grupo

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project get-group-permission --workspace my-company --key MOBILE --group-slug developers
  $ npx -y @guerchele/bitbucket-mcp-server project get-group-permission --workspace my-company --key MOBILE --group-slug developers --output json

**Descrição:**
  Obtém informações detalhadas da permissão de um grupo específico no projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting group permission: ${options.groupSlug}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.getGroupPermission({
            workspace: options.workspace,
            project_key: options.projectKey,
            group_slug: options.groupSlug,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get group permission:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Update group permission command
    projectCommand
      .command('update-group-permission')
      .description('Atualiza permissão de um grupo')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-g, --group-slug <slug>', 'Slug do grupo')
      .requiredOption('-p, --permission <permission>', 'Permissão (read, write, admin)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-g, --group-slug\`: Slug do grupo
- \`-p, --permission\`: Permissão (read, write, admin)

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project update-group-permission --workspace my-company --key MOBILE --group-slug developers --permission write
  $ npx -y @guerchele/bitbucket-mcp-server project update-group-permission --workspace my-company --key MOBILE --group-slug developers --permission admin --output json

**Descrição:**
  Atualiza a permissão de um grupo específico no projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Updating group permission: ${options.groupSlug}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.updateGroupPermission({
            workspace: options.workspace,
            project_key: options.projectKey,
            group_slug: options.groupSlug,
            permission: options.permission,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to update group permission:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Delete group permission command
    projectCommand
      .command('delete-group-permission')
      .description('Remove permissão de um grupo')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-g, --group-slug <slug>', 'Slug do grupo')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-g, --group-slug\`: Slug do grupo

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project delete-group-permission --workspace my-company --key MOBILE --group-slug developers
  $ npx -y @guerchele/bitbucket-mcp-server project delete-group-permission --workspace my-company --key MOBILE --group-slug developers --output json

**Descrição:**
  Remove a permissão de um grupo específico do projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting group permission: ${options.groupSlug}`);
          const projectService = new ProjectService(new ApiClient());
          await projectService.deleteGroupPermission({
            workspace: options.workspace,
            project_key: options.projectKey,
            group_slug: options.groupSlug,
          });
          const mcpResponse = createMcpResponse(
            { message: 'Group permission deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete group permission:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // List user permissions command
    projectCommand
      .command('list-user-permissions')
      .description('Lista permissões de usuários do projeto')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .option('-p, --page <number>', 'Número da página')
      .option('--pagelen <number>', 'Tamanho da página')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto

**Opções disponíveis:**
- \`-p, --page\`: Número da página
- \`--pagelen\`: Tamanho da página
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project list-user-permissions --workspace my-company --key MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server project list-user-permissions --workspace my-company --key MOBILE --page 2
  $ npx -y @guerchele/bitbucket-mcp-server project list-user-permissions --workspace my-company --key MOBILE --output json

**Descrição:**
  Lista todas as permissões de usuários configuradas para o projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Listing user permissions for project: ${options.projectKey}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.listUserPermissions({
            workspace: options.workspace,
            project_key: options.projectKey,
            page: options.page ? parseInt(options.page) : undefined,
            pagelen: options.pagelen ? parseInt(options.pagelen) : undefined,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to list user permissions:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Get user permission command
    projectCommand
      .command('get-user-permission')
      .description('Obtém permissão de um usuário específico')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-u, --username <username>', 'Nome de usuário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-u, --username\`: Nome de usuário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project get-user-permission --workspace my-company --key MOBILE --username john.doe
  $ npx -y @guerchele/bitbucket-mcp-server project get-user-permission --workspace my-company --key MOBILE --username john.doe --output json

**Descrição:**
  Obtém informações detalhadas da permissão de um usuário específico no projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Getting user permission: ${options.username}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.getUserPermission({
            workspace: options.workspace,
            project_key: options.projectKey,
            selected_user_id: options.username,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to get user permission:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Update user permission command
    projectCommand
      .command('update-user-permission')
      .description('Atualiza permissão de um usuário')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-u, --username <username>', 'Nome de usuário')
      .requiredOption('-p, --permission <permission>', 'Permissão (read, write, admin)')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-u, --username\`: Nome de usuário
- \`-p, --permission\`: Permissão (read, write, admin)

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project update-user-permission --workspace my-company --key MOBILE --username john.doe --permission write
  $ npx -y @guerchele/bitbucket-mcp-server project update-user-permission --workspace my-company --key MOBILE --username john.doe --permission admin --output json

**Descrição:**
  Atualiza a permissão de um usuário específico no projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Updating user permission: ${options.username}`);
          const projectService = new ProjectService(new ApiClient());
          const result = await projectService.updateUserPermission({
            workspace: options.workspace,
            project_key: options.projectKey,
            selected_user_id: options.username,
            permission: options.permission,
          });
          const mcpResponse = createMcpResponse(result, options.output as 'markdown' | 'json');
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to update user permission:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Delete user permission command
    projectCommand
      .command('delete-user-permission')
      .description('Remove permissão de um usuário')
      .requiredOption('-w, --workspace <workspace>', 'Slug do workspace')
      .requiredOption('-k, --key <key>', 'Chave do projeto')
      .requiredOption('-u, --username <username>', 'Nome de usuário')
      .option('--output <format>', 'Formato de saída (markdown ou json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Slug do workspace
- \`-k, --key\`: Chave do projeto
- \`-u, --username\`: Nome de usuário

**Opções disponíveis:**
- \`--output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server project delete-user-permission --workspace my-company --key MOBILE --username john.doe
  $ npx -y @guerchele/bitbucket-mcp-server project delete-user-permission --workspace my-company --key MOBILE --username john.doe --output json

**Descrição:**
  Remove a permissão de um usuário específico do projeto.`
      )
      .action(async options => {
        try {
          this.logger.info(`Deleting user permission: ${options.username}`);
          const projectService = new ProjectService(new ApiClient());
          await projectService.deleteUserPermission({
            workspace: options.workspace,
            project_key: options.projectKey,
            selected_user_id: options.username,
          });
          const mcpResponse = createMcpResponse(
            { message: 'User permission deleted successfully' },
            options.output as 'markdown' | 'json'
          );
          console.log(mcpResponse.content[0]?.text || '');
        } catch (error) {
          this.logger.error('Failed to delete user permission:', error);
          console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    registerLogger.info('Successfully registered all cloud project commands');
  }
}
