/**
 * Configure Pipeline Access Tool
 * 
 * MCP tool for configuring access control policies for CI/CD pipelines
 * in Bitbucket repositories with comprehensive security and compliance features.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ConfigurePipelineAccessSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  access_policies: z.array(z.object({
    name: z.string().min(1, 'Policy name is required'),
    description: z.string().optional(),
    enabled: z.boolean(),
    rules: z.array(z.object({
      type: z.enum(['allow', 'deny']),
      subjects: z.array(z.object({
        type: z.enum(['user', 'group', 'role', 'ip_range']),
        identifier: z.string(),
        conditions: z.object({
          time_restrictions: z.object({
            start_time: z.string().optional(),
            end_time: z.string().optional(),
            days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional()
          }).optional(),
          location_restrictions: z.object({
            countries: z.array(z.string()).optional(),
            regions: z.array(z.string()).optional()
          }).optional(),
          device_restrictions: z.object({
            require_mfa: z.boolean().optional(),
            require_certificate: z.boolean().optional()
          }).optional()
        }).optional()
      })),
      actions: z.array(z.enum(['execute', 'view', 'configure', 'admin'])),
      resources: z.array(z.string()).optional(),
      conditions: z.object({
        branches: z.array(z.string()).optional(),
        environments: z.array(z.string()).optional(),
        time_windows: z.array(z.object({
          start: z.string(),
          end: z.string()
        })).optional()
      }).optional()
    }))
  })),
  options: z.object({
    default_policy: z.enum(['allow', 'deny']).optional(),
    inheritance_mode: z.enum(['strict', 'permissive', 'custom']).optional(),
    audit_mode: z.boolean().optional(),
    compliance_mode: z.boolean().optional()
  }).optional()
});

type ConfigurePipelineAccessInput = z.infer<typeof ConfigurePipelineAccessSchema>;

// Output validation schema
const ConfigurePipelineAccessOutputSchema = z.object({
  success: z.boolean(),
  configuration: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    access_policies: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      enabled: z.boolean(),
      rules: z.array(z.object({
        id: z.string(),
        type: z.enum(['allow', 'deny']),
        subjects: z.array(z.object({
          type: z.enum(['user', 'group', 'role', 'ip_range']),
          identifier: z.string(),
          conditions: z.object({
            time_restrictions: z.object({
              start_time: z.string().optional(),
              end_time: z.string().optional(),
              days: z.array(z.string()).optional()
            }).optional(),
            location_restrictions: z.object({
              countries: z.array(z.string()).optional(),
              regions: z.array(z.string()).optional()
            }).optional(),
            device_restrictions: z.object({
              require_mfa: z.boolean().optional(),
              require_certificate: z.boolean().optional()
            }).optional()
          }).optional()
        })),
        actions: z.array(z.string()),
        resources: z.array(z.string()).optional(),
        conditions: z.object({
          branches: z.array(z.string()).optional(),
          environments: z.array(z.string()).optional(),
          time_windows: z.array(z.object({
            start: z.string(),
            end: z.string()
          })).optional()
        }).optional()
      })),
      created_at: z.string(),
      updated_at: z.string(),
      created_by: z.string()
    })),
    options: z.object({
      default_policy: z.enum(['allow', 'deny']),
      inheritance_mode: z.enum(['strict', 'permissive', 'custom']),
      audit_mode: z.boolean(),
      compliance_mode: z.boolean()
    }),
    validation_results: z.object({
      valid: z.boolean(),
      warnings: z.array(z.string()),
      errors: z.array(z.string())
    }).optional()
  }).optional(),
  error: z.string().optional()
});

type ConfigurePipelineAccessOutput = z.infer<typeof ConfigurePipelineAccessOutputSchema>;

/**
 * Configure Pipeline Access MCP Tool
 * 
 * Configures access control policies for CI/CD pipelines with comprehensive
 * security, compliance, and audit capabilities for Bitbucket repositories.
 * 
 * Features:
 * - Comprehensive access control policies
 * - Rule-based access management
 * - Time and location-based restrictions
 * - Multi-factor authentication requirements
 * - Compliance and audit capabilities
 * - Policy inheritance and defaults
 * - Advanced condition matching
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline access configuration parameters
 * @returns Pipeline access configuration result
 */
export const configurePipelineAccessTool: Tool = {
  name: 'configure_pipeline_access',
  description: 'Configure access control policies for CI/CD pipelines with comprehensive security, compliance, and audit capabilities',
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
      access_policies: {
        type: 'array',
        description: 'Access control policies to configure',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Policy name'
            },
            description: {
              type: 'string',
              description: 'Policy description'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the policy is enabled'
            },
            rules: {
              type: 'array',
              description: 'Access control rules',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['allow', 'deny'],
                    description: 'Rule type (allow or deny)'
                  },
                  subjects: {
                    type: 'array',
                    description: 'Subjects affected by the rule',
                    items: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          enum: ['user', 'group', 'role', 'ip_range'],
                          description: 'Subject type'
                        },
                        identifier: {
                          type: 'string',
                          description: 'Subject identifier'
                        },
                        conditions: {
                          type: 'object',
                          description: 'Subject conditions',
                          properties: {
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
                            location_restrictions: {
                              type: 'object',
                              description: 'Location-based restrictions',
                              properties: {
                                countries: {
                                  type: 'array',
                                  items: {
                                    type: 'string'
                                  },
                                  description: 'Allowed countries'
                                },
                                regions: {
                                  type: 'array',
                                  items: {
                                    type: 'string'
                                  },
                                  description: 'Allowed regions'
                                }
                              }
                            },
                            device_restrictions: {
                              type: 'object',
                              description: 'Device-based restrictions',
                              properties: {
                                require_mfa: {
                                  type: 'boolean',
                                  description: 'Require multi-factor authentication'
                                },
                                require_certificate: {
                                  type: 'boolean',
                                  description: 'Require client certificate'
                                }
                              }
                            }
                          }
                        }
                      },
                      required: ['type', 'identifier']
                    }
                  },
                  actions: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: ['execute', 'view', 'configure', 'admin']
                    },
                    description: 'Actions allowed or denied'
                  },
                  resources: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    description: 'Resources affected by the rule'
                  },
                  conditions: {
                    type: 'object',
                    description: 'Rule conditions',
                    properties: {
                      branches: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        description: 'Branch restrictions'
                      },
                      environments: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        description: 'Environment restrictions'
                      },
                      time_windows: {
                        type: 'array',
                        description: 'Time window restrictions',
                        items: {
                          type: 'object',
                          properties: {
                            start: {
                              type: 'string',
                              description: 'Start time (ISO 8601)'
                            },
                            end: {
                              type: 'string',
                              description: 'End time (ISO 8601)'
                            }
                          },
                          required: ['start', 'end']
                        }
                      }
                    }
                  }
                },
                required: ['type', 'subjects', 'actions']
              }
            }
          },
          required: ['name', 'enabled', 'rules']
        }
      },
      options: {
        type: 'object',
        description: 'Configuration options',
        properties: {
          default_policy: {
            type: 'string',
            enum: ['allow', 'deny'],
            description: 'Default access policy'
          },
          inheritance_mode: {
            type: 'string',
            enum: ['strict', 'permissive', 'custom'],
            description: 'Policy inheritance mode'
          },
          audit_mode: {
            type: 'boolean',
            description: 'Enable audit mode'
          },
          compliance_mode: {
            type: 'boolean',
            description: 'Enable compliance mode'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'access_policies']
  }
};

/**
 * Execute pipeline access configuration
 * 
 * @param input - Pipeline access configuration parameters
 * @returns Pipeline access configuration result
 */
export async function executeConfigurePipelineAccess(input: ConfigurePipelineAccessInput): Promise<ConfigurePipelineAccessOutput> {
  try {
    // Validate input
    const validatedInput = ConfigurePipelineAccessSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      access_policies: validatedInput.access_policies.map(policy => ({
        name: policy.name.trim(),
        description: policy.description?.trim(),
        enabled: policy.enabled,
        rules: policy.rules.map(rule => ({
          type: rule.type,
          subjects: rule.subjects.map(subject => ({
            type: subject.type,
            identifier: subject.identifier.trim(),
            conditions: subject.conditions
          })),
          actions: rule.actions,
          resources: rule.resources?.map(r => r.trim()),
          conditions: rule.conditions
        }))
      })),
      options: validatedInput.options || {
        default_policy: 'deny',
        inheritance_mode: 'strict',
        audit_mode: true,
        compliance_mode: false
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

    // Validate access policies
    if (!sanitizedInput.access_policies || sanitizedInput.access_policies.length === 0) {
      return {
        success: false,
        error: 'At least one access policy is required'
      };
    }

    // Validate policy names
    const policyNames = sanitizedInput.access_policies.map(p => p.name);
    const uniqueNames = new Set(policyNames);
    if (policyNames.length !== uniqueNames.size) {
      return {
        success: false,
        error: 'Policy names must be unique'
      };
    }

    // Validate rules
    for (const policy of sanitizedInput.access_policies) {
      if (!policy.rules || policy.rules.length === 0) {
        return {
          success: false,
          error: `Policy "${policy.name}" must have at least one rule`
        };
      }

      for (const rule of policy.rules) {
        if (!rule.subjects || rule.subjects.length === 0) {
          return {
            success: false,
            error: `Rule in policy "${policy.name}" must have at least one subject`
          };
        }

        if (!rule.actions || rule.actions.length === 0) {
          return {
            success: false,
            error: `Rule in policy "${policy.name}" must have at least one action`
          };
        }
      }
    }

    // Simulate configuration validation
    const validationResults = {
      valid: true,
      warnings: [] as string[],
      errors: [] as string[]
    };

    // Check for common issues
    const enabledPolicies = sanitizedInput.access_policies.filter(p => p.enabled);
    if (enabledPolicies.length === 0) {
      validationResults.warnings.push('No policies are enabled - default policy will be used');
    }

    const allowRules = enabledPolicies.flatMap(p => p.rules.filter(r => r.type === 'allow'));
    const denyRules = enabledPolicies.flatMap(p => p.rules.filter(r => r.type === 'deny'));
    
    if (allowRules.length === 0 && denyRules.length > 0) {
      validationResults.warnings.push('Only deny rules configured - ensure default policy allows necessary access');
    }

    if (sanitizedInput.options.compliance_mode && !sanitizedInput.options.audit_mode) {
      validationResults.warnings.push('Compliance mode enabled but audit mode is disabled - consider enabling audit mode');
    }

    // Simulate access configuration (replace with actual Bitbucket API call)
    const currentTime = new Date();
    
    const configuredPolicies = sanitizedInput.access_policies.map((policy, policyIndex) => ({
      id: `policy_${policyIndex + 1}_${Date.now()}`,
      name: policy.name,
      description: policy.description,
      enabled: policy.enabled,
      rules: policy.rules.map((rule, ruleIndex) => ({
        id: `rule_${policyIndex + 1}_${ruleIndex + 1}_${Date.now()}`,
        type: rule.type,
        subjects: rule.subjects,
        actions: rule.actions,
        resources: rule.resources,
        conditions: rule.conditions
      })),
      created_at: currentTime.toISOString(),
      updated_at: currentTime.toISOString(),
      created_by: 'current_user'
    }));

    const configuration = {
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      access_policies: configuredPolicies,
      options: sanitizedInput.options,
      validation_results: validationResults
    };

    // Log access configuration
    console.log(`Pipeline access configured: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      configuration: configuration
    };

  } catch (error) {
    console.error('Error configuring pipeline access:', error);
    
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

export default configurePipelineAccessTool;
