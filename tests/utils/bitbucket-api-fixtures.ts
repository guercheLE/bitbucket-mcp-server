/**
 * Bitbucket API Response Fixtures
 * 
 * Mock responses for Bitbucket Cloud and Data Center APIs
 */

/**
 * Common Bitbucket API response structure
 */
interface BitbucketPagedResponse<T> {
    size: number;
    page: number;
    pagelen: number;
    next?: string;
    previous?: string;
    values: T[];
}

/**
 * Repository fixtures
 */
export const BitbucketRepositoryFixtures = {
    /**
     * Sample repository object
     */
    sampleRepository: {
        type: 'repository',
        full_name: 'testworkspace/sample-repo',
        name: 'sample-repo',
        description: 'A sample repository for testing',
        scm: 'git',
        website: null,
        owner: {
            type: 'user',
            username: 'testuser',
            display_name: 'Test User',
            uuid: '{12345678-1234-1234-1234-123456789abc}',
            account_id: '123456:test-account-id'
        },
        workspace: {
            type: 'workspace',
            slug: 'testworkspace',
            name: 'Test Workspace',
            uuid: '{87654321-4321-4321-4321-cba987654321}'
        },
        is_private: false,
        created_on: '2023-01-01T00:00:00.000000+00:00',
        updated_on: '2024-01-01T00:00:00.000000+00:00',
        size: 12345,
        language: 'TypeScript',
        has_issues: true,
        has_wiki: false,
        clone_links: [
            {
                name: 'https',
                href: 'https://bitbucket.org/testworkspace/sample-repo.git'
            },
            {
                name: 'ssh',
                href: 'git@bitbucket.org:testworkspace/sample-repo.git'
            }
        ],
        links: {
            self: {
                href: 'https://api.bitbucket.org/2.0/repositories/testworkspace/sample-repo'
            },
            html: {
                href: 'https://bitbucket.org/testworkspace/sample-repo'
            }
        }
    },

    /**
     * Repository list response
     */
    repositoryListResponse: {
        size: 3,
        page: 1,
        pagelen: 10,
        values: [
            {
                type: 'repository',
                full_name: 'testworkspace/sample-repo-1',
                name: 'sample-repo-1',
                description: 'First sample repository',
                is_private: false,
                language: 'TypeScript'
            },
            {
                type: 'repository',
                full_name: 'testworkspace/sample-repo-2',
                name: 'sample-repo-2',
                description: 'Second sample repository',
                is_private: true,
                language: 'JavaScript'
            },
            {
                type: 'repository',
                full_name: 'testworkspace/sample-repo-3',
                name: 'sample-repo-3',
                description: 'Third sample repository',
                is_private: false,
                language: 'Python'
            }
        ]
    } as BitbucketPagedResponse<any>
};

/**
 * Pull Request fixtures
 */
export const BitbucketPullRequestFixtures = {
    /**
     * Sample pull request object
     */
    samplePullRequest: {
        type: 'pullrequest',
        id: 1,
        title: 'Add new feature',
        description: 'This pull request adds a new feature to the application.',
        state: 'OPEN',
        author: {
            type: 'user',
            username: 'testuser',
            display_name: 'Test User',
            uuid: '{12345678-1234-1234-1234-123456789abc}',
            account_id: '123456:test-account-id'
        },
        source: {
            branch: {
                name: 'feature/new-feature'
            },
            commit: {
                hash: 'abc123def456'
            },
            repository: {
                full_name: 'testworkspace/sample-repo'
            }
        },
        destination: {
            branch: {
                name: 'main'
            },
            commit: {
                hash: 'def456ghi789'
            },
            repository: {
                full_name: 'testworkspace/sample-repo'
            }
        },
        created_on: '2024-01-01T00:00:00.000000+00:00',
        updated_on: '2024-01-02T00:00:00.000000+00:00',
        merge_commit: null,
        close_source_branch: true,
        closed_by: null,
        reviewers: [],
        participants: [],
        links: {
            self: {
                href: 'https://api.bitbucket.org/2.0/repositories/testworkspace/sample-repo/pullrequests/1'
            },
            html: {
                href: 'https://bitbucket.org/testworkspace/sample-repo/pull-requests/1'
            }
        }
    },

    /**
     * Pull request list response
     */
    pullRequestListResponse: {
        size: 2,
        page: 1,
        pagelen: 10,
        values: [
            {
                type: 'pullrequest',
                id: 1,
                title: 'Add new feature',
                state: 'OPEN',
                author: {
                    username: 'testuser',
                    display_name: 'Test User'
                },
                source: {
                    branch: {
                        name: 'feature/new-feature'
                    }
                },
                destination: {
                    branch: {
                        name: 'main'
                    }
                }
            },
            {
                type: 'pullrequest',
                id: 2,
                title: 'Fix bug in authentication',
                state: 'MERGED',
                author: {
                    username: 'testuser2',
                    display_name: 'Test User 2'
                },
                source: {
                    branch: {
                        name: 'bugfix/auth-issue'
                    }
                },
                destination: {
                    branch: {
                        name: 'main'
                    }
                }
            }
        ]
    } as BitbucketPagedResponse<any>
};

/**
 * Issue fixtures
 */
export const BitbucketIssueFixtures = {
    /**
     * Sample issue object
     */
    sampleIssue: {
        type: 'issue',
        id: 1,
        title: 'Bug in user authentication',
        content: {
            type: 'rendered',
            raw: 'Users are unable to log in with their credentials.',
            markup: 'markdown',
            html: '<p>Users are unable to log in with their credentials.</p>'
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
            uuid: '{12345678-1234-1234-1234-123456789abc}',
            account_id: '123456:test-account-id'
        },
        reporter: {
            type: 'user',
            username: 'reporter',
            display_name: 'Bug Reporter',
            uuid: '{87654321-4321-4321-4321-cba987654321}',
            account_id: '654321:reporter-account-id'
        },
        created_on: '2024-01-01T00:00:00.000000+00:00',
        updated_on: '2024-01-02T00:00:00.000000+00:00',
        vote_count: 0,
        watch_count: 1,
        links: {
            self: {
                href: 'https://api.bitbucket.org/2.0/repositories/testworkspace/sample-repo/issues/1'
            },
            html: {
                href: 'https://bitbucket.org/testworkspace/sample-repo/issues/1'
            }
        }
    },

    /**
     * Issue list response
     */
    issueListResponse: {
        size: 2,
        page: 1,
        pagelen: 10,
        values: [
            {
                type: 'issue',
                id: 1,
                title: 'Bug in user authentication',
                priority: 'major',
                kind: 'bug',
                state: 'new',
                assignee: {
                    username: 'testuser',
                    display_name: 'Test User'
                }
            },
            {
                type: 'issue',
                id: 2,
                title: 'Feature request: Dark mode',
                priority: 'minor',
                kind: 'enhancement',
                state: 'open',
                assignee: null
            }
        ]
    } as BitbucketPagedResponse<any>
};

/**
 * Workspace fixtures
 */
export const BitbucketWorkspaceFixtures = {
    /**
     * Sample workspace object
     */
    sampleWorkspace: {
        type: 'workspace',
        slug: 'testworkspace',
        name: 'Test Workspace',
        is_private: false,
        created_on: '2023-01-01T00:00:00.000000+00:00',
        updated_on: '2024-01-01T00:00:00.000000+00:00',
        links: {
            self: {
                href: 'https://api.bitbucket.org/2.0/workspaces/testworkspace'
            },
            html: {
                href: 'https://bitbucket.org/testworkspace/'
            }
        }
    },

    /**
     * Workspace list response
     */
    workspaceListResponse: {
        size: 2,
        page: 1,
        pagelen: 10,
        values: [
            {
                type: 'workspace',
                slug: 'testworkspace',
                name: 'Test Workspace',
                is_private: false
            },
            {
                type: 'workspace',
                slug: 'privateworkspace',
                name: 'Private Workspace',
                is_private: true
            }
        ]
    } as BitbucketPagedResponse<any>
};

/**
 * Pipeline fixtures
 */
export const BitbucketPipelineFixtures = {
    /**
     * Sample pipeline object
     */
    samplePipeline: {
        type: 'pipeline',
        uuid: '{12345678-1234-1234-1234-123456789abc}',
        build_number: 123,
        creator: {
            type: 'user',
            username: 'testuser',
            display_name: 'Test User'
        },
        repository: {
            type: 'repository',
            full_name: 'testworkspace/sample-repo',
            name: 'sample-repo'
        },
        target: {
            type: 'pipeline_ref_target',
            ref_type: 'branch',
            ref_name: 'main',
            selector: {
                type: 'branches',
                pattern: 'main'
            }
        },
        trigger: {
            type: 'pipeline_trigger_push',
            name: 'PUSH'
        },
        state: {
            type: 'pipeline_state_completed',
            name: 'COMPLETED',
            result: {
                type: 'pipeline_state_completed_successful',
                name: 'SUCCESSFUL'
            }
        },
        created_on: '2024-01-01T00:00:00.000000+00:00',
        completed_on: '2024-01-01T00:05:00.000000+00:00',
        run_number: 123,
        duration_in_seconds: 300,
        build_seconds_used: 300,
        first_successful: false,
        expired: false,
        links: {
            self: {
                href: 'https://api.bitbucket.org/2.0/repositories/testworkspace/sample-repo/pipelines/12345678-1234-1234-1234-123456789abc'
            }
        }
    }
};

/**
 * Error response fixtures
 */
export const BitbucketErrorFixtures = {
    /**
     * 401 Unauthorized error
     */
    unauthorizedError: {
        type: 'error',
        error: {
            message: 'Access token expired. Use your refresh token to obtain a new access token.',
            detail: 'The access token provided is expired, revoked, malformed, or invalid for other reasons.'
        }
    },

    /**
     * 403 Forbidden error
     */
    forbiddenError: {
        type: 'error',
        error: {
            message: 'You don\'t have the required permissions for this resource.',
            detail: 'Your account does not have access to this resource.'
        }
    },

    /**
     * 404 Not Found error
     */
    notFoundError: {
        type: 'error',
        error: {
            message: 'Repository testworkspace/nonexistent does not exist or you do not have access.',
            detail: 'There is no API resource at this path, or you lack the credentials to access it.'
        }
    },

    /**
     * 429 Rate Limit error
     */
    rateLimitError: {
        type: 'error',
        error: {
            message: 'Rate limit exceeded. Try again later.',
            detail: 'You have exceeded the rate limit for API requests. Please wait before making more requests.'
        }
    }
};

/**
 * API Response Factory
 */
export class BitbucketAPIResponseFactory {
    /**
     * Create a paginated response
     */
    static createPagedResponse<T>(
        items: T[],
        page: number = 1,
        pagelen: number = 10,
        totalSize?: number
    ): BitbucketPagedResponse<T> {
        const size = totalSize || items.length;
        const startIndex = (page - 1) * pagelen;
        const endIndex = Math.min(startIndex + pagelen, items.length);
        const values = items.slice(startIndex, endIndex);

        const response: BitbucketPagedResponse<T> = {
            size,
            page,
            pagelen,
            values
        };

        // Add pagination links
        if (endIndex < items.length) {
            response.next = `?page=${page + 1}&pagelen=${pagelen}`;
        }
        if (page > 1) {
            response.previous = `?page=${page - 1}&pagelen=${pagelen}`;
        }

        return response;
    }

    /**
     * Create an error response
     */
    static createErrorResponse(
        statusCode: number,
        message: string,
        detail?: string
    ) {
        return {
            statusCode,
            body: {
                type: 'error',
                error: {
                    message,
                    detail: detail || message
                }
            }
        };
    }

    /**
     * Create a mock HTTP response
     */
    static createMockResponse(
        statusCode: number,
        body: any,
        headers: Record<string, string> = {}
    ) {
        return {
            status: statusCode,
            statusText: statusCode === 200 ? 'OK' : 'Error',
            headers: {
                'content-type': 'application/json',
                ...headers
            },
            data: body,
            json: () => Promise.resolve(body),
            text: () => Promise.resolve(JSON.stringify(body))
        };
    }
}

export default {
    BitbucketRepositoryFixtures,
    BitbucketPullRequestFixtures,
    BitbucketIssueFixtures,
    BitbucketWorkspaceFixtures,
    BitbucketPipelineFixtures,
    BitbucketErrorFixtures,
    BitbucketAPIResponseFactory
};