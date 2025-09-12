import { z } from 'zod';
import { UserSchema, RepositorySchema } from './bitbucket';

// ===== DATA CENTER SPECIFIC TYPES =====

// Project Schema (Data Center Only)
export const ProjectSchema = z.object({
  key: z.string().min(1).max(10, 'Project key must be 1-10 characters'),
  id: z.number().int().positive('Project ID must be positive'),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  public: z.boolean().default(false),
  type: z.string().default('NORMAL'),
  links: z
    .object({
      self: z
        .array(
          z.object({
            href: z.string().url(),
          })
        )
        .optional(),
      avatar: z
        .array(
          z.object({
            href: z.string().url(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

// OAuth Token Schema (Data Center Only)
export const OAuthTokenSchema = z.object({
  id: z.string().min(1, 'Token ID is required'),
  name: z.string().min(1, 'Token name is required'),
  createdDate: z.union([z.string(), z.number(), z.date()]),
  expiresDate: z.union([z.string(), z.number(), z.date()]).optional(),
  scopes: z.array(z.string()).default([]),
  accessToken: z.string().optional(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number().int().positive().optional(),
  refreshToken: z.string().optional(),
  scope: z.string().optional(),
});

export type OAuthToken = z.infer<typeof OAuthTokenSchema>;

// Group Schema (Data Center Only)
export const GroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
});

export type Group = z.infer<typeof GroupSchema>;

// Permission Schema (Data Center)
export const PermissionSchema = z
  .object({
    user: UserSchema.optional(),
    group: GroupSchema.optional(),
    permission: z.enum([
      'PROJECT_READ',
      'PROJECT_WRITE',
      'PROJECT_ADMIN',
      'REPO_READ',
      'REPO_WRITE',
      'REPO_ADMIN',
    ]),
  })
  .refine(data => (data.user && !data.group) || (!data.user && data.group), {
    message: 'Either user or group must be specified, but not both',
  });

export type Permission = z.infer<typeof PermissionSchema>;

// ===== CLOUD SPECIFIC TYPES =====

// Issue Schema (Cloud Only)
export const IssueSchema = z.object({
  id: z.number().int().positive('Issue ID must be positive'),
  title: z.string().min(1, 'Issue title is required'),
  content: z.string().optional(),
  state: z.enum([
    'new',
    'open',
    'resolved',
    'on_hold',
    'invalid',
    'duplicate',
    'wontfix',
    'closed',
  ]),
  priority: z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']),
  kind: z.enum(['bug', 'enhancement', 'proposal', 'task']),
  assignee: UserSchema.optional(),
  reporter: UserSchema,
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
  repository: RepositorySchema,
});

export type Issue = z.infer<typeof IssueSchema>;

// Webhook Subject Schema (Cloud Only)
export const WebhookSubjectSchema = z.object({
  type: z.string(),
  uuid: z.string().optional(),
  full_name: z.string().optional(),
});

export type WebhookSubject = z.infer<typeof WebhookSubjectSchema>;

// Webhook Schema (Cloud Only)
export const WebhookSchema = z.object({
  uuid: z.string().min(1, 'Webhook UUID is required'),
  url: z.string().url('Webhook URL must be valid'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  events: z.array(z.string()).min(1, 'At least one event must be specified'),
  subject: WebhookSubjectSchema,
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
});

export type Webhook = z.infer<typeof WebhookSchema>;

// Pipeline Target Schema (Cloud Only)
export const PipelineTargetSchema = z.object({
  type: z.string(),
  ref_type: z.string().optional(),
  ref_name: z.string().optional(),
  commit: z
    .object({
      hash: z.string(),
    })
    .optional(),
});

export type PipelineTarget = z.infer<typeof PipelineTargetSchema>;

// Pipeline State Schema (Cloud Only)
export const PipelineStateSchema = z.object({
  name: z.enum(['PENDING', 'IN_PROGRESS', 'SUCCESSFUL', 'FAILED', 'STOPPED', 'PAUSED']),
  type: z.string(),
  stage: z
    .object({
      name: z.string(),
      type: z.string(),
    })
    .optional(),
});

export type PipelineState = z.infer<typeof PipelineStateSchema>;

// Pipeline Schema (Cloud Only)
export const PipelineSchema = z.object({
  uuid: z.string().min(1, 'Pipeline UUID is required'),
  buildNumber: z.number().int().positive('Build number must be positive'),
  creator: UserSchema,
  target: PipelineTargetSchema,
  state: PipelineStateSchema,
  createdAt: z.union([z.string(), z.number(), z.date()]),
  completedAt: z.union([z.string(), z.number(), z.date()]).optional(),
  buildSecondsUsed: z.number().int().min(0).default(0),
  repository: RepositorySchema,
});

export type Pipeline = z.infer<typeof PipelineSchema>;

// Pipeline Image Schema (Cloud Only)
export const PipelineImageSchema = z.object({
  name: z.string(),
});

export type PipelineImage = z.infer<typeof PipelineImageSchema>;

// Pipeline Script Schema (Cloud Only)
export const PipelineScriptSchema = z.object({
  command: z.string(),
});

export type PipelineScript = z.infer<typeof PipelineScriptSchema>;

// Pipeline Step Schema (Cloud Only)
export const PipelineStepSchema = z.object({
  uuid: z.string().min(1, 'Step UUID is required'),
  name: z.string().min(1, 'Step name is required'),
  state: PipelineStateSchema,
  image: PipelineImageSchema.optional(),
  script: z.array(PipelineScriptSchema).default([]),
  maxTime: z.number().int().positive('Max time must be positive'),
  buildTimeSeconds: z.number().int().min(0).default(0),
  createdAt: z.union([z.string(), z.number(), z.date()]),
  startedAt: z.union([z.string(), z.number(), z.date()]).optional(),
  completedAt: z.union([z.string(), z.number(), z.date()]).optional(),
});

export type PipelineStep = z.infer<typeof PipelineStepSchema>;

// Snippet Schema (Cloud Only)
export const SnippetSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1, 'Snippet title is required'),
  scm: z.enum(['git', 'hg']).default('git'),
  isPrivate: z.boolean().default(false),
  owner: UserSchema,
  creator: UserSchema,
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
});

export type Snippet = z.infer<typeof SnippetSchema>;

// SSH Key Schema (Cloud Only)
export const SSHKeySchema = z.object({
  uuid: z.string().min(1, 'SSH key UUID is required'),
  key: z.string().min(1, 'SSH key is required'),
  label: z.string().min(1, 'SSH key label is required'),
  createdAt: z.union([z.string(), z.number(), z.date()]),
  lastUsed: z.union([z.string(), z.number(), z.date()]).optional(),
  user: UserSchema,
});

export type SSHKey = z.infer<typeof SSHKeySchema>;

// GPG Key Schema (Cloud Only)
export const GPGKeySchema = z.object({
  keyId: z.string().min(1, 'GPG key ID is required'),
  key: z.string().min(1, 'GPG key is required'),
  createdAt: z.union([z.string(), z.number(), z.date()]),
  user: UserSchema,
});

export type GPGKey = z.infer<typeof GPGKeySchema>;

// Branch Restriction Schema (Cloud Only)
export const BranchRestrictionSchema = z.object({
  id: z.number().int().positive('Restriction ID must be positive'),
  kind: z.enum(['push', 'delete', 'force_push', 'restrict_merges']),
  branchType: z.enum(['branch', 'pattern', 'model']),
  branchMatchKind: z.enum(['glob', 'regexp']).optional(),
  branchMatch: z.string().optional(),
  users: z.array(UserSchema).default([]),
  groups: z.array(GroupSchema).default([]),
});

export type BranchRestriction = z.infer<typeof BranchRestrictionSchema>;

// Commit Status Schema (Cloud Only)
export const CommitStatusSchema = z.object({
  key: z.string().min(1, 'Status key is required'),
  state: z.enum(['SUCCESSFUL', 'FAILED', 'INPROGRESS', 'STOPPED']),
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
});

export type CommitStatus = z.infer<typeof CommitStatusSchema>;

// Deployment Environment Schema (Cloud Only)
export const DeploymentEnvironmentSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  type: z.string(),
});

export type DeploymentEnvironment = z.infer<typeof DeploymentEnvironmentSchema>;

// Deployment Release Schema (Cloud Only)
export const DeploymentReleaseSchema = z.object({
  uuid: z.string(),
  name: z.string(),
});

export type DeploymentRelease = z.infer<typeof DeploymentReleaseSchema>;

// Deployment Schema (Cloud Only)
export const DeploymentSchema = z.object({
  uuid: z.string().min(1, 'Deployment UUID is required'),
  name: z.string().min(1, 'Deployment name is required'),
  key: z.string().min(1, 'Deployment key is required'),
  url: z.string().url().optional(),
  state: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'STOPPED']),
  environment: DeploymentEnvironmentSchema,
  release: DeploymentReleaseSchema.optional(),
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
});

export type Deployment = z.infer<typeof DeploymentSchema>;

// Download Schema (Cloud Only)
export const DownloadSchema = z.object({
  name: z.string().min(1, 'Download name is required'),
  path: z.string().min(1, 'Download path is required'),
  size: z.number().int().min(0, 'Size must be non-negative'),
  createdAt: z.union([z.string(), z.number(), z.date()]),
});

export type Download = z.infer<typeof DownloadSchema>;

// Issue Comment Schema
export const IssueCommentSchema: z.ZodSchema<{
  id: number;
  text: string;
  author: any;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  parent?: any;
  issue?: any;
}> = z.object({
  id: z.number().int().positive('Comment ID must be positive'),
  text: z.string().min(1, 'Comment text is required'),
  author: UserSchema,
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
  parent: z.lazy(() => IssueCommentSchema).optional(),
  issue: IssueSchema.optional(),
});

export type IssueComment = z.infer<typeof IssueCommentSchema>;

// Validation helpers
export const validateProject = (project: unknown): Project => {
  return ProjectSchema.parse(project);
};

export const validateIssue = (issue: unknown): Issue => {
  return IssueSchema.parse(issue);
};

export const validateOAuthToken = (token: unknown): OAuthToken => {
  return OAuthTokenSchema.parse(token);
};

export const validatePermission = (permission: unknown): Permission => {
  return PermissionSchema.parse(permission);
};

export const validateWebhook = (webhook: unknown): Webhook => {
  return WebhookSchema.parse(webhook);
};

export const validatePipeline = (pipeline: unknown): Pipeline => {
  return PipelineSchema.parse(pipeline);
};

export const validateSnippet = (snippet: unknown): Snippet => {
  return SnippetSchema.parse(snippet);
};

export const validateSSHKey = (sshKey: unknown): SSHKey => {
  return SSHKeySchema.parse(sshKey);
};

export const validateGPGKey = (gpgKey: unknown): GPGKey => {
  return GPGKeySchema.parse(gpgKey);
};
