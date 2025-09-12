import { Command } from 'commander';
import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { BitbucketConfig } from '@/types/config';
import { assertPaginatedDataResponse, assertSingleDataResponse } from '@/integration/api-client';

export function createRepositoryCommands(): Command {
  const repoCommand = new Command('repo');
  repoCommand.description('Repository management commands');

  // List repositories command
  repoCommand
    .command('list')
    .description('List repositories')
    .option('-u, --url <url>', 'Bitbucket server URL')
    .option('-p, --project <project>', 'Project key (Data Center only)')
    .option('-w, --workspace <workspace>', 'Workspace (Cloud only)')
    .option('--limit <limit>', 'Maximum number of repositories to return', '25')
    .option('--start <start>', 'Starting index for pagination', '0')
    .action(async options => {
      const logger = loggerService.getLogger('cli-repo-list');

      try {
        logger.info('Listing repositories', { options });

        if (!options.url) {
          throw new Error('Server URL is required');
        }

        // Build config (simplified for CLI)
        const config: BitbucketConfig = {
          baseUrl: options.url,
          serverType: 'datacenter', // Would be detected in real implementation
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

        // Make API call
        const endpoint = options.project
          ? `/rest/api/1.0/projects/${options.project}/repos`
          : '/rest/api/1.0/repos';

        const result = await bitbucketAPIService.get(config, endpoint, {
          start: parseInt(options.start),
          limit: parseInt(options.limit),
        });

        if (result.success) {
          const repos = assertPaginatedDataResponse(result.data).data.values;
          console.log(`📁 Found ${repos.length} repositories:`);
          repos.forEach((repo: any) => {
            console.log(`  • ${repo.name} (${repo.slug})`);
            if (repo.description) {
              console.log(`    ${repo.description}`);
            }
          });
        } else {
          console.error('❌ Failed to list repositories:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Repository list failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to list repositories:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Get repository command
  repoCommand
    .command('get')
    .description('Get repository details')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-r, --repo <repo>', 'Repository slug')
    .action(async options => {
      const logger = loggerService.getLogger('cli-repo-get');

      try {
        logger.info('Getting repository details', { options });

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
          `/rest/api/1.0/projects/${options.project}/repos/${options.repo}`
        );

        if (result.success) {
          const repo = assertSingleDataResponse(result.data).data;
          console.log(`📁 Repository: ${(repo as any).name}`);
          console.log(`   Slug: ${(repo as any).slug}`);
          console.log(`   Project: ${(repo as any).project?.key}`);
          console.log(`   Description: ${(repo as any).description || 'No description'}`);
          console.log(`   Public: ${(repo as any).public ? 'Yes' : 'No'}`);
          console.log(`   Created: ${new Date((repo as any).createdOn).toLocaleDateString()}`);
        } else {
          console.error('❌ Failed to get repository:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Repository get failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to get repository:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Create repository command
  repoCommand
    .command('create')
    .description('Create a new repository')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-n, --name <name>', 'Repository name')
    .option('-d, --description <description>', 'Repository description')
    .option('--public', 'Make repository public', false)
    .action(async options => {
      const logger = loggerService.getLogger('cli-repo-create');

      try {
        logger.info('Creating repository', { options });

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

        const repoData = {
          name: options.name,
          scmId: 'git',
          forkable: true,
          public: options.public,
          description: options.description,
        };

        const result = await bitbucketAPIService.post(
          config,
          `/rest/api/1.0/projects/${options.project}/repos`,
          repoData
        );

        if (result.success) {
          const repo = assertSingleDataResponse(result.data).data;
          console.log('✅ Repository created successfully!');
          console.log(`   Name: ${(repo as any).name}`);
          console.log(`   Slug: ${(repo as any).slug}`);
          console.log(`   Project: ${(repo as any).project?.key}`);
        } else {
          console.error('❌ Failed to create repository:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Repository creation failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to create repository:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Delete repository command
  repoCommand
    .command('delete')
    .description('Delete a repository')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-r, --repo <repo>', 'Repository slug')
    .option('--confirm', 'Confirm deletion without prompt', false)
    .action(async options => {
      const logger = loggerService.getLogger('cli-repo-delete');

      try {
        logger.info('Deleting repository', { options });

        if (!options.confirm) {
          console.log(
            `⚠️  Are you sure you want to delete repository ${options.project}/${options.repo}?`
          );
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
          `/rest/api/1.0/projects/${options.project}/repos/${options.repo}`
        );

        if (result.success) {
          console.log('✅ Repository deleted successfully!');
        } else {
          console.error('❌ Failed to delete repository:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Repository deletion failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to delete repository:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  return repoCommand;
}
