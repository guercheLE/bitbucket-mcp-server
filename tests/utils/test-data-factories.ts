/**
 * Test Data Factories
 * 
 * Factories for generating consistent test objects with customizable properties
 */

/**
 * Test Data Factory Base Class
 */
abstract class TestDataFactory<T> {
    protected abstract getDefaultData(): Partial<T>;

    create(overrides: Partial<T> = {}): T {
        return { ...this.getDefaultData(), ...overrides } as T;
    }

    createMany(count: number, overrides: Partial<T> = {}): T[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }

    createSequence(count: number, iterateFn: (index: number) => Partial<T>): T[] {
        return Array.from({ length: count }, (_, index) =>
            this.create(iterateFn(index))
        );
    }
}

/**
 * Repository Factory
 */
export class RepositoryFactory extends TestDataFactory<any> {
    private static counter = 1;

    protected getDefaultData(): Partial<any> {
        const id = RepositoryFactory.counter++;
        return {
            type: 'repository',
            full_name: `testworkspace/test-repo-${id}`,
            name: `test-repo-${id}`,
            description: `Test repository ${id} for testing purposes`,
            scm: 'git',
            is_private: false,
            language: 'TypeScript',
            has_issues: true,
            has_wiki: false,
            size: Math.floor(Math.random() * 100000),
            owner: {
                type: 'user',
                username: 'testuser',
                display_name: 'Test User',
                uuid: `{test-uuid-${id}}`,
                account_id: `test-account-${id}`
            },
            workspace: {
                type: 'workspace',
                slug: 'testworkspace',
                name: 'Test Workspace',
                uuid: '{test-workspace-uuid}'
            },
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            clone_links: [
                {
                    name: 'https',
                    href: `https://bitbucket.org/testworkspace/test-repo-${id}.git`
                },
                {
                    name: 'ssh',
                    href: `git@bitbucket.org:testworkspace/test-repo-${id}.git`
                }
            ],
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/repositories/testworkspace/test-repo-${id}`
                },
                html: {
                    href: `https://bitbucket.org/testworkspace/test-repo-${id}`
                }
            }
        };
    }

    /**
     * Create a private repository
     */
    createPrivate(overrides: Partial<any> = {}) {
        return this.create({ is_private: true, ...overrides });
    }

    /**
     * Create a repository with specific language
     */
    createWithLanguage(language: string, overrides: Partial<any> = {}) {
        return this.create({ language, ...overrides });
    }
}

/**
 * Pull Request Factory
 */
export class PullRequestFactory extends TestDataFactory<any> {
    private static counter = 1;

    protected getDefaultData(): Partial<any> {
        const id = PullRequestFactory.counter++;
        return {
            type: 'pullrequest',
            id,
            title: `Pull Request ${id}`,
            description: `This is test pull request ${id}`,
            state: 'OPEN',
            author: {
                type: 'user',
                username: 'testuser',
                display_name: 'Test User',
                uuid: `{test-author-uuid-${id}}`,
                account_id: `test-author-${id}`
            },
            source: {
                branch: {
                    name: `feature/test-feature-${id}`
                },
                commit: {
                    hash: `abc123def${id.toString().padStart(3, '0')}`
                },
                repository: {
                    full_name: 'testworkspace/test-repo'
                }
            },
            destination: {
                branch: {
                    name: 'main'
                },
                commit: {
                    hash: `def456ghi${id.toString().padStart(3, '0')}`
                },
                repository: {
                    full_name: 'testworkspace/test-repo'
                }
            },
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            merge_commit: null,
            close_source_branch: true,
            closed_by: null,
            reviewers: [],
            participants: [],
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/repositories/testworkspace/test-repo/pullrequests/${id}`
                },
                html: {
                    href: `https://bitbucket.org/testworkspace/test-repo/pull-requests/${id}`
                }
            }
        };
    }

    /**
     * Create a merged pull request
     */
    createMerged(overrides: Partial<any> = {}) {
        return this.create({
            state: 'MERGED',
            merge_commit: {
                hash: 'merged123commit456'
            },
            ...overrides
        });
    }

    /**
     * Create a pull request with reviewers
     */
    createWithReviewers(reviewers: any[], overrides: Partial<any> = {}) {
        return this.create({ reviewers, ...overrides });
    }
}

/**
 * Issue Factory
 */
export class IssueFactory extends TestDataFactory<any> {
    private static counter = 1;

    protected getDefaultData(): Partial<any> {
        const id = IssueFactory.counter++;
        return {
            type: 'issue',
            id,
            title: `Issue ${id}`,
            content: {
                type: 'rendered',
                raw: `This is test issue ${id}`,
                markup: 'markdown',
                html: `<p>This is test issue ${id}</p>`
            },
            priority: 'major',
            kind: 'bug',
            state: 'new',
            milestone: null,
            component: null,
            version: null,
            assignee: {
                type: 'user',
                username: 'testuser',
                display_name: 'Test User',
                uuid: `{test-assignee-uuid-${id}}`,
                account_id: `test-assignee-${id}`
            },
            reporter: {
                type: 'user',
                username: 'testreporter',
                display_name: 'Test Reporter',
                uuid: `{test-reporter-uuid-${id}}`,
                account_id: `test-reporter-${id}`
            },
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            vote_count: 0,
            watch_count: 1,
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/repositories/testworkspace/test-repo/issues/${id}`
                },
                html: {
                    href: `https://bitbucket.org/testworkspace/test-repo/issues/${id}`
                }
            }
        };
    }

    /**
     * Create a feature request
     */
    createFeatureRequest(overrides: Partial<any> = {}) {
        return this.create({
            kind: 'enhancement',
            priority: 'minor',
            title: `Feature Request ${IssueFactory.counter}`,
            ...overrides
        });
    }

    /**
     * Create a critical bug
     */
    createCriticalBug(overrides: Partial<any> = {}) {
        return this.create({
            kind: 'bug',
            priority: 'critical',
            title: `Critical Bug ${IssueFactory.counter}`,
            ...overrides
        });
    }
}

/**
 * User Factory
 */
export class UserFactory extends TestDataFactory<any> {
    private static counter = 1;

    protected getDefaultData(): Partial<any> {
        const id = UserFactory.counter++;
        return {
            type: 'user',
            username: `testuser${id}`,
            display_name: `Test User ${id}`,
            uuid: `{test-user-uuid-${id}}`,
            account_id: `test-account-${id}`,
            nickname: `testuser${id}`,
            created_on: new Date().toISOString(),
            is_staff: false,
            account_status: 'active',
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/users/{test-user-uuid-${id}}`
                },
                html: {
                    href: `https://bitbucket.org/{test-user-uuid-${id}}/`
                }
            }
        };
    }

    /**
     * Create a staff user
     */
    createStaff(overrides: Partial<any> = {}) {
        return this.create({ is_staff: true, ...overrides });
    }
}

/**
 * Workspace Factory
 */
export class WorkspaceFactory extends TestDataFactory<any> {
    private static counter = 1;

    protected getDefaultData(): Partial<any> {
        const id = WorkspaceFactory.counter++;
        return {
            type: 'workspace',
            slug: `testworkspace${id}`,
            name: `Test Workspace ${id}`,
            is_private: false,
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/workspaces/testworkspace${id}`
                },
                html: {
                    href: `https://bitbucket.org/testworkspace${id}/`
                }
            }
        };
    }

    /**
     * Create a private workspace
     */
    createPrivate(overrides: Partial<any> = {}) {
        return this.create({ is_private: true, ...overrides });
    }
}

/**
 * MCP Tool Factory
 */
export class MCPToolFactory extends TestDataFactory<any> {
    private static counter = 1;

    protected getDefaultData(): Partial<any> {
        const id = MCPToolFactory.counter++;
        return {
            name: `test_tool_${id}`,
            description: `Test tool ${id} for testing purposes`,
            inputSchema: {
                type: 'object',
                properties: {
                    input: {
                        type: 'string',
                        description: 'Test input parameter'
                    }
                },
                required: ['input']
            }
        };
    }

    /**
     * Create a Bitbucket-specific tool
     */
    createBitbucketTool(operation: string, overrides: Partial<any> = {}) {
        return this.create({
            name: `bitbucket_${operation}`,
            description: `Bitbucket ${operation} operation`,
            ...overrides
        });
    }
}

/**
 * Test Factory Manager
 * Provides access to all factories and utility methods
 */
export class TestFactoryManager {
    static readonly repository = new RepositoryFactory();
    static readonly pullRequest = new PullRequestFactory();
    static readonly issue = new IssueFactory();
    static readonly user = new UserFactory();
    static readonly workspace = new WorkspaceFactory();
    static readonly mcpTool = new MCPToolFactory();

    /**
     * Reset all factory counters (useful for test isolation)
     */
    static resetCounters() {
        (RepositoryFactory as any).counter = 1;
        (PullRequestFactory as any).counter = 1;
        (IssueFactory as any).counter = 1;
        (UserFactory as any).counter = 1;
        (WorkspaceFactory as any).counter = 1;
        (MCPToolFactory as any).counter = 1;
    }

    /**
     * Create a complete test scenario with related objects
     */
    static createRepositoryScenario(options: {
        repositoryCount?: number;
        pullRequestCount?: number;
        issueCount?: number;
    } = {}) {
        const {
            repositoryCount = 1,
            pullRequestCount = 2,
            issueCount = 3
        } = options;

        const repositories = this.repository.createMany(repositoryCount);
        const pullRequests = this.pullRequest.createMany(pullRequestCount);
        const issues = this.issue.createMany(issueCount);

        return {
            repositories,
            pullRequests,
            issues,
            workspace: this.workspace.create(),
            users: [
                this.user.create({ username: 'author' }),
                this.user.create({ username: 'reviewer' }),
                this.user.create({ username: 'assignee' })
            ]
        };
    }
}

// Export factory manager as default
export default TestFactoryManager;