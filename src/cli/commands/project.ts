import { Command } from 'commander';
import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { BitbucketConfig } from '@/types/config';
import { assertPaginatedDataResponse, assertSingleDataResponse } from '@/integration/api-client';

export function createProjectCommands(): Command {
  const projectCommand = new Command('project');
  projectCommand.description('Project management commands (Data Center only)');

  // List projects command
  projectCommand
    .command('list')
    .description('List projects')
    .option('-u, --url <url>', 'Bitbucket server URL')
    .option('--limit <limit>', 'Maximum number of projects to return', '25')
    .option('--start <start>', 'Starting index for pagination', '0')
    .action(async options => {
      const logger = loggerService.getLogger('cli-project-list');

      try {
        logger.info('Listing projects', { options });

        if (!options.url) {
          throw new Error('Server URL is required');
        }

        const config: BitbucketConfig = {
          baseUrl: options.url,
          serverType: 'datacenter',
          auth: {
            type: 'basic',
            credentials: {
              username: 'dummy',
              password: 'dummy',
            },
          },
          timeouts: configService.getTimeoutConfig(),
          rateLimit: configService.getRateLimitConfig(),
        };

        const result = await bitbucketAPIService.get(config, '/rest/api/1.0/projects', {
          start: parseInt(options.start),
          limit: parseInt(options.limit),
        });

        if (result.success) {
          const projects = assertPaginatedDataResponse(result.data).data.values;
          console.log(`📁 Found ${projects.length} projects:`);
          projects.forEach((project: any) => {
            console.log(`  • ${project.name} (${project.key})`);
            if (project.description) {
              console.log(`    ${project.description}`);
            }
          });
        } else {
          console.error('❌ Failed to list projects:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Project list failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to list projects:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Get project command
  projectCommand
    .command('get')
    .description('Get project details')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-k, --key <key>', 'Project key')
    .action(async options => {
      const logger = loggerService.getLogger('cli-project-get');

      try {
        logger.info('Getting project details', { options });

        const config: BitbucketConfig = {
          baseUrl: options.url,
          serverType: 'datacenter',
          auth: {
            type: 'basic',
            credentials: {
              username: 'dummy',
              password: 'dummy',
            },
          },
          timeouts: configService.getTimeoutConfig(),
          rateLimit: configService.getRateLimitConfig(),
        };

        const result = await bitbucketAPIService.get(
          config,
          `/rest/api/1.0/projects/${options.key}`
        );

        if (result.success) {
          const project = assertSingleDataResponse(result.data).data;
          console.log(`📁 Project: ${(project as any).name}`);
          console.log(`   Key: ${(project as any).key}`);
          console.log(`   Description: ${(project as any).description || 'No description'}`);
          console.log(`   Public: ${(project as any).public ? 'Yes' : 'No'}`);
          console.log(`   Type: ${(project as any).type}`);
        } else {
          console.error('❌ Failed to get project:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Project get failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to get project:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Create project command
  projectCommand
    .command('create')
    .description('Create a new project')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-k, --key <key>', 'Project key')
    .requiredOption('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .action(async options => {
      const logger = loggerService.getLogger('cli-project-create');

      try {
        logger.info('Creating project', { options });

        const config: BitbucketConfig = {
          baseUrl: options.url,
          serverType: 'datacenter',
          auth: {
            type: 'basic',
            credentials: {
              username: 'dummy',
              password: 'dummy',
            },
          },
          timeouts: configService.getTimeoutConfig(),
          rateLimit: configService.getRateLimitConfig(),
        };

        const projectData = {
          key: options.key,
          name: options.name,
          description: options.description,
        };

        const result = await bitbucketAPIService.post(
          config,
          '/rest/api/1.0/projects',
          projectData
        );

        if (result.success) {
          const project = assertSingleDataResponse(result.data).data;
          console.log('✅ Project created successfully!');
          console.log(`   Name: ${(project as any).name}`);
          console.log(`   Key: ${(project as any).key}`);
        } else {
          console.error('❌ Failed to create project:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Project creation failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to create project:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Update project command
  projectCommand
    .command('update')
    .description('Update project details')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-k, --key <key>', 'Project key')
    .option('-n, --name <name>', 'New project name')
    .option('-d, --description <description>', 'New project description')
    .action(async options => {
      const logger = loggerService.getLogger('cli-project-update');

      try {
        logger.info('Updating project', { options });

        const config: BitbucketConfig = {
          baseUrl: options.url,
          serverType: 'datacenter',
          auth: {
            type: 'basic',
            credentials: {
              username: 'dummy',
              password: 'dummy',
            },
          },
          timeouts: configService.getTimeoutConfig(),
          rateLimit: configService.getRateLimitConfig(),
        };

        const projectData: any = {};
        if (options.name) projectData.name = options.name;
        if (options.description) projectData.description = options.description;

        const result = await bitbucketAPIService.put(
          config,
          `/rest/api/1.0/projects/${options.key}`,
          projectData
        );

        if (result.success) {
          const project = assertSingleDataResponse(result.data).data;
          console.log('✅ Project updated successfully!');
          console.log(`   Name: ${(project as any).name}`);
          console.log(`   Key: ${(project as any).key}`);
        } else {
          console.error('❌ Failed to update project:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Project update failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to update project:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Delete project command
  projectCommand
    .command('delete')
    .description('Delete a project')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-k, --key <key>', 'Project key')
    .option('--confirm', 'Confirm deletion without prompt', false)
    .action(async options => {
      const logger = loggerService.getLogger('cli-project-delete');

      try {
        logger.info('Deleting project', { options });

        if (!options.confirm) {
          console.log(`⚠️  Are you sure you want to delete project ${options.key}?`);
          console.log('Use --confirm flag to skip this prompt');
          return;
        }

        const config: BitbucketConfig = {
          baseUrl: options.url,
          serverType: 'datacenter',
          auth: {
            type: 'basic',
            credentials: {
              username: 'dummy',
              password: 'dummy',
            },
          },
          timeouts: configService.getTimeoutConfig(),
          rateLimit: configService.getRateLimitConfig(),
        };

        const result = await bitbucketAPIService.delete(
          config,
          `/rest/api/1.0/projects/${options.key}`
        );

        if (result.success) {
          console.log('✅ Project deleted successfully!');
        } else {
          console.error('❌ Failed to delete project:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Project deletion failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to delete project:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  return projectCommand;
}
