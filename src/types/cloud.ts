import { z } from 'zod';
import { UserSchema, RepositorySchema } from './bitbucket';

// ===== BITBUCKET CLOUD SPECIFIC TYPES =====

// Workspace Schema (Cloud Only)
export const WorkspaceSchema = z.object({
  uuid: z.string().min(1, 'Workspace UUID is required'),
  slug: z.string().min(1, 'Workspace slug is required'),
  name: z.string().min(1, 'Workspace name is required'),
  type: z.string().default('workspace'),
  isPrivate: z.boolean().default(false),
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
    avatar: z
      .object({
        href: z.string().url(),
      })
      .optional(),
    html: z
      .object({
        href: z.string().url(),
      })
      .optional(),
  }),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

// Issue Schema (Cloud Only)
export const IssueSchema = z.object({
  id: z.number().int().positive('Issue ID must be positive'),
  title: z.string().min(1, 'Issue title is required'),
  content: z
    .object({
      raw: z.string(),
      markup: z.string().default('markdown'),
      html: z.string().optional(),
    })
    .optional(),
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
  component: z
    .object({
      name: z.string(),
    })
    .optional(),
  milestone: z
    .object({
      name: z.string(),
    })
    .optional(),
  version: z
    .object({
      name: z.string(),
    })
    .optional(),
  assignee: UserSchema.optional(),
  reporter: UserSchema,
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
  editedAt: z.union([z.string(), z.number(), z.date()]).optional(),
  repository: RepositorySchema,
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
    html: z.object({
      href: z.string().url(),
    }),
    comments: z.object({
      href: z.string().url(),
    }),
    attachments: z.object({
      href: z.string().url(),
    }),
    watch: z.object({
      href: z.string().url(),
    }),
    vote: z.object({
      href: z.string().url(),
    }),
  }),
});

export type Issue = z.infer<typeof IssueSchema>;

// Webhook Schema (Cloud Only)
export const WebhookSchema = z.object({
  uuid: z.string().min(1, 'Webhook UUID is required'),
  url: z.string().url('Webhook URL must be valid'),
  description: z.string().optional(),
  subject_type: z.enum(['repository', 'workspace', 'user']),
  subject: z.object({
    type: z.string(),
    uuid: z.string().optional(),
    full_name: z.string().optional(),
    name: z.string().optional(),
  }),
  active: z.boolean().default(true),
  events: z
    .array(
      z.enum([
        'repo:push',
        'repo:fork',
        'repo:updated',
        'repo:commit_comment_created',
        'repo:commit_status_created',
        'repo:commit_status_updated',
        'issue:created',
        'issue:updated',
        'issue:comment_created',
        'pullrequest:created',
        'pullrequest:updated',
        'pullrequest:approved',
        'pullrequest:unapproved',
        'pullrequest:fulfilled',
        'pullrequest:rejected',
        'pullrequest:comment_created',
        'pullrequest:comment_updated',
        'pullrequest:comment_deleted',
      ])
    )
    .min(1, 'At least one event must be specified'),
  createdAt: z.union([z.string(), z.number(), z.date()]),
  updatedAt: z.union([z.string(), z.number(), z.date()]),
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
  }),
});

export type Webhook = z.infer<typeof WebhookSchema>;

// Pipeline Target Schema (Cloud Only)
export const PipelineTargetSchema = z.object({
  type: z.enum(['pipeline_ref_target', 'pipeline_commit_target']),
  ref_type: z.enum(['branch', 'tag', 'bookmark']).optional(),
  ref_name: z.string().optional(),
  commit: z
    .object({
      type: z.literal('commit'),
      hash: z.string().regex(/^[a-f0-9]{40}$/, 'Commit hash must be valid'),
      links: z.object({
        self: z.object({
          href: z.string().url(),
        }),
      }),
    })
    .optional(),
  selector: z
    .object({
      type: z.string(),
      pattern: z.string(),
    })
    .optional(),
});

export type PipelineTarget = z.infer<typeof PipelineTargetSchema>;

// Pipeline State Schema (Cloud Only)
export const PipelineStateSchema = z.object({
  name: z.enum(['PENDING', 'IN_PROGRESS', 'SUCCESSFUL', 'FAILED', 'STOPPED', 'PAUSED', 'ERROR']),
  type: z.enum([
    'pipeline_state_pending',
    'pipeline_state_in_progress',
    'pipeline_state_successful',
    'pipeline_state_failed',
    'pipeline_state_stopped',
    'pipeline_state_paused',
    'pipeline_state_error',
  ]),
  result: z
    .object({
      name: z.enum(['SUCCESSFUL', 'FAILED', 'ERROR', 'STOPPED']),
      type: z.string(),
    })
    .optional(),
});

export type PipelineState = z.infer<typeof PipelineStateSchema>;

// Pipeline Schema (Cloud Only)
export const PipelineSchema = z.object({
  type: z.literal('pipeline'),
  uuid: z.string().min(1, 'Pipeline UUID is required'),
  build_number: z.number().int().positive('Build number must be positive'),
  creator: UserSchema,
  repository: RepositorySchema,
  target: PipelineTargetSchema,
  trigger: z.object({
    type: z.enum(['push', 'pull_request', 'manual', 'schedule']),
    name: z.string(),
  }),
  state: PipelineStateSchema,
  created_on: z.union([z.string(), z.number(), z.date()]),
  completed_on: z.union([z.string(), z.number(), z.date()]).optional(),
  run_number: z.number().int().optional(),
  duration_in_seconds: z.number().int().min(0).optional(),
  build_seconds_used: z.number().int().min(0).default(0),
  first_successful: z.boolean().default(false),
  expired: z.boolean().default(false),
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
    steps: z.object({
      href: z.string().url(),
    }),
  }),
});

export type Pipeline = z.infer<typeof PipelineSchema>;

// Pipeline Step Schema (Cloud Only)
export const PipelineStepSchema = z.object({
  type: z.literal('pipeline_step'),
  uuid: z.string().min(1, 'Step UUID is required'),
  name: z.string().min(1, 'Step name is required'),
  image: z
    .object({
      name: z.string(),
    })
    .optional(),
  script_commands: z
    .array(
      z.object({
        command: z.string(),
        name: z.string().optional(),
      })
    )
    .default([]),
  setup_commands: z
    .array(
      z.object({
        command: z.string(),
        name: z.string().optional(),
      })
    )
    .default([]),
  state: PipelineStateSchema,
  max_time: z.number().int().positive('Max time must be positive').default(120),
  started_on: z.union([z.string(), z.number(), z.date()]).optional(),
  completed_on: z.union([z.string(), z.number(), z.date()]).optional(),
  duration_in_seconds: z.number().int().min(0).optional(),
});

export type PipelineStep = z.infer<typeof PipelineStepSchema>;

// Snippet Schema (Cloud Only)
export const SnippetSchema = z.object({
  type: z.literal('snippet'),
  id: z.string().min(1, 'Snippet ID is required'),
  title: z.string().min(1, 'Snippet title is required'),
  scm: z.enum(['git', 'hg']).default('git'),
  is_private: z.boolean().default(false),
  owner: UserSchema,
  creator: UserSchema,
  created_on: z.union([z.string(), z.number(), z.date()]),
  updated_on: z.union([z.string(), z.number(), z.date()]),
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
    html: z.object({
      href: z.string().url(),
    }),
    comments: z.object({
      href: z.string().url(),
    }),
    watchers: z.object({
      href: z.string().url(),
    }),
    commits: z.object({
      href: z.string().url(),
    }),
  }),
});

export type Snippet = z.infer<typeof SnippetSchema>;

// SSH Key Schema (Cloud Only)
export const SSHKeySchema = z.object({
  type: z.literal('ssh_key'),
  uuid: z.string().min(1, 'SSH key UUID is required'),
  key: z.string().min(1, 'SSH key is required'),
  label: z.string().min(1, 'SSH key label is required'),
  comment: z.string().optional(),
  created_on: z.union([z.string(), z.number(), z.date()]),
  last_used: z.union([z.string(), z.number(), z.date()]).optional(),
  owner: UserSchema,
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
  }),
});

export type SSHKey = z.infer<typeof SSHKeySchema>;

// GPG Key Schema (Cloud Only)
export const GPGKeySchema = z.object({
  type: z.literal('gpg_key'),
  id: z.string().min(1, 'GPG key ID is required'),
  key_id: z.string().min(1, 'GPG key ID is required'),
  user_id: z.string().min(1, 'User ID is required'),
  key: z.string().min(1, 'GPG key is required'),
  created_on: z.union([z.string(), z.number(), z.date()]),
  owner: UserSchema,
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
  }),
});

export type GPGKey = z.infer<typeof GPGKeySchema>;

// Branch Restriction Schema (Cloud Only)
export const BranchRestrictionSchema = z.object({
  type: z.literal('branchrestriction'),
  id: z.number().int().positive('Restriction ID must be positive'),
  kind: z.enum(['push', 'delete', 'force', 'restrict_merges']),
  branch_match_kind: z.enum(['branching_model', 'glob']),
  branch_type: z
    .enum(['feature', 'bugfix', 'release', 'hotfix', 'development', 'production'])
    .optional(),
  pattern: z.string().optional(),
  users: z.array(UserSchema).default([]),
  groups: z
    .array(
      z.object({
        type: z.literal('group'),
        name: z.string(),
        slug: z.string(),
      })
    )
    .default([]),
  value: z.union([z.number(), z.string()]).optional(),
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
  }),
});

export type BranchRestriction = z.infer<typeof BranchRestrictionSchema>;

// Commit Status Schema (Cloud Only)
export const CommitStatusSchema = z.object({
  type: z.literal('build'),
  uuid: z.string().min(1, 'Status UUID is required'),
  key: z.string().min(1, 'Status key is required'),
  state: z.enum(['SUCCESSFUL', 'FAILED', 'INPROGRESS', 'STOPPED']),
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  refname: z.string().optional(),
  commit: z.object({
    type: z.literal('commit'),
    hash: z.string().regex(/^[a-f0-9]{40}$/),
    links: z.object({
      self: z.object({
        href: z.string().url(),
      }),
    }),
  }),
  created_on: z.union([z.string(), z.number(), z.date()]),
  updated_on: z.union([z.string(), z.number(), z.date()]),
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
    commit: z.object({
      href: z.string().url(),
    }),
  }),
});

export type CommitStatus = z.infer<typeof CommitStatusSchema>;

// Deployment Environment Schema (Cloud Only)
export const DeploymentEnvironmentSchema = z.object({
  type: z.literal('deployment_environment'),
  uuid: z.string().min(1, 'Environment UUID is required'),
  name: z.string().min(1, 'Environment name is required'),
  environment_type: z.object({
    type: z.literal('deployment_environment_type'),
    name: z.enum(['Test', 'Staging', 'Production']),
  }),
  rank: z.number().int().min(0).default(0),
  hidden: z.boolean().default(false),
  restrictions: z
    .object({
      type: z.literal('deployment_restrictions'),
      admin_only: z.boolean().default(false),
    })
    .optional(),
});

export type DeploymentEnvironment = z.infer<typeof DeploymentEnvironmentSchema>;

// Deployment Schema (Cloud Only)
export const DeploymentSchema = z.object({
  type: z.literal('deployment'),
  uuid: z.string().min(1, 'Deployment UUID is required'),
  name: z.string().min(1, 'Deployment name is required'),
  key: z.string().min(1, 'Deployment key is required'),
  version: z.number().int().min(1).default(1),
  last_update_time: z.union([z.string(), z.number(), z.date()]),
  environment: DeploymentEnvironmentSchema,
  release: z
    .object({
      type: z.literal('deployment_release'),
      uuid: z.string(),
      name: z.string(),
      url: z.string().url().optional(),
      commit: z.object({
        type: z.literal('commit'),
        hash: z.string().regex(/^[a-f0-9]{40}$/),
      }),
    })
    .optional(),
  state: z.object({
    type: z.literal('deployment_state'),
    name: z.enum(['UNDEPLOYED', 'IN_PROGRESS', 'SUCCESSFUL', 'FAILED', 'STOPPED']),
    url: z.string().url().optional(),
    deployer: UserSchema.optional(),
    start_date: z.union([z.string(), z.number(), z.date()]).optional(),
    completion_date: z.union([z.string(), z.number(), z.date()]).optional(),
  }),
});

export type Deployment = z.infer<typeof DeploymentSchema>;

// Download Schema (Cloud Only)
export const DownloadSchema = z.object({
  type: z.literal('download'),
  name: z.string().min(1, 'Download name is required'),
  size: z.number().int().min(0, 'Size must be non-negative'),
  links: z.object({
    self: z.object({
      href: z.string().url(),
    }),
  }),
});

export type Download = z.infer<typeof DownloadSchema>;

// Validation helpers for Cloud types
export const validateWorkspace = (workspace: unknown): Workspace => {
  return WorkspaceSchema.parse(workspace);
};

export const validateIssue = (issue: unknown): Issue => {
  return IssueSchema.parse(issue);
};

export const validateWebhook = (webhook: unknown): Webhook => {
  return WebhookSchema.parse(webhook);
};

export const validatePipeline = (pipeline: unknown): Pipeline => {
  return PipelineSchema.parse(pipeline);
};

export const validatePipelineStep = (step: unknown): PipelineStep => {
  return PipelineStepSchema.parse(step);
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

export const validateBranchRestriction = (restriction: unknown): BranchRestriction => {
  return BranchRestrictionSchema.parse(restriction);
};

export const validateCommitStatus = (status: unknown): CommitStatus => {
  return CommitStatusSchema.parse(status);
};

export const validateDeployment = (deployment: unknown): Deployment => {
  return DeploymentSchema.parse(deployment);
};

export const validateDownload = (download: unknown): Download => {
  return DownloadSchema.parse(download);
};
