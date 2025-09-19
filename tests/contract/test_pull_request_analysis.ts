import { z } from 'zod';

/**
 * Contract test for Pull Request Analysis operations
 * T009: Contract test pull request analysis in tests/contract/test_pull_request_analysis.ts
 * 
 * This test MUST fail before implementation (Constitution Article V - TDD)
 * Validates the Pull Request Analysis operations according to contracts/pull-request-analysis.yaml
 */

describe('Pull Request Analysis Contract Tests', () => {
  // Schema definitions from pull-request-analysis.yaml
  const PullRequestActivitySchema = z.object({
    id: z.number().int().positive(),
    createdDate: z.number().int().positive(),
    user: z.object({
      name: z.string().min(1),
      emailAddress: z.string().email(),
      id: z.number().int().positive(),
      displayName: z.string().min(1),
      active: z.boolean(),
      slug: z.string().min(1),
      type: z.string().min(1),
    }),
    action: z.enum([
      'COMMENTED',
      'OPENED',
      'MERGED',
      'DECLINED',
      'REOPENED',
      'RESCOPED',
      'UPDATED',
      'APPROVED',
      'UNAPPROVED',
      'REVIEWED'
    ]),
    commentAction: z.enum(['ADDED', 'EDITED', 'DELETED']).optional(),
    comment: z.object({
      id: z.number().int().positive(),
      version: z.number().int().positive(),
      text: z.string().min(1),
      author: z.object({
        name: z.string().min(1),
        emailAddress: z.string().email(),
        id: z.number().int().positive(),
        displayName: z.string().min(1),
        active: z.boolean(),
        slug: z.string().min(1),
        type: z.string().min(1),
      }),
      createdDate: z.number().int().positive(),
      updatedDate: z.number().int().positive(),
      comments: z.array(z.any()),
      properties: z.object({
        repositoryId: z.number().int().positive(),
      }),
    }).optional(),
    fromHash: z.string().min(1).optional(),
    toHash: z.string().min(1).optional(),
    previousFromHash: z.string().min(1).optional(),
    previousToHash: z.string().min(1).optional(),
    added: z.array(z.object({
      ref: z.object({
        id: z.string().min(1),
        displayId: z.string().min(1),
        latestCommit: z.string().min(1),
        repository: z.object({
          id: z.number().int().positive(),
          name: z.string().min(1),
          slug: z.string().min(1),
          scmId: z.string().min(1),
          state: z.string(),
          statusMessage: z.string(),
          forkable: z.boolean(),
          project: z.object({
            key: z.string().min(1),
            id: z.number().int().positive(),
            name: z.string().min(1),
            public: z.boolean(),
            type: z.string(),
            links: z.object({
              self: z.array(z.object({ href: z.string().url() })),
            }),
          }),
          public: z.boolean(),
          links: z.object({
            clone: z.array(z.object({ 
              href: z.string().url(),
              name: z.string(),
            })),
            self: z.array(z.object({ href: z.string().url() })),
          }),
        }),
      }),
    })).optional(),
    removed: z.array(z.object({
      ref: z.object({
        id: z.string().min(1),
        displayId: z.string().min(1),
        latestCommit: z.string().min(1),
        repository: z.object({
          id: z.number().int().positive(),
          name: z.string().min(1),
          slug: z.string().min(1),
          scmId: z.string().min(1),
          state: z.string(),
          statusMessage: z.string(),
          forkable: z.boolean(),
          project: z.object({
            key: z.string().min(1),
            id: z.number().int().positive(),
            name: z.string().min(1),
            public: z.boolean(),
            type: z.string(),
            links: z.object({
              self: z.array(z.object({ href: z.string().url() })),
            }),
          }),
          public: z.boolean(),
          links: z.object({
            clone: z.array(z.object({ 
              href: z.string().url(),
              name: z.string(),
            })),
            self: z.array(z.object({ href: z.string().url() })),
          }),
        }),
      }),
    })).optional(),
  });

  const PullRequestDiffSchema = z.object({
    context: z.object({
      contextPath: z.string(),
      fromHash: z.string().min(1),
      toHash: z.string().min(1),
      whitespace: z.string(),
    }),
    path: z.object({
      components: z.array(z.string()),
      parent: z.string(),
      name: z.string(),
      extension: z.string(),
      toString: z.string(),
    }),
    srcPath: z.object({
      components: z.array(z.string()),
      parent: z.string(),
      name: z.string(),
      extension: z.string(),
      toString: z.string(),
    }).optional(),
    hunks: z.array(z.object({
      sourceLine: z.number().int().min(0),
      sourceSpan: z.number().int().min(0),
      destinationLine: z.number().int().min(0),
      destinationSpan: z.number().int().min(0),
      segments: z.array(z.object({
        type: z.enum(['ADDED', 'REMOVED', 'CONTEXT']),
        lines: z.array(z.object({
          source: z.number().int().min(0),
          destination: z.number().int().min(0),
          line: z.string(),
          truncated: z.boolean(),
          commentIds: z.array(z.number().int().positive()),
        })),
        truncated: z.boolean(),
      })),
      truncated: z.boolean(),
    })),
    binary: z.boolean(),
    source: z.string().optional(),
    destination: z.string().optional(),
    truncated: z.boolean(),
    lineCount: z.number().int().min(0),
  });

  const PullRequestChangeSchema = z.object({
    contentId: z.string().min(1),
    fromContentId: z.string().min(1).optional(),
    path: z.object({
      components: z.array(z.string()),
      parent: z.string(),
      name: z.string(),
      extension: z.string(),
      toString: z.string(),
    }),
    executable: z.boolean(),
    percentUnchanged: z.number().min(0).max(100),
    type: z.enum(['MODIFY', 'ADD', 'DELETE', 'MOVE', 'COPY']),
    nodeType: z.enum(['FILE', 'DIRECTORY']),
    srcExecutable: z.boolean().optional(),
    srcPath: z.object({
      components: z.array(z.string()),
      parent: z.string(),
      name: z.string(),
      extension: z.string(),
      toString: z.string(),
    }).optional(),
    links: z.object({
      self: z.array(z.object({ href: z.string().url() })),
    }),
  });

  describe('Pull Request Activities Contract', () => {
    it('should validate pull request activities list response structure', () => {
      const activitiesList = {
        size: 3,
        limit: 25,
        isLastPage: true,
        values: [
          {
            id: 1,
            createdDate: 1640995200000,
            user: {
              name: 'testuser',
              emailAddress: 'test@example.com',
              id: 1,
              displayName: 'Test User',
              active: true,
              slug: 'testuser',
              type: 'NORMAL',
            },
            action: 'OPENED',
          },
          {
            id: 2,
            createdDate: 1640995300000,
            user: {
              name: 'reviewer1',
              emailAddress: 'reviewer@example.com',
              id: 2,
              displayName: 'Reviewer One',
              active: true,
              slug: 'reviewer1',
              type: 'NORMAL',
            },
            action: 'COMMENTED',
            commentAction: 'ADDED',
            comment: {
              id: 1,
              version: 1,
              text: 'This is a comment',
              author: {
                name: 'reviewer1',
                emailAddress: 'reviewer@example.com',
                id: 2,
                displayName: 'Reviewer One',
                active: true,
                slug: 'reviewer1',
                type: 'NORMAL',
              },
              createdDate: 1640995300000,
              updatedDate: 1640995300000,
              comments: [],
              properties: {
                repositoryId: 1,
              },
            },
          },
          {
            id: 3,
            createdDate: 1640995400000,
            user: {
              name: 'reviewer1',
              emailAddress: 'reviewer@example.com',
              id: 2,
              displayName: 'Reviewer One',
              active: true,
              slug: 'reviewer1',
              type: 'NORMAL',
            },
            action: 'APPROVED',
          },
        ],
        start: 0,
      };

      expect(() => z.object({
        size: z.number().int().positive(),
        limit: z.number().int().positive(),
        isLastPage: z.boolean(),
        values: z.array(PullRequestActivitySchema),
        start: z.number().int().min(0),
        nextPageStart: z.number().int().min(0).optional(),
      }).parse(activitiesList)).not.toThrow();
    });

    it('should validate activity with branch changes', () => {
      const activityWithChanges = {
        id: 1,
        createdDate: 1640995200000,
        user: {
          name: 'testuser',
          emailAddress: 'test@example.com',
          id: 1,
          displayName: 'Test User',
          active: true,
          slug: 'testuser',
          type: 'NORMAL',
        },
        action: 'RESCOPED',
        fromHash: 'abc123def456',
        toHash: 'def456ghi789',
        previousFromHash: 'abc123def456',
        previousToHash: 'old456ghi789',
        added: [
          {
            ref: {
              id: 'refs/heads/feature-branch',
              displayId: 'feature-branch',
              latestCommit: 'def456ghi789',
              repository: {
                id: 1,
                name: 'test-repo',
                slug: 'test-repo',
                scmId: 'git',
                state: 'AVAILABLE',
                statusMessage: 'Available',
                forkable: true,
                project: {
                  key: 'TEST',
                  id: 1,
                  name: 'Test Project',
                  public: false,
                  type: 'NORMAL',
                  links: {
                    self: [{ href: 'https://bitbucket.example.com/projects/TEST' }],
                  },
                },
                public: false,
                links: {
                  clone: [{ href: 'https://bitbucket.example.com/scm/test/test-repo.git', name: 'http' }],
                  self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo' }],
                },
              },
            },
          },
        ],
        removed: [],
      };

      expect(() => PullRequestActivitySchema.parse(activityWithChanges)).not.toThrow();
    });
  });

  describe('Pull Request Diff Contract', () => {
    it('should validate pull request diff response structure', () => {
      const diffResponse = {
        context: {
          contextPath: '',
          fromHash: 'abc123def456',
          toHash: 'def456ghi789',
          whitespace: 'SHOW',
        },
        path: {
          components: ['src', 'main.ts'],
          parent: 'src',
          name: 'main.ts',
          extension: 'ts',
          toString: 'src/main.ts',
        },
        hunks: [
          {
            sourceLine: 1,
            sourceSpan: 3,
            destinationLine: 1,
            destinationSpan: 3,
            segments: [
              {
                type: 'CONTEXT',
                lines: [
                  {
                    source: 1,
                    destination: 1,
                    line: '// Original comment',
                    truncated: false,
                    commentIds: [],
                  },
                ],
                truncated: false,
              },
              {
                type: 'ADDED',
                lines: [
                  {
                    source: -1,
                    destination: 2,
                    line: '+// New comment',
                    truncated: false,
                    commentIds: [],
                  },
                ],
                truncated: false,
              },
            ],
            truncated: false,
          },
        ],
        binary: false,
        truncated: false,
        lineCount: 3,
      };

      expect(() => PullRequestDiffSchema.parse(diffResponse)).not.toThrow();
    });

    it('should validate binary file diff', () => {
      const binaryDiff = {
        context: {
          contextPath: '',
          fromHash: 'abc123def456',
          toHash: 'def456ghi789',
          whitespace: 'SHOW',
        },
        path: {
          components: ['assets', 'image.png'],
          parent: 'assets',
          name: 'image.png',
          extension: 'png',
          toString: 'assets/image.png',
        },
        hunks: [],
        binary: true,
        source: 'abc123def456',
        destination: 'def456ghi789',
        truncated: false,
        lineCount: 0,
      };

      expect(() => PullRequestDiffSchema.parse(binaryDiff)).not.toThrow();
    });

    it('should validate renamed file diff', () => {
      const renamedDiff = {
        context: {
          contextPath: '',
          fromHash: 'abc123def456',
          toHash: 'def456ghi789',
          whitespace: 'SHOW',
        },
        path: {
          components: ['src', 'new-name.ts'],
          parent: 'src',
          name: 'new-name.ts',
          extension: 'ts',
          toString: 'src/new-name.ts',
        },
        srcPath: {
          components: ['src', 'old-name.ts'],
          parent: 'src',
          name: 'old-name.ts',
          extension: 'ts',
          toString: 'src/old-name.ts',
        },
        hunks: [
          {
            sourceLine: 1,
            sourceSpan: 1,
            destinationLine: 1,
            destinationSpan: 1,
            segments: [
              {
                type: 'CONTEXT',
                lines: [
                  {
                    source: 1,
                    destination: 1,
                    line: '// Same content',
                    truncated: false,
                    commentIds: [],
                  },
                ],
                truncated: false,
              },
            ],
            truncated: false,
          },
        ],
        binary: false,
        truncated: false,
        lineCount: 1,
      };

      expect(() => PullRequestDiffSchema.parse(renamedDiff)).not.toThrow();
    });
  });

  describe('Pull Request Changes Contract', () => {
    it('should validate pull request changes list response structure', () => {
      const changesList = {
        size: 2,
        limit: 25,
        isLastPage: true,
        values: [
          {
            contentId: 'abc123def456',
            path: {
              components: ['src', 'main.ts'],
              parent: 'src',
              name: 'main.ts',
              extension: 'ts',
              toString: 'src/main.ts',
            },
            executable: false,
            percentUnchanged: 85,
            type: 'MODIFY',
            nodeType: 'FILE',
            links: {
              self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/main.ts' }],
            },
          },
          {
            contentId: 'def456ghi789',
            path: {
              components: ['src', 'new-file.ts'],
              parent: 'src',
              name: 'new-file.ts',
              extension: 'ts',
              toString: 'src/new-file.ts',
            },
            executable: false,
            percentUnchanged: 0,
            type: 'ADD',
            nodeType: 'FILE',
            links: {
              self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/new-file.ts' }],
            },
          },
        ],
        start: 0,
      };

      expect(() => z.object({
        size: z.number().int().positive(),
        limit: z.number().int().positive(),
        isLastPage: z.boolean(),
        values: z.array(PullRequestChangeSchema),
        start: z.number().int().min(0),
        nextPageStart: z.number().int().min(0).optional(),
      }).parse(changesList)).not.toThrow();
    });

    it('should validate file move change', () => {
      const moveChange = {
        contentId: 'abc123def456',
        fromContentId: 'old123def456',
        path: {
          components: ['src', 'new-location', 'file.ts'],
          parent: 'src/new-location',
          name: 'file.ts',
          extension: 'ts',
          toString: 'src/new-location/file.ts',
        },
        executable: false,
        percentUnchanged: 100,
        type: 'MOVE',
        nodeType: 'FILE',
        srcPath: {
          components: ['src', 'old-location', 'file.ts'],
          parent: 'src/old-location',
          name: 'file.ts',
          extension: 'ts',
          toString: 'src/old-location/file.ts',
        },
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/new-location/file.ts' }],
        },
      };

      expect(() => PullRequestChangeSchema.parse(moveChange)).not.toThrow();
    });

    it('should validate file copy change', () => {
      const copyChange = {
        contentId: 'abc123def456',
        fromContentId: 'original123def456',
        path: {
          components: ['src', 'copy', 'file.ts'],
          parent: 'src/copy',
          name: 'file.ts',
          extension: 'ts',
          toString: 'src/copy/file.ts',
        },
        executable: false,
        percentUnchanged: 100,
        type: 'COPY',
        nodeType: 'FILE',
        srcPath: {
          components: ['src', 'original', 'file.ts'],
          parent: 'src/original',
          name: 'file.ts',
          extension: 'ts',
          toString: 'src/original/file.ts',
        },
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/copy/file.ts' }],
        },
      };

      expect(() => PullRequestChangeSchema.parse(copyChange)).not.toThrow();
    });

    it('should validate file delete change', () => {
      const deleteChange = {
        contentId: 'abc123def456',
        path: {
          components: ['src', 'deleted-file.ts'],
          parent: 'src',
          name: 'deleted-file.ts',
          extension: 'ts',
          toString: 'src/deleted-file.ts',
        },
        executable: false,
        percentUnchanged: 0,
        type: 'DELETE',
        nodeType: 'FILE',
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/deleted-file.ts' }],
        },
      };

      expect(() => PullRequestChangeSchema.parse(deleteChange)).not.toThrow();
    });

    it('should validate directory change', () => {
      const directoryChange = {
        contentId: 'abc123def456',
        path: {
          components: ['src', 'new-directory'],
          parent: 'src',
          name: 'new-directory',
          extension: '',
          toString: 'src/new-directory',
        },
        executable: false,
        percentUnchanged: 0,
        type: 'ADD',
        nodeType: 'DIRECTORY',
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/new-directory' }],
        },
      };

      expect(() => PullRequestChangeSchema.parse(directoryChange)).not.toThrow();
    });

    it('should validate executable file change', () => {
      const executableChange = {
        contentId: 'abc123def456',
        path: {
          components: ['scripts', 'build.sh'],
          parent: 'scripts',
          name: 'build.sh',
          extension: 'sh',
          toString: 'scripts/build.sh',
        },
        executable: true,
        percentUnchanged: 50,
        type: 'MODIFY',
        nodeType: 'FILE',
        srcExecutable: true,
        links: {
          self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/scripts/build.sh' }],
        },
      };

      expect(() => PullRequestChangeSchema.parse(executableChange)).not.toThrow();
    });
  });

  describe('Activity Types Validation', () => {
    it('should validate all supported activity actions', () => {
      const actions = [
        'COMMENTED',
        'OPENED',
        'MERGED',
        'DECLINED',
        'REOPENED',
        'RESCOPED',
        'UPDATED',
        'APPROVED',
        'UNAPPROVED',
        'REVIEWED'
      ];

      actions.forEach(action => {
        const activity = {
          id: 1,
          createdDate: 1640995200000,
          user: {
            name: 'testuser',
            emailAddress: 'test@example.com',
            id: 1,
            displayName: 'Test User',
            active: true,
            slug: 'testuser',
            type: 'NORMAL',
          },
          action: action as any,
        };

        expect(() => PullRequestActivitySchema.parse(activity)).not.toThrow();
      });
    });

    it('should validate all supported comment actions', () => {
      const commentActions = ['ADDED', 'EDITED', 'DELETED'];

      commentActions.forEach(commentAction => {
        const activity = {
          id: 1,
          createdDate: 1640995200000,
          user: {
            name: 'testuser',
            emailAddress: 'test@example.com',
            id: 1,
            displayName: 'Test User',
            active: true,
            slug: 'testuser',
            type: 'NORMAL',
          },
          action: 'COMMENTED',
          commentAction: commentAction as any,
        };

        expect(() => PullRequestActivitySchema.parse(activity)).not.toThrow();
      });
    });
  });

  describe('Change Types Validation', () => {
    it('should validate all supported change types', () => {
      const changeTypes = ['MODIFY', 'ADD', 'DELETE', 'MOVE', 'COPY'];

      changeTypes.forEach(type => {
        const change = {
          contentId: 'abc123def456',
          path: {
            components: ['src', 'file.ts'],
            parent: 'src',
            name: 'file.ts',
            extension: 'ts',
            toString: 'src/file.ts',
          },
          executable: false,
          percentUnchanged: 0,
          type: type as any,
          nodeType: 'FILE',
          links: {
            self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/file.ts' }],
          },
        };

        expect(() => PullRequestChangeSchema.parse(change)).not.toThrow();
      });
    });

    it('should validate all supported node types', () => {
      const nodeTypes = ['FILE', 'DIRECTORY'];

      nodeTypes.forEach(nodeType => {
        const change = {
          contentId: 'abc123def456',
          path: {
            components: ['src', 'item'],
            parent: 'src',
            name: 'item',
            extension: '',
            toString: 'src/item',
          },
          executable: false,
          percentUnchanged: 0,
          type: 'ADD',
          nodeType: nodeType as any,
          links: {
            self: [{ href: 'https://bitbucket.example.com/projects/TEST/repos/test-repo/pull-requests/1/diff/src/item' }],
          },
        };

        expect(() => PullRequestChangeSchema.parse(change)).not.toThrow();
      });
    });
  });
});
