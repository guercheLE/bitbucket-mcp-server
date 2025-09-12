import { z } from 'zod';
import { RepositorySchema, CommitAuthorSchema } from './bitbucket';

// Git Reference Type enum
export const GitRefTypeSchema = z.enum(['BRANCH', 'TAG', 'COMMIT']);
export type GitRefType = z.infer<typeof GitRefTypeSchema>;

// Git Object Type enum
export const GitObjectTypeSchema = z.enum(['commit', 'tree', 'blob', 'tag']);
export type GitObjectType = z.infer<typeof GitObjectTypeSchema>;

// Git Reference Schema
export const GitRefSchema = z.object({
  id: z.string().min(1, 'Git ref ID is required'),
  displayId: z.string().min(1, 'Git ref display ID is required'),
  type: GitRefTypeSchema,
  latestCommit: z.string().min(1, 'Latest commit hash is required'),
  repository: RepositorySchema,
});

export type GitRef = z.infer<typeof GitRefSchema>;

// Branch Schema
export const BranchSchema = z.object({
  id: z.string().min(1, 'Branch ID is required'),
  name: z
    .string()
    .min(1, 'Branch name is required')
    .regex(/^[a-zA-Z0-9._\-/]+$/, 'Branch name contains invalid characters'),
  displayId: z.string().min(1, 'Branch display ID is required'),
  type: z.literal('BRANCH'),
  latestCommit: z
    .string()
    .min(1, 'Latest commit hash is required')
    .regex(/^[a-f0-9]{40}$/, 'Commit hash must be a valid SHA-1 hash'),
  isDefault: z.boolean().default(false),
  repository: RepositorySchema,

  // Additional metadata
  ahead: z.number().int().min(0).optional(),
  behind: z.number().int().min(0).optional(),
  lastModified: z.union([z.string(), z.number(), z.date()]).optional(),
});

export type Branch = z.infer<typeof BranchSchema>;

// Tag Schema
export const TagSchema = z.object({
  id: z.string().min(1, 'Tag ID is required'),
  name: z
    .string()
    .min(1, 'Tag name is required')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Tag name contains invalid characters'),
  displayId: z.string().min(1, 'Tag display ID is required'),
  type: z.literal('TAG'),
  latestCommit: z
    .string()
    .min(1, 'Latest commit hash is required')
    .regex(/^[a-f0-9]{40}$/, 'Commit hash must be a valid SHA-1 hash'),
  message: z.string().optional(),
  repository: RepositorySchema,

  // Tag metadata
  tagger: CommitAuthorSchema.optional(),
  taggedDate: z.union([z.string(), z.number(), z.date()]).optional(),
  isAnnotated: z.boolean().default(false),
});

export type Tag = z.infer<typeof TagSchema>;

// Commit Parent Schema
export const CommitParentSchema = z.object({
  id: z
    .string()
    .min(1, 'Parent commit ID is required')
    .regex(/^[a-f0-9]{40}$/, 'Parent commit hash must be a valid SHA-1 hash'),
  displayId: z.string().min(1, 'Parent commit display ID is required'),
});

export type CommitParent = z.infer<typeof CommitParentSchema>;

// Commit Statistics Schema
export const CommitStatsSchema = z.object({
  additions: z.number().int().min(0).default(0),
  deletions: z.number().int().min(0).default(0),
  changes: z.number().int().min(0).default(0),
  filesChanged: z.number().int().min(0).default(0),
});

export type CommitStats = z.infer<typeof CommitStatsSchema>;

// File Change Schema
export const FileChangeSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  type: z.enum(['ADDED', 'MODIFIED', 'DELETED', 'RENAMED', 'COPIED']),
  additions: z.number().int().min(0).default(0),
  deletions: z.number().int().min(0).default(0),
  oldPath: z.string().optional(), // For renamed/moved files
});

export type FileChange = z.infer<typeof FileChangeSchema>;

// Commit Schema
export const CommitSchema = z.object({
  id: z
    .string()
    .min(1, 'Commit ID is required')
    .regex(/^[a-f0-9]{40}$/, 'Commit hash must be a valid SHA-1 hash'),
  displayId: z
    .string()
    .min(1, 'Commit display ID is required')
    .regex(/^[a-f0-9]{7,12}$/, 'Commit display ID must be a valid abbreviated hash'),
  message: z.string().min(1, 'Commit message is required'),
  author: CommitAuthorSchema,
  committer: CommitAuthorSchema.optional(),
  authorTimestamp: z.union([z.string(), z.number(), z.date()]),
  committerTimestamp: z.union([z.string(), z.number(), z.date()]).optional(),
  parents: z.array(CommitParentSchema).default([]),
  repository: RepositorySchema,

  // Additional commit metadata
  stats: CommitStatsSchema.optional(),
  files: z.array(FileChangeSchema).optional(),
  tree: z.string().optional(),
  url: z.string().url().optional(),
});

export type Commit = z.infer<typeof CommitSchema>;

// Diff Hunk Schema
export const DiffHunkSchema = z.object({
  oldStart: z.number().int().min(0),
  oldLines: z.number().int().min(0),
  newStart: z.number().int().min(0),
  newLines: z.number().int().min(0),
  context: z.string(),
  lines: z.array(
    z.object({
      type: z.enum(['context', 'addition', 'deletion']),
      content: z.string(),
      oldLineNumber: z.number().int().optional(),
      newLineNumber: z.number().int().optional(),
    })
  ),
});

export type DiffHunk = z.infer<typeof DiffHunkSchema>;

// File Diff Schema
export const FileDiffSchema = z.object({
  oldPath: z.string().optional(),
  newPath: z.string(),
  type: z.enum(['ADDED', 'MODIFIED', 'DELETED', 'RENAMED', 'COPIED']),
  binary: z.boolean().default(false),
  hunks: z.array(DiffHunkSchema).default([]),
  additions: z.number().int().min(0).default(0),
  deletions: z.number().int().min(0).default(0),
});

export type FileDiff = z.infer<typeof FileDiffSchema>;

// Diff Schema
export const DiffSchema = z.object({
  fromCommit: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .optional(),
  toCommit: z.string().regex(/^[a-f0-9]{40}$/),
  contextLines: z.number().int().min(0).default(3),
  files: z.array(FileDiffSchema),
  stats: CommitStatsSchema.optional(),
});

export type Diff = z.infer<typeof DiffSchema>;

// Merge Strategy enum
export const MergeStrategySchema = z.enum([
  'merge_commit',
  'squash',
  'rebase',
  'fast_forward',
  'no_fast_forward',
]);

export type MergeStrategy = z.infer<typeof MergeStrategySchema>;

// Merge Result Schema
export const MergeResultSchema = z.object({
  success: z.boolean(),
  commit: CommitSchema.optional(),
  conflicts: z
    .array(
      z.object({
        path: z.string(),
        type: z.enum(['CONTENT', 'DELETE_MODIFY', 'MODIFY_DELETE']),
        message: z.string(),
      })
    )
    .default([]),
  strategy: MergeStrategySchema,
});

export type MergeResult = z.infer<typeof MergeResultSchema>;

// Git Operation Result Schema
export const GitOperationResultSchema = z.object({
  success: z.boolean(),
  operation: z.enum([
    'branch_create',
    'branch_delete',
    'tag_create',
    'tag_delete',
    'merge',
    'rebase',
  ]),
  result: z.union([BranchSchema, TagSchema, CommitSchema, MergeResultSchema]).optional(),
  error: z.string().optional(),
});

export type GitOperationResult = z.infer<typeof GitOperationResultSchema>;

// Branch Creation Request Schema
export const BranchCreateRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Branch name is required')
    .regex(/^[a-zA-Z0-9._\-/]+$/, 'Branch name contains invalid characters'),
  startPoint: z.string().min(1, 'Start point is required'), // commit hash or branch name
  message: z.string().optional(),
});

export type BranchCreateRequest = z.infer<typeof BranchCreateRequestSchema>;

// Tag Creation Request Schema
export const TagCreateRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Tag name contains invalid characters'),
  startPoint: z.string().min(1, 'Start point is required'), // commit hash or branch name
  message: z.string().optional(),
  annotated: z.boolean().default(false),
});

export type TagCreateRequest = z.infer<typeof TagCreateRequestSchema>;

// Commit Range Schema
export const CommitRangeSchema = z.object({
  from: z.string().min(1, 'From commit is required'),
  to: z.string().min(1, 'To commit is required'),
  repository: RepositorySchema,
});

export type CommitRange = z.infer<typeof CommitRangeSchema>;

// Git Log Options Schema
export const GitLogOptionsSchema = z.object({
  since: z.union([z.string(), z.date()]).optional(),
  until: z.union([z.string(), z.date()]).optional(),
  author: z.string().optional(),
  path: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  skip: z.number().int().min(0).default(0),
  merges: z.boolean().default(true),
});

export type GitLogOptions = z.infer<typeof GitLogOptionsSchema>;

// Validation helpers
export const validateBranch = (branch: unknown): Branch => {
  return BranchSchema.parse(branch);
};

export const validateTag = (tag: unknown): Tag => {
  return TagSchema.parse(tag);
};

export const validateCommit = (commit: unknown): Commit => {
  return CommitSchema.parse(commit);
};

export const validateDiff = (diff: unknown): Diff => {
  return DiffSchema.parse(diff);
};

export const validateBranchCreateRequest = (request: unknown): BranchCreateRequest => {
  return BranchCreateRequestSchema.parse(request);
};

export const validateTagCreateRequest = (request: unknown): TagCreateRequest => {
  return TagCreateRequestSchema.parse(request);
};

export const validateMergeResult = (result: unknown): MergeResult => {
  return MergeResultSchema.parse(result);
};

// Utility functions
export const isValidCommitHash = (hash: string): boolean => {
  return /^[a-f0-9]{40}$/.test(hash);
};

export const isValidBranchName = (name: string): boolean => {
  return /^[a-zA-Z0-9._\-/]+$/.test(name) && !name.startsWith('/') && !name.endsWith('/');
};

export const isValidTagName = (name: string): boolean => {
  return /^[a-zA-Z0-9._-]+$/.test(name);
};

export const shortenCommitHash = (hash: string, length: number = 7): string => {
  if (!isValidCommitHash(hash)) {
    throw new Error('Invalid commit hash');
  }
  return hash.substring(0, length);
};

export const parseGitRef = (ref: string): { type: 'branch' | 'tag' | 'commit'; name: string } => {
  if (ref.startsWith('refs/heads/')) {
    return { type: 'branch', name: ref.replace('refs/heads/', '') };
  } else if (ref.startsWith('refs/tags/')) {
    return { type: 'tag', name: ref.replace('refs/tags/', '') };
  } else if (isValidCommitHash(ref)) {
    return { type: 'commit', name: ref };
  } else {
    // Assume it's a branch name
    return { type: 'branch', name: ref };
  }
};
