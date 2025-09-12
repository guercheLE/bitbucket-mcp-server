import { Command } from 'commander';
import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { BitbucketConfig } from '@/types/config';
import { assertPaginatedDataResponse, assertSingleDataResponse } from '@/integration/api-client';

export function createPullRequestCommands(): Command {
  const prCommand = new Command('pr');
  prCommand.description('Pull request management commands');

  // List pull requests command
  prCommand
    .command('list')
    .description('List pull requests')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-r, --repo <repo>', 'Repository slug')
    .option('--state <state>', 'Pull request state (OPEN, MERGED, DECLINED)', 'OPEN')
    .option('--limit <limit>', 'Maximum number of pull requests to return', '25')
    .option('--start <start>', 'Starting index for pagination', '0')
    .action(async options => {
      const logger = loggerService.getLogger('cli-pr-list');

      try {
        logger.info('Listing pull requests', { options });

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
          `/rest/api/1.0/projects/${options.project}/repos/${options.repo}/pull-requests`,
          {
            state: options.state,
            start: parseInt(options.start),
            limit: parseInt(options.limit),
          }
        );

        if (result.success) {
          const prs = assertPaginatedDataResponse(result.data).data.values;
          console.log(`📋 Found ${prs.length} pull requests:`);
          prs.forEach((pr: any) => {
            console.log(`  • #${pr.id}: ${pr.title}`);
            console.log(`    From: ${pr.fromRef.displayId} → To: ${pr.toRef.displayId}`);
            console.log(`    Author: ${pr.author.user.displayName}`);
            console.log(`    State: ${pr.state}`);
            console.log(`    Created: ${new Date(pr.createdDate).toLocaleDateString()}`);
            console.log('');
          });
        } else {
          console.error('❌ Failed to list pull requests:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Pull request list failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to list pull requests:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Get pull request command
  prCommand
    .command('get')
    .description('Get pull request details')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-r, --repo <repo>', 'Repository slug')
    .requiredOption('-i, --id <id>', 'Pull request ID')
    .action(async options => {
      const logger = loggerService.getLogger('cli-pr-get');

      try {
        logger.info('Getting pull request details', { options });

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
          `/rest/api/1.0/projects/${options.project}/repos/${options.repo}/pull-requests/${options.id}`
        );

        if (result.success) {
          const pr = assertSingleDataResponse(result.data).data;
          console.log(`📋 Pull Request #${(pr as any).id}: ${(pr as any).title}`);
          console.log(
            `   From: ${(pr as any).fromRef.displayId} → To: ${(pr as any).toRef.displayId}`
          );
          console.log(`   Author: ${(pr as any).author.user.displayName}`);
          console.log(`   State: ${(pr as any).state}`);
          console.log(`   Created: ${new Date((pr as any).createdDate).toLocaleDateString()}`);
          if ((pr as any).description) {
            console.log(`   Description: ${(pr as any).description}`);
          }
        } else {
          console.error('❌ Failed to get pull request:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Pull request get failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to get pull request:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Create pull request command
  prCommand
    .command('create')
    .description('Create a new pull request')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-r, --repo <repo>', 'Repository slug')
    .requiredOption('-t, --title <title>', 'Pull request title')
    .requiredOption('-f, --from <from>', 'Source branch')
    .requiredOption('-to, --to <to>', 'Target branch')
    .option('-d, --description <description>', 'Pull request description')
    .option('--reviewers <reviewers>', 'Comma-separated list of reviewers')
    .action(async options => {
      const logger = loggerService.getLogger('cli-pr-create');

      try {
        logger.info('Creating pull request', { options });

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

        const prData = {
          title: options.title,
          description: options.description,
          fromRef: {
            id: `refs/heads/${options.from}`,
            repository: {
              slug: options.repo,
              project: {
                key: options.project,
              },
            },
          },
          toRef: {
            id: `refs/heads/${options.to}`,
            repository: {
              slug: options.repo,
              project: {
                key: options.project,
              },
            },
          },
        };

        const result = await bitbucketAPIService.post(
          config,
          `/rest/api/1.0/projects/${options.project}/repos/${options.repo}/pull-requests`,
          prData
        );

        if (result.success) {
          const pr = assertSingleDataResponse(result.data).data;
          console.log('✅ Pull request created successfully!');
          console.log(`   ID: #${(pr as any).id}`);
          console.log(`   Title: ${(pr as any).title}`);
          console.log(
            `   From: ${(pr as any).fromRef.displayId} → To: ${(pr as any).toRef.displayId}`
          );
        } else {
          console.error('❌ Failed to create pull request:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Pull request creation failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to create pull request:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Merge pull request command
  prCommand
    .command('merge')
    .description('Merge a pull request')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-r, --repo <repo>', 'Repository slug')
    .requiredOption('-i, --id <id>', 'Pull request ID')
    .option('--strategy <strategy>', 'Merge strategy (no-ff, ff, squash)', 'no-ff')
    .action(async options => {
      const logger = loggerService.getLogger('cli-pr-merge');

      try {
        logger.info('Merging pull request', { options });

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

        const mergeData = {
          version: 1, // Would need to get actual version
        };

        const result = await bitbucketAPIService.post(
          config,
          `/rest/api/1.0/projects/${options.project}/repos/${options.repo}/pull-requests/${options.id}/merge`,
          mergeData
        );

        if (result.success) {
          console.log('✅ Pull request merged successfully!');
        } else {
          console.error('❌ Failed to merge pull request:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Pull request merge failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to merge pull request:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Decline pull request command
  prCommand
    .command('decline')
    .description('Decline a pull request')
    .requiredOption('-u, --url <url>', 'Bitbucket server URL')
    .requiredOption('-p, --project <project>', 'Project key')
    .requiredOption('-r, --repo <repo>', 'Repository slug')
    .requiredOption('-i, --id <id>', 'Pull request ID')
    .option('--reason <reason>', 'Reason for declining')
    .action(async options => {
      const logger = loggerService.getLogger('cli-pr-decline');

      try {
        logger.info('Declining pull request', { options });

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

        const declineData = {
          version: 1, // Would need to get actual version
          reason: options.reason,
        };

        const result = await bitbucketAPIService.post(
          config,
          `/rest/api/1.0/projects/${options.project}/repos/${options.repo}/pull-requests/${options.id}/decline`,
          declineData
        );

        if (result.success) {
          console.log('✅ Pull request declined successfully!');
        } else {
          console.error('❌ Failed to decline pull request:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Pull request decline failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Failed to decline pull request:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  return prCommand;
}
