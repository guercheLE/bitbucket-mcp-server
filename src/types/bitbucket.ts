import { z } from 'zod';

// Link Schema
export const LinkSchema = z.object({
  href: z.string().url('Link href must be a valid URL'),
  name: z.string().optional(),
});

export type Link = z.infer<typeof LinkSchema>;

// Clone Link Schema
export const CloneLinkSchema = z.object({
  href: z.string().url('Clone URL must be valid'),
  name: z.string().min(1, 'Clone method name is required'), // HTTP, SSH
});

export type CloneLink = z.infer<typeof CloneLinkSchema>;

// User Schema (compatible with both Cloud and Data Center)
export const UserSchema = z.object({
  // Common fields
  id: z.union([z.string(), z.number()]), // string for Cloud UUID, number for DC ID
  name: z.string().min(1, 'Username is required'),
  displayName: z.string().min(1, 'Display name is required'),
  emailAddress: z.string().email('Valid email address required').optional(),

  // Cloud-specific fields
  uuid: z.string().optional(),
  accountStatus: z.enum(['active', 'inactive', 'closed']).optional(),
  avatarUrl: z.string().url().optional(),

  // Data Center-specific fields
  slug: z.string().optional(),
  type: z.string().optional(),
  active: z.boolean().optional(),
  directoryName: z.string().optional(),
  mutableDetails: z.boolean().optional(),
  mutableGroups: z.boolean().optional(),
  lastAuthenticationTimestamp: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Project Reference Schema (Data Center)
export const ProjectRefSchema = z.object({
  key: z.string().min(1).max(10, 'Project key must be 1-10 characters'),
  name: z.string().min(1, 'Project name is required'),
});

export type ProjectRef = z.infer<typeof ProjectRefSchema>;

// Workspace Reference Schema (Cloud)
export const WorkspaceRefSchema = z.object({
  slug: z.string().min(1, 'Workspace slug is required'),
  name: z.string().min(1, 'Workspace name is required'),
});

export type WorkspaceRef = z.infer<typeof WorkspaceRefSchema>;

// Repository Reference Schema
export const RepositoryRefSchema = z.object({
  slug: z.string().min(1, 'Repository slug is required'),
  name: z.string().min(1, 'Repository name is required'),
  project: ProjectRefSchema.optional(),
  workspace: WorkspaceRefSchema.optional(),
});

export type RepositoryRef = z.infer<typeof RepositoryRefSchema>;

// Repository Links Schema
export const RepositoryLinksSchema = z.object({
  clone: z.array(CloneLinkSchema).optional(),
  self: z.array(LinkSchema).optional(),
});

export type RepositoryLinks = z.infer<typeof RepositoryLinksSchema>;

// Repository Schema (compatible with both Cloud and Data Center)
export const RepositorySchema = z.object({
  // Common fields
  id: z.union([z.string(), z.number()]), // string for Cloud UUID, number for DC ID
  name: z.string().min(1, 'Repository name is required'),
  description: z.string().optional(),

  // Cloud-specific fields
  uuid: z.string().optional(),
  fullName: z.string().optional(),
  isPrivate: z.boolean().optional(),
  workspace: WorkspaceRefSchema.optional(),

  // Data Center-specific fields
  slug: z.string().optional(),
  scmId: z.string().default('git'),
  state: z.string().optional(),
  statusMessage: z.string().optional(),
  forkable: z.boolean().optional(),
  public: z.boolean().optional(),
  project: ProjectRefSchema.optional(),

  // Common metadata
  createdAt: z.union([z.string(), z.number(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.number(), z.date()]).optional(),
  links: RepositoryLinksSchema.optional(),
});

export type Repository = z.infer<typeof RepositorySchema>;

// Branch Reference Schema
export const BranchRefSchema = z.object({
  id: z.string().min(1, 'Branch ID is required'),
  displayId: z.string().min(1, 'Branch display ID is required'),
  latestCommit: z.string().min(1, 'Latest commit hash is required'),
  repository: RepositoryRefSchema,
});

export type BranchRef = z.infer<typeof BranchRefSchema>;

// Pull Request Author Schema
export const PullRequestAuthorSchema = z.object({
  user: UserSchema,
});

export type PullRequestAuthor = z.infer<typeof PullRequestAuthorSchema>;

// Pull Request Reviewer Schema
export const PullRequestReviewerSchema = z.object({
  user: UserSchema,
  approved: z.boolean().default(false),
  status: z.string().optional(),
});

export type PullRequestReviewer = z.infer<typeof PullRequestReviewerSchema>;

// Pull Request Schema (compatible with both Cloud and Data Center)
export const PullRequestSchema = z.object({
  id: z.number().int().positive('Pull request ID must be positive'),
  version: z.number().int().min(0).optional(),
  title: z.string().min(1, 'Pull request title is required'),
  description: z.string().optional(),
  state: z.enum(['OPEN', 'DECLINED', 'MERGED', 'SUPERSEDED']),
  open: z.boolean().optional(),
  closed: z.boolean().optional(),
  createdDate: z.union([z.string(), z.number(), z.date()]),
  updatedDate: z.union([z.string(), z.number(), z.date()]),
  fromRef: BranchRefSchema,
  toRef: BranchRefSchema,
  author: PullRequestAuthorSchema,
  reviewers: z.array(PullRequestReviewerSchema).default([]),
  repository: RepositorySchema,
});

export type PullRequest = z.infer<typeof PullRequestSchema>;

// Commit Author Schema
export const CommitAuthorSchema = z.object({
  name: z.string().min(1, 'Author name is required'),
  emailAddress: z.string().email('Valid email address required'),
  user: UserSchema.optional(),
});

export type CommitAuthor = z.infer<typeof CommitAuthorSchema>;

// Commit Parent Schema
export const CommitParentSchema = z.object({
  id: z.string().min(1, 'Parent commit ID is required'),
  displayId: z.string().min(1, 'Parent commit display ID is required'),
});

export type CommitParent = z.infer<typeof CommitParentSchema>;

// Commit Schema
export const CommitSchema = z.object({
  id: z.string().min(1, 'Commit ID is required'),
  displayId: z.string().min(1, 'Commit display ID is required'),
  message: z.string().min(1, 'Commit message is required'),
  author: CommitAuthorSchema,
  committer: CommitAuthorSchema.optional(),
  authorTimestamp: z.union([z.string(), z.number(), z.date()]),
  committerTimestamp: z.union([z.string(), z.number(), z.date()]).optional(),
  parents: z.array(CommitParentSchema).default([]),
  repository: RepositorySchema,
});

export type Commit = z.infer<typeof CommitSchema>;

// Branch Schema
export const BranchSchema = z.object({
  id: z.string().min(1, 'Branch ID is required'),
  name: z.string().min(1, 'Branch name is required'),
  displayId: z.string().min(1, 'Branch display ID is required'),
  type: z.string().default('BRANCH'),
  latestCommit: z.string().min(1, 'Latest commit hash is required'),
  isDefault: z.boolean().default(false),
  repository: RepositorySchema,
});

export type Branch = z.infer<typeof BranchSchema>;

// Tag Schema
export const TagSchema = z.object({
  id: z.string().min(1, 'Tag ID is required'),
  name: z.string().min(1, 'Tag name is required'),
  displayId: z.string().min(1, 'Tag display ID is required'),
  type: z.string().default('TAG'),
  latestCommit: z.string().min(1, 'Latest commit hash is required'),
  message: z.string().optional(),
  repository: RepositorySchema,
});

export type Tag = z.infer<typeof TagSchema>;

// Comment Schema
export const CommentSchema: z.ZodSchema<{
  id: number;
  text: string;
  author: User;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  parent?: any;
  pullRequest?: any;
}> = z.object({
  id: z.number().int().positive('Comment ID must be positive'),
  text: z.string().min(1, 'Comment text is required'),
  author: UserSchema,
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
  parent: z.lazy(() => CommentSchema).optional(),
  pullRequest: z.lazy(() => PullRequestSchema).optional(),
  // issue will be defined in server-specific types
});

export type Comment = z.infer<typeof CommentSchema>;

// Validation helpers
export const validateRepository = (repo: unknown): Repository => {
  return RepositorySchema.parse(repo);
};

export const validatePullRequest = (pr: unknown): PullRequest => {
  return PullRequestSchema.parse(pr);
};

export const validateUser = (user: unknown): User => {
  return UserSchema.parse(user);
};

export const validateCommit = (commit: unknown): Commit => {
  return CommitSchema.parse(commit);
};

export const validateBranch = (branch: unknown): Branch => {
  return BranchSchema.parse(branch);
};

export const validateTag = (tag: unknown): Tag => {
  return TagSchema.parse(tag);
};

export const validateComment = (comment: unknown): Comment => {
  return CommentSchema.parse(comment);
};
