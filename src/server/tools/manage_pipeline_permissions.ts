/**
 * Manage Pipeline Permissions Tool
 * 
 * MCP tool for managing user and group permissions for CI/CD pipelines
 * in Bitbucket repositories with comprehensive access control and auditing.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ManagePipelinePermissionsSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  action: z.enum(['grant', 'revoke', 'list', 'update', 'audit'], {
    errorMap: () => ({ message: 'Action must be grant, revoke, list, update, or audit' })
  }),
  permissions: z.array(z.object({
    user: z.string().optional(),
    group: z.string().optional(),
    role: z.enum(['admin', 'execute', 'view', 'configure']),
    scope: z.enum(['pipeline', 'repository', 'global']).optional(),
    conditions: z.object({
      branches: z.array(z.string()).optional(),
      time_restrictions: z.object({
        start_time: z.string().optional(),
        end_time: z.string().optional(),
        days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional()
      }).optional(),
      ip_restrictions: z.array(z.string()).optional()
    }).optional()
  })).optional(),
  options: z.object({
    inherit_from_repository: z.boolean().optional(),
    notify_users: z.boolean().optional(),
    audit_changes: z.boolean().optional(),
    validate_permissions: z.boolean().optional()
  }).optional()
});

type ManagePipelinePermissionsInput = z.infer<typeof ManagePipelinePermissionsSchema>;

// Output validation schema
const ManagePipelinePermissionsOutputSchema = z.object({
  success: z.boolean(),
  result: z.object({
    action: z.enum(['grant', 'revoke', 'list', 'update', 'audit']),
    pipeline_id: z.string(),
    repository: z.string(),
    permissions: z.array(z.object({
      id: z.string(),
      user: z.string().optional(),
      group: z.string().optional(),
      role: z.enum(['admin', 'execute', 'view', 'configure']),
      scope: z.enum(['pipeline', 'repository', 'global']),
      conditions: z.object({
        branches: z.array(z.string()).optional(),
        time_restrictions: z.object({
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          days: z.array(z.string()).optional()
        }).optional(),
        ip_restrictions: z.array(z.string()).optional()
      }).optional(),
      granted_at: z.string(),
      granted_by: z.string(),
      expires_at: z.string().optional()
    })).optional(),
    audit_log: z.array(z.object({
      action: z.string(),
      user: z.string(),
      timestamp: z.string(),
      details: z.string(),
      ip_address: z.string().optional()
    })).optional(),
    summary: z.object({
      total_permissions: z.number(),
      admin_count: z.number(),
      execute_count: z.number(),
      view_count: z.number(),
      configure_count: z.number(),
      last_updated: z.string().optional()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

type ManagePipelinePermissionsOutput = z.infer<typeof ManagePipelinePermissionsOutputSchema>;

/**
 * Manage Pipeline Permissions MCP Tool
 * 
 * Manages user and group permissions for CI/CD pipelines with comprehensive
 * access control, role-based permissions, and auditing capabilities.
 * 
 * Features:
 * - Grant and revoke pipeline permissions
 * - Role-based access control (admin, execute, view, configure)
 * - User and group permission management
 * - Scope-based permissions (pipeline, repository, global)
 * - Conditional permissions with time and IP restrictions
 * - Comprehensive audit logging
 * - Permission validation and inheritance
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline permissions management parameters
 * @returns Pipeline permissions management result
 */
export const managePipelinePermissionsTool: Tool = {
  name: 'manage_pipeline_permissions',
  description: 'Manage user and group permissions for CI/CD pipelines with comprehensive access control and auditing',
  inputSchema: {
    type: 'object',
    properties: {
      pipeline_id: {
        type: 'string',
        description: 'Pipeline identifier'
      },
      repository: {
        type: 'string',
        description: 'Repository identifier (e.g., "project/repo" or repository UUID)'
      },
      action: {
        type: 'string',
        enum: ['grant', 'revoke', 'list', 'update', 'audit'],
        description: 'Action to perform on pipeline permissions'
      },
      permissions: {
        type: 'array',
        description: 'Permissions to manage (required for grant, revoke, update actions)',
        items: {
          type: 'object',
          properties: {
            user: {
              type: 'string',
              description: 'Username or user ID'
            },
            group: {
              type: 'string',
              description: 'Group name or group ID'
            },
            role: {
              type: 'string',
              enum: ['admin', 'execute', 'view', 'configure'],
              description: 'Permission role'
            },
            scope: {
              type: 'string',
              enum: ['pipeline', 'repository', 'global'],
              description: 'Permission scope'
            },
            conditions: {
              type: 'object',
              description: 'Permission conditions',
              properties: {
                branches: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Branch restrictions'
                },
                time_restrictions: {
                  type: 'object',
                  description: 'Time-based restrictions',
                  properties: {
                    start_time: {
                      type: 'string',
                      description: 'Start time (HH:MM format)'
                    },
                    end_time: {
                      type: 'string',
                      description: 'End time (HH:MM format)'
                    },
                    days: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                      },
                      description: 'Allowed days of the week'
                    }
                  }
                },
                ip_restrictions: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'IP address restrictions'
                }
              }
            }
          },
          required: ['role']
        }
      },
      options: {
        type: 'object',
        description: 'Optional management options',
        properties: {
          inherit_from_repository: {
            type: 'boolean',
            description: 'Whether to inherit permissions from repository'
          },
          notify_users: {
            type: 'boolean',
            description: 'Whether to notify users of permission changes'
          },
          audit_changes: {
            type: 'boolean',
            description: 'Whether to audit permission changes'
          },
          validate_permissions: {
            type: 'boolean',
            description: 'Whether to validate permission configurations'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'action']
  }
};

/**
 * Execute pipeline permissions management
 * 
 * @param input - Pipeline permissions management parameters
 * @returns Pipeline permissions management result
 */
export async function executeManagePipelinePermissions(input: ManagePipelinePermissionsInput): Promise<ManagePipelinePermissionsOutput> {
  try {
    // Validate input
    const validatedInput = ManagePipelinePermissionsSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      action: validatedInput.action,
      permissions: validatedInput.permissions?.map(permission => ({
        user: permission.user?.trim(),
        group: permission.group?.trim(),
        role: permission.role,
        scope: permission.scope || 'pipeline',
        conditions: permission.conditions
      })),
      options: validatedInput.options || {
        inherit_from_repository: false,
        notify_users: true,
        audit_changes: true,
        validate_permissions: true
      }
    };

    // Validate pipeline ID
    if (!sanitizedInput.pipeline_id) {
      return {
        success: false,
        error: 'Pipeline ID is required'
      };
    }

    // Validate repository access
    if (!sanitizedInput.repository) {
      return {
        success: false,
        error: 'Repository identifier is required'
      };
    }

    // Validate action-specific requirements
    if (['grant', 'revoke', 'update'].includes(sanitizedInput.action) && (!sanitizedInput.permissions || sanitizedInput.permissions.length === 0)) {
      return {
        success: false,
        error: 'Permissions are required for grant, revoke, and update actions'
      };
    }

    // Validate permissions
    if (sanitizedInput.permissions) {
      for (const permission of sanitizedInput.permissions) {
        if (!permission.user && !permission.group) {
          return {
            success: false,
            error: 'Either user or group must be specified for each permission'
          };
        }

        if (permission.user && permission.group) {
          return {
            success: false,
            error: 'Cannot specify both user and group for the same permission'
          };
        }

        if (permission.conditions?.time_restrictions) {
          const timeRestrictions = permission.conditions.time_restrictions;
          if (timeRestrictions.start_time && timeRestrictions.end_time) {
            const startTime = timeRestrictions.start_time;
            const endTime = timeRestrictions.end_time;
            if (startTime >= endTime) {
              return {
                success: false,
                error: 'Start time must be before end time'
              };
            }
          }
        }
      }
    }

    // Simulate pipeline permissions management (replace with actual Bitbucket API call)
    const currentTime = new Date();
    
    // Generate sample permissions based on action
    let resultPermissions: any[] = [];
    let auditLog: any[] = [];
    let summary: any = {};

    switch (sanitizedInput.action) {
      case 'grant':
        if (sanitizedInput.permissions) {
          resultPermissions = sanitizedInput.permissions.map((permission, index) => ({
            id: `perm_${index + 1}_${Date.now()}`,
            user: permission.user,
            group: permission.group,
            role: permission.role,
            scope: permission.scope,
            conditions: permission.conditions,
            granted_at: currentTime.toISOString(),
            granted_by: 'current_user',
            expires_at: undefined
          }));

          if (sanitizedInput.options.audit_changes) {
            auditLog = sanitizedInput.permissions.map(permission => ({
              action: 'grant',
              user: 'current_user',
              timestamp: currentTime.toISOString(),
              details: `Granted ${permission.role} permission to ${permission.user || permission.group}`,
              ip_address: '192.168.1.100'
            }));
          }
        }
        break;

      case 'revoke':
        if (sanitizedInput.options.audit_changes) {
          auditLog = sanitizedInput.permissions!.map(permission => ({
            action: 'revoke',
            user: 'current_user',
            timestamp: currentTime.toISOString(),
            details: `Revoked ${permission.role} permission from ${permission.user || permission.group}`,
            ip_address: '192.168.1.100'
          }));
        }
        break;

      case 'list':
        resultPermissions = [
          {
            id: 'perm_001',
            user: 'admin@example.com',
            role: 'admin',
            scope: 'pipeline',
            conditions: {},
            granted_at: new Date(currentTime.getTime() - 3600000).toISOString(),
            granted_by: 'system',
            expires_at: undefined
          },
          {
            id: 'perm_002',
            group: 'developers',
            role: 'execute',
            scope: 'pipeline',
            conditions: {
              branches: ['main', 'develop'],
              time_restrictions: {
                start_time: '09:00',
                end_time: '17:00',
                days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
              }
            },
            granted_at: new Date(currentTime.getTime() - 7200000).toISOString(),
            granted_by: 'admin@example.com',
            expires_at: undefined
          },
          {
            id: 'perm_003',
            user: 'viewer@example.com',
            role: 'view',
            scope: 'pipeline',
            conditions: {},
            granted_at: new Date(currentTime.getTime() - 10800000).toISOString(),
            granted_by: 'admin@example.com',
            expires_at: undefined
          }
        ];
        break;

      case 'update':
        if (sanitizedInput.permissions) {
          resultPermissions = sanitizedInput.permissions.map((permission, index) => ({
            id: `perm_${index + 1}_${Date.now()}`,
            user: permission.user,
            group: permission.group,
            role: permission.role,
            scope: permission.scope,
            conditions: permission.conditions,
            granted_at: new Date(currentTime.getTime() - 3600000).toISOString(),
            granted_by: 'admin@example.com',
            expires_at: undefined
          }));

          if (sanitizedInput.options.audit_changes) {
            auditLog = sanitizedInput.permissions.map(permission => ({
              action: 'update',
              user: 'current_user',
              timestamp: currentTime.toISOString(),
              details: `Updated ${permission.role} permission for ${permission.user || permission.group}`,
              ip_address: '192.168.1.100'
            }));
          }
        }
        break;

      case 'audit':
        auditLog = [
          {
            action: 'grant',
            user: 'admin@example.com',
            timestamp: new Date(currentTime.getTime() - 3600000).toISOString(),
            details: 'Granted execute permission to developers group',
            ip_address: '192.168.1.50'
          },
          {
            action: 'revoke',
            user: 'admin@example.com',
            timestamp: new Date(currentTime.getTime() - 7200000).toISOString(),
            details: 'Revoked admin permission from temp-user@example.com',
            ip_address: '192.168.1.50'
          },
          {
            action: 'grant',
            user: 'admin@example.com',
            timestamp: new Date(currentTime.getTime() - 10800000).toISOString(),
            details: 'Granted view permission to viewer@example.com',
            ip_address: '192.168.1.50'
          }
        ];
        break;
    }

    // Calculate summary
    if (resultPermissions.length > 0) {
      summary = {
        total_permissions: resultPermissions.length,
        admin_count: resultPermissions.filter(p => p.role === 'admin').length,
        execute_count: resultPermissions.filter(p => p.role === 'execute').length,
        view_count: resultPermissions.filter(p => p.role === 'view').length,
        configure_count: resultPermissions.filter(p => p.role === 'configure').length,
        last_updated: currentTime.toISOString()
      };
    }

    const result = {
      action: sanitizedInput.action,
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      permissions: resultPermissions.length > 0 ? resultPermissions : undefined,
      audit_log: auditLog.length > 0 ? auditLog : undefined,
      summary: Object.keys(summary).length > 0 ? summary : undefined
    };

    // Log pipeline permissions management
    console.log(`Pipeline permissions ${sanitizedInput.action}: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      result: result
    };

  } catch (error) {
    console.error('Error managing pipeline permissions:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export default managePipelinePermissionsTool;
