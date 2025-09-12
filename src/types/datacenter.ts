import { z } from 'zod';
import { UserSchema, RepositorySchema, User } from './bitbucket';

// ===== BITBUCKET DATA CENTER SPECIFIC TYPES =====

// Project Links Schema
export const ProjectLinksSchema = z.object({
  self: z
    .array(
      z.object({
        href: z.string().url(),
        rel: z.string().optional(),
      })
    )
    .optional(),
  avatar: z
    .array(
      z.object({
        href: z.string().url(),
        rel: z.string().optional(),
      })
    )
    .optional(),
  clone: z
    .array(
      z.object({
        href: z.string().url(),
        name: z.string(),
      })
    )
    .optional(),
});

export type ProjectLinks = z.infer<typeof ProjectLinksSchema>;

// Project Schema (Data Center Only)
export const ProjectSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(10, 'Project key must be 1-10 characters')
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      'Project key must start with a letter and contain only uppercase letters, numbers, and underscores'
    ),
  id: z.number().int().positive('Project ID must be positive'),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  public: z.boolean().default(false),
  type: z.enum(['NORMAL', 'PERSONAL']).default('NORMAL'),
  links: ProjectLinksSchema.optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

// OAuth Application Schema (Data Center Only)
export const OAuthApplicationSchema = z.object({
  id: z.string().min(1, 'Application ID is required'),
  name: z.string().min(1, 'Application name is required'),
  description: z.string().optional(),
  url: z.string().url().optional(),
  callback_url: z.string().url().optional(),
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().optional(), // Only returned on creation
  scopes: z
    .array(
      z.enum([
        'REPO_READ',
        'REPO_WRITE',
        'REPO_ADMIN',
        'PROJECT_READ',
        'PROJECT_WRITE',
        'PROJECT_ADMIN',
        'USER',
      ])
    )
    .default([]),
  created_date: z.union([z.string(), z.number(), z.date()]),
  updated_date: z.union([z.string(), z.number(), z.date()]),
});

export type OAuthApplication = z.infer<typeof OAuthApplicationSchema>;

// OAuth Token Schema (Data Center Only)
export const OAuthTokenSchema = z.object({
  id: z.string().min(1, 'Token ID is required'),
  name: z.string().min(1, 'Token name is required'),
  created_date: z.union([z.string(), z.number(), z.date()]),
  expires_date: z.union([z.string(), z.number(), z.date()]).optional(),
  scopes: z.array(z.string()).default([]),

  // Response-only fields (returned on creation/refresh)
  access_token: z.string().optional(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().int().positive().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export type OAuthToken = z.infer<typeof OAuthTokenSchema>;

// Personal Access Token Schema (Data Center Only)
export const PersonalAccessTokenSchema = z.object({
  id: z.number().int().positive('Token ID must be positive'),
  name: z.string().min(1, 'Token name is required'),
  token: z.string().optional(), // Only returned on creation
  permissions: z
    .array(
      z.enum([
        'REPO_READ',
        'REPO_WRITE',
        'REPO_ADMIN',
        'PROJECT_READ',
        'PROJECT_WRITE',
        'PROJECT_ADMIN',
      ])
    )
    .default([]),
  created_date: z.union([z.string(), z.number(), z.date()]),
  last_authenticated: z.union([z.string(), z.number(), z.date()]).optional(),
  user: UserSchema,
});

export type PersonalAccessToken = z.infer<typeof PersonalAccessTokenSchema>;

// Group Schema (Data Center Only)
export const GroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true),
  memberCount: z.number().int().min(0).optional(),
});

export type Group = z.infer<typeof GroupSchema>;

// Permission Schema (Data Center Only)
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
      'SYS_ADMIN',
    ]),
  })
  .refine(data => (data.user && !data.group) || (!data.user && data.group), {
    message: 'Either user or group must be specified, but not both',
  });

export type Permission = z.infer<typeof PermissionSchema>;

// Hook Configuration Schema
export const HookConfigurationSchema = z.object({
  url: z.string().url('Hook URL must be valid'),
  secret: z.string().optional(),
  ssl_verification_enabled: z.boolean().default(true),
  commit_message_template: z.string().optional(),
});

export type HookConfiguration = z.infer<typeof HookConfigurationSchema>;

// Hook Schema (Data Center Only)
export const HookSchema = z.object({
  id: z.number().int().positive('Hook ID must be positive'),
  name: z.string().min(1, 'Hook name is required'),
  type: z.enum(['POST_RECEIVE', 'PRE_RECEIVE', 'UPDATE']).default('POST_RECEIVE'),
  scope: z.enum(['GLOBAL', 'PROJECT', 'REPOSITORY']),
  enabled: z.boolean().default(true),
  configured: z.boolean().default(false),
  configuration: HookConfigurationSchema.optional(),
  events: z
    .array(
      z.enum([
        'repo:refs_changed',
        'repo:modified',
        'repo:forked',
        'repo:comment:added',
        'repo:comment:edited',
        'repo:comment:deleted',
        'pr:opened',
        'pr:reviewer:approved',
        'pr:reviewer:unapproved',
        'pr:reviewer:needs_work',
        'pr:modified',
        'pr:merged',
        'pr:declined',
        'pr:deleted',
        'pr:comment:added',
        'pr:comment:edited',
        'pr:comment:deleted',
      ])
    )
    .default([]),
});

export type Hook = z.infer<typeof HookSchema>;

// Repository Hook Schema (Data Center Only)
export const RepositoryHookSchema = HookSchema.extend({
  scope: z.literal('REPOSITORY'),
  repository: RepositorySchema,
});

export type RepositoryHook = z.infer<typeof RepositoryHookSchema>;

// Project Hook Schema (Data Center Only)
export const ProjectHookSchema = HookSchema.extend({
  scope: z.literal('PROJECT'),
  project: ProjectSchema,
});

export type ProjectHook = z.infer<typeof ProjectHookSchema>;

// Global Hook Schema (Data Center Only)
export const GlobalHookSchema = HookSchema.extend({
  scope: z.literal('GLOBAL'),
});

export type GlobalHook = z.infer<typeof GlobalHookSchema>;

// Branch Permission Schema (Data Center Only)
export const BranchPermissionSchema = z.object({
  id: z.number().int().positive('Permission ID must be positive'),
  type: z.enum(['fast-forward-only', 'no-deletes', 'pull-request-only', 'read-only']),
  matcher: z.object({
    id: z.string(),
    displayId: z.string(),
    type: z.object({
      id: z.enum(['BRANCH', 'PATTERN', 'MODEL_CATEGORY']),
      name: z.string(),
    }),
    active: z.boolean().default(true),
  }),
  users: z.array(UserSchema).default([]),
  groups: z.array(GroupSchema).default([]),
  accessKeys: z
    .array(
      z.object({
        key: z.object({
          id: z.number(),
          text: z.string(),
          label: z.string(),
        }),
        repository: RepositorySchema.optional(),
        project: ProjectSchema.optional(),
      })
    )
    .default([]),
});

export type BranchPermission = z.infer<typeof BranchPermissionSchema>;

// Repository Settings Schema (Data Center Only)
export const RepositorySettingsSchema = z.object({
  defaultBranch: z.string().optional(),
  pullRequestSettings: z
    .object({
      mergeConfig: z.object({
        defaultStrategy: z.object({
          id: z.enum(['merge-commit', 'squash', 'fast-forward', 'rebase-merge']),
          name: z.string(),
        }),
        strategies: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              enabled: z.boolean(),
            })
          )
          .default([]),
      }),
      requiredApprovers: z.number().int().min(0).default(0),
      requiredAllApprovers: z.boolean().default(false),
      requiredAllTasksComplete: z.boolean().default(false),
      requiredSuccessfulBuilds: z.number().int().min(0).default(0),
    })
    .optional(),
  branchModel: z
    .object({
      development: z
        .object({
          refId: z.string(),
          useDefault: z.boolean(),
        })
        .optional(),
      production: z
        .object({
          refId: z.string(),
          useDefault: z.boolean(),
        })
        .optional(),
      types: z
        .array(
          z.object({
            id: z.enum(['BUGFIX', 'FEATURE', 'HOTFIX', 'RELEASE']),
            displayName: z.string(),
            prefix: z.string(),
            enabled: z.boolean(),
          })
        )
        .default([]),
    })
    .optional(),
});

export type RepositorySettings = z.infer<typeof RepositorySettingsSchema>;

// Project Settings Schema (Data Center Only)
export const ProjectSettingsSchema = z.object({
  defaultReviewers: z.array(UserSchema).default([]),
  requiredApprovers: z.number().int().min(0).default(0),
  requiredAllApprovers: z.boolean().default(false),
  requiredAllTasksComplete: z.boolean().default(false),
  webhooks: z
    .object({
      enabled: z.boolean().default(true),
      url: z.string().url().optional(),
      secret: z.string().optional(),
    })
    .optional(),
});

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

// User Session Schema (Data Center Only)
export const UserSessionSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
  user: UserSchema,
  created_date: z.union([z.string(), z.number(), z.date()]),
  last_accessed: z.union([z.string(), z.number(), z.date()]),
  expires_date: z.union([z.string(), z.number(), z.date()]).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  active: z.boolean().default(true),
});

export type UserSession = z.infer<typeof UserSessionSchema>;

// License Schema (Data Center Only)
export const LicenseSchema = z.object({
  serverId: z.string(),
  supportEntitlementNumber: z.string().optional(),
  creationDate: z.union([z.string(), z.number(), z.date()]),
  purchaseDate: z.union([z.string(), z.number(), z.date()]).optional(),
  expiryDate: z.union([z.string(), z.number(), z.date()]).optional(),
  maintenanceExpiryDate: z.union([z.string(), z.number(), z.date()]).optional(),
  maximumNumberOfUsers: z.number().int().positive().optional(),
  unlimitedNumberOfUsers: z.boolean().default(false),
  licenseType: z.enum([
    'COMMERCIAL',
    'COMMUNITY',
    'OPEN_SOURCE',
    'NON_PROFIT',
    'DEMONSTRATION',
    'DEVELOPER',
  ]),
  organization: z.string(),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export type License = z.infer<typeof LicenseSchema>;

// System Information Schema (Data Center Only)
export const SystemInfoSchema = z.object({
  version: z.string(),
  buildNumber: z.string(),
  buildDate: z.union([z.string(), z.number(), z.date()]),
  displayVersion: z.string(),
  scmVersion: z.string(),
  serverTime: z.union([z.string(), z.number(), z.date()]),
  serverTimeZone: z.string(),
  databaseUrl: z.string().optional(),
  databaseDriver: z.string().optional(),
  uptime: z.number().int().min(0),
  state: z.enum(['STARTING', 'RUNNING', 'STOPPING', 'FIRST_RUN']),
});

export type SystemInfo = z.infer<typeof SystemInfoSchema>;

// Validation helpers for Data Center types
export const validateProject = (project: unknown): Project => {
  return ProjectSchema.parse(project);
};

export const validateOAuthApplication = (app: unknown): OAuthApplication => {
  return OAuthApplicationSchema.parse(app);
};

export const validateOAuthToken = (token: unknown): OAuthToken => {
  return OAuthTokenSchema.parse(token);
};

export const validatePersonalAccessToken = (token: unknown): PersonalAccessToken => {
  return PersonalAccessTokenSchema.parse(token);
};

export const validateGroup = (group: unknown): Group => {
  return GroupSchema.parse(group);
};

export const validatePermission = (permission: unknown): Permission => {
  return PermissionSchema.parse(permission);
};

export const validateHook = (hook: unknown): Hook => {
  return HookSchema.parse(hook);
};

export const validateRepositoryHook = (hook: unknown): RepositoryHook => {
  return RepositoryHookSchema.parse(hook);
};

export const validateProjectHook = (hook: unknown): ProjectHook => {
  return ProjectHookSchema.parse(hook);
};

export const validateBranchPermission = (permission: unknown): BranchPermission => {
  return BranchPermissionSchema.parse(permission);
};

export const validateRepositorySettings = (settings: unknown): RepositorySettings => {
  return RepositorySettingsSchema.parse(settings);
};

export const validateProjectSettings = (settings: unknown): ProjectSettings => {
  return ProjectSettingsSchema.parse(settings);
};

export const validateUserSession = (session: unknown): UserSession => {
  return UserSessionSchema.parse(session);
};

export const validateLicense = (license: unknown): License => {
  return LicenseSchema.parse(license);
};

export const validateSystemInfo = (info: unknown): SystemInfo => {
  return SystemInfoSchema.parse(info);
};

// Utility functions
export const isValidProjectKey = (key: string): boolean => {
  return /^[A-Z][A-Z0-9_]*$/.test(key) && key.length >= 1 && key.length <= 10;
};

export const generateProjectKey = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .substring(0, 10);
};

export const isPersonalProject = (project: Project): boolean => {
  return project.type === 'PERSONAL';
};

export const isPublicProject = (project: Project): boolean => {
  return project.public === true;
};

export const hasPermission = (
  permissions: Permission[],
  user: User | string,
  requiredPermission: Permission['permission']
): boolean => {
  const username = typeof user === 'string' ? user : user.name;
  return permissions.some(
    p =>
      p.user?.name === username &&
      (p.permission === requiredPermission || p.permission.includes('ADMIN'))
  );
};

export const getEffectivePermissions = (
  permissions: Permission[],
  user: User,
  userGroups: Group[]
): Permission['permission'][] => {
  const userPermissions = permissions
    .filter(p => p.user?.name === user.name)
    .map(p => p.permission);

  const groupPermissions = permissions
    .filter(p => p.group && userGroups.some(g => g.name === p.group?.name))
    .map(p => p.permission);

  return [...new Set([...userPermissions, ...groupPermissions])];
};
