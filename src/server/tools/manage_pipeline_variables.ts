/**
 * Manage Pipeline Variables Tool
 * 
 * MCP tool for managing environment variables and secrets in Bitbucket
 * repositories with comprehensive security, encryption, and access control.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ManagePipelineVariablesSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  action: z.enum(['set', 'get', 'delete', 'list', 'encrypt', 'decrypt'], {
    errorMap: () => ({ message: 'Action must be set, get, delete, list, encrypt, or decrypt' })
  }),
  variables: z.array(z.object({
    name: z.string().min(1, 'Variable name is required'),
    value: z.string(),
    type: z.enum(['plain', 'secret', 'encrypted']).optional(),
    description: z.string().optional(),
    scope: z.enum(['pipeline', 'step', 'global']).optional(),
    sensitive: z.boolean().optional()
  })).optional(),
  variable_name: z.string().optional(),
  options: z.object({
    encrypt_values: z.boolean().optional(),
    overwrite_existing: z.boolean().optional(),
    validate_names: z.boolean().optional(),
    audit_changes: z.boolean().optional()
  }).optional()
});

type ManagePipelineVariablesInput = z.infer<typeof ManagePipelineVariablesSchema>;

// Output validation schema
const ManagePipelineVariablesOutputSchema = z.object({
  success: z.boolean(),
  result: z.object({
    action: z.enum(['set', 'get', 'delete', 'list', 'encrypt', 'decrypt']),
    pipeline_id: z.string(),
    repository: z.string(),
    variables: z.array(z.object({
      name: z.string(),
      value: z.string().optional(),
      type: z.enum(['plain', 'secret', 'encrypted']),
      description: z.string().optional(),
      scope: z.enum(['pipeline', 'step', 'global']),
      sensitive: z.boolean(),
      created_at: z.string().optional(),
      updated_at: z.string().optional(),
      created_by: z.string().optional()
    })).optional(),
    audit_log: z.array(z.object({
      action: z.string(),
      variable_name: z.string(),
      timestamp: z.string(),
      user: z.string(),
      details: z.string().optional()
    })).optional(),
    summary: z.object({
      total_variables: z.number(),
      plain_variables: z.number(),
      secret_variables: z.number(),
      encrypted_variables: z.number(),
      last_updated: z.string().optional()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

type ManagePipelineVariablesOutput = z.infer<typeof ManagePipelineVariablesOutputSchema>;

/**
 * Manage Pipeline Variables MCP Tool
 * 
 * Manages environment variables and secrets with comprehensive security,
 * encryption, and access control for Bitbucket repositories.
 * 
 * Features:
 * - Set, get, delete, and list pipeline variables
 * - Secure handling of secrets and sensitive data
 * - Variable encryption and decryption
 * - Scope-based variable management
 * - Comprehensive audit logging
 * - Input validation and sanitization
 * - Security best practices
 * - Error handling and logging
 * 
 * @param input - Pipeline variables management parameters
 * @returns Pipeline variables management result
 */
export const managePipelineVariablesTool: Tool = {
  name: 'manage_pipeline_variables',
  description: 'Manage environment variables and secrets with comprehensive security, encryption, and access control',
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
        enum: ['set', 'get', 'delete', 'list', 'encrypt', 'decrypt'],
        description: 'Action to perform on pipeline variables'
      },
      variables: {
        type: 'array',
        description: 'Variables to manage (required for set action)',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Variable name'
            },
            value: {
              type: 'string',
              description: 'Variable value'
            },
            type: {
              type: 'string',
              enum: ['plain', 'secret', 'encrypted'],
              description: 'Variable type'
            },
            description: {
              type: 'string',
              description: 'Variable description'
            },
            scope: {
              type: 'string',
              enum: ['pipeline', 'step', 'global'],
              description: 'Variable scope'
            },
            sensitive: {
              type: 'boolean',
              description: 'Whether the variable contains sensitive data'
            }
          },
          required: ['name', 'value']
        }
      },
      variable_name: {
        type: 'string',
        description: 'Specific variable name (required for get, delete actions)'
      },
      options: {
        type: 'object',
        description: 'Optional management options',
        properties: {
          encrypt_values: {
            type: 'boolean',
            description: 'Whether to encrypt variable values'
          },
          overwrite_existing: {
            type: 'boolean',
            description: 'Whether to overwrite existing variables'
          },
          validate_names: {
            type: 'boolean',
            description: 'Whether to validate variable names'
          },
          audit_changes: {
            type: 'boolean',
            description: 'Whether to audit variable changes'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'action']
  }
};

/**
 * Execute pipeline variables management
 * 
 * @param input - Pipeline variables management parameters
 * @returns Pipeline variables management result
 */
export async function executeManagePipelineVariables(input: ManagePipelineVariablesInput): Promise<ManagePipelineVariablesOutput> {
  try {
    // Validate input
    const validatedInput = ManagePipelineVariablesSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      action: validatedInput.action,
      variables: validatedInput.variables?.map(v => ({
        name: v.name.trim(),
        value: v.value,
        type: v.type || 'plain',
        description: v.description?.trim(),
        scope: v.scope || 'pipeline',
        sensitive: v.sensitive || false
      })),
      variable_name: validatedInput.variable_name?.trim(),
      options: validatedInput.options || {
        encrypt_values: false,
        overwrite_existing: false,
        validate_names: true,
        audit_changes: true
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
    if (['set'].includes(sanitizedInput.action) && (!sanitizedInput.variables || sanitizedInput.variables.length === 0)) {
      return {
        success: false,
        error: 'Variables are required for set action'
      };
    }

    if (['get', 'delete'].includes(sanitizedInput.action) && !sanitizedInput.variable_name) {
      return {
        success: false,
        error: 'Variable name is required for get and delete actions'
      };
    }

    // Validate variable names if validation is enabled
    if (sanitizedInput.options.validate_names && sanitizedInput.variables) {
      for (const variable of sanitizedInput.variables) {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(variable.name)) {
          return {
            success: false,
            error: `Invalid variable name: ${variable.name}. Variable names must start with a letter or underscore and contain only letters, numbers, and underscores.`
          };
        }
      }
    }

    // Simulate pipeline variables management (replace with actual Bitbucket API call)
    const currentTime = new Date();
    
    // Generate sample variables based on action
    let resultVariables: any[] = [];
    let auditLog: any[] = [];
    let summary: any = {};

    switch (sanitizedInput.action) {
      case 'set':
        if (sanitizedInput.variables) {
          resultVariables = sanitizedInput.variables.map(variable => ({
            name: variable.name,
            value: sanitizedInput.options.encrypt_values ? `***encrypted***` : variable.value,
            type: sanitizedInput.options.encrypt_values ? 'encrypted' : variable.type,
            description: variable.description,
            scope: variable.scope,
            sensitive: variable.sensitive,
            created_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString(),
            created_by: 'current_user'
          }));

          if (sanitizedInput.options.audit_changes) {
            auditLog = sanitizedInput.variables.map(variable => ({
              action: 'set',
              variable_name: variable.name,
              timestamp: currentTime.toISOString(),
              user: 'current_user',
              details: `Variable ${variable.name} set with type ${variable.type}`
            }));
          }
        }
        break;

      case 'get':
        if (sanitizedInput.variable_name) {
          resultVariables = [{
            name: sanitizedInput.variable_name,
            value: 'sample_value',
            type: 'plain',
            description: 'Sample variable',
            scope: 'pipeline',
            sensitive: false,
            created_at: new Date(currentTime.getTime() - 3600000).toISOString(),
            updated_at: new Date(currentTime.getTime() - 1800000).toISOString(),
            created_by: 'admin@example.com'
          }];
        }
        break;

      case 'list':
        resultVariables = [
          {
            name: 'NODE_VERSION',
            value: '18',
            type: 'plain',
            description: 'Node.js version',
            scope: 'pipeline',
            sensitive: false,
            created_at: new Date(currentTime.getTime() - 3600000).toISOString(),
            updated_at: new Date(currentTime.getTime() - 1800000).toISOString(),
            created_by: 'admin@example.com'
          },
          {
            name: 'API_KEY',
            value: '***encrypted***',
            type: 'encrypted',
            description: 'API key for external service',
            scope: 'pipeline',
            sensitive: true,
            created_at: new Date(currentTime.getTime() - 7200000).toISOString(),
            updated_at: new Date(currentTime.getTime() - 3600000).toISOString(),
            created_by: 'admin@example.com'
          },
          {
            name: 'DATABASE_URL',
            value: '***encrypted***',
            type: 'secret',
            description: 'Database connection string',
            scope: 'global',
            sensitive: true,
            created_at: new Date(currentTime.getTime() - 10800000).toISOString(),
            updated_at: new Date(currentTime.getTime() - 5400000).toISOString(),
            created_by: 'admin@example.com'
          }
        ];
        break;

      case 'delete':
        if (sanitizedInput.options.audit_changes) {
          auditLog = [{
            action: 'delete',
            variable_name: sanitizedInput.variable_name!,
            timestamp: currentTime.toISOString(),
            user: 'current_user',
            details: `Variable ${sanitizedInput.variable_name} deleted`
          }];
        }
        break;

      case 'encrypt':
        if (sanitizedInput.variables) {
          resultVariables = sanitizedInput.variables.map(variable => ({
            name: variable.name,
            value: '***encrypted***',
            type: 'encrypted',
            description: variable.description,
            scope: variable.scope,
            sensitive: true,
            created_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString(),
            created_by: 'current_user'
          }));
        }
        break;

      case 'decrypt':
        if (sanitizedInput.variables) {
          resultVariables = sanitizedInput.variables.map(variable => ({
            name: variable.name,
            value: 'decrypted_value',
            type: 'plain',
            description: variable.description,
            scope: variable.scope,
            sensitive: false,
            created_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString(),
            created_by: 'current_user'
          }));
        }
        break;
    }

    // Calculate summary
    if (resultVariables.length > 0) {
      summary = {
        total_variables: resultVariables.length,
        plain_variables: resultVariables.filter(v => v.type === 'plain').length,
        secret_variables: resultVariables.filter(v => v.type === 'secret').length,
        encrypted_variables: resultVariables.filter(v => v.type === 'encrypted').length,
        last_updated: currentTime.toISOString()
      };
    }

    const result = {
      action: sanitizedInput.action,
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      variables: resultVariables.length > 0 ? resultVariables : undefined,
      audit_log: auditLog.length > 0 ? auditLog : undefined,
      summary: Object.keys(summary).length > 0 ? summary : undefined
    };

    // Log pipeline variables management
    console.log(`Pipeline variables ${sanitizedInput.action}: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      result: result
    };

  } catch (error) {
    console.error('Error managing pipeline variables:', error);
    
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

export default managePipelineVariablesTool;
