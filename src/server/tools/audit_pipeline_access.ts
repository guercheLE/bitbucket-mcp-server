/**
 * Audit Pipeline Access Tool
 * 
 * MCP tool for auditing and tracking pipeline access in Bitbucket repositories
 * with comprehensive logging, compliance reporting, and security monitoring.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const AuditPipelineAccessSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  audit_type: z.enum(['access', 'permissions', 'compliance', 'security', 'all'], {
    errorMap: () => ({ message: 'Audit type must be access, permissions, compliance, security, or all' })
  }),
  filters: z.object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    users: z.array(z.string()).optional(),
    actions: z.array(z.enum(['execute', 'view', 'configure', 'admin', 'grant', 'revoke'])).optional(),
    status: z.array(z.enum(['success', 'failed', 'denied', 'blocked'])).optional(),
    ip_addresses: z.array(z.string()).optional()
  }).optional(),
  options: z.object({
    include_details: z.boolean().optional(),
    generate_report: z.boolean().optional(),
    export_format: z.enum(['json', 'csv', 'pdf']).optional(),
    compliance_standards: z.array(z.enum(['SOX', 'HIPAA', 'PCI-DSS', 'GDPR', 'ISO27001'])).optional()
  }).optional()
});

type AuditPipelineAccessInput = z.infer<typeof AuditPipelineAccessSchema>;

// Output validation schema
const AuditPipelineAccessOutputSchema = z.object({
  success: z.boolean(),
  audit_result: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    audit_type: z.enum(['access', 'permissions', 'compliance', 'security', 'all']),
    audit_period: z.object({
      from: z.string(),
      to: z.string()
    }),
    summary: z.object({
      total_events: z.number(),
      successful_access: z.number(),
      failed_access: z.number(),
      denied_access: z.number(),
      blocked_access: z.number(),
      unique_users: z.number(),
      unique_ips: z.number(),
      compliance_violations: z.number()
    }),
    events: z.array(z.object({
      id: z.string(),
      timestamp: z.string(),
      user: z.string(),
      action: z.enum(['execute', 'view', 'configure', 'admin', 'grant', 'revoke']),
      status: z.enum(['success', 'failed', 'denied', 'blocked']),
      ip_address: z.string(),
      user_agent: z.string().optional(),
      details: z.string(),
      compliance_flags: z.array(z.string()).optional(),
      risk_score: z.number().optional()
    })).optional(),
    compliance_report: z.object({
      standards: z.array(z.string()),
      violations: z.array(z.object({
        standard: z.string(),
        violation_type: z.string(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        timestamp: z.string(),
        user: z.string(),
        remediation: z.string().optional()
      })),
      compliance_score: z.number(),
      recommendations: z.array(z.string())
    }).optional(),
    security_analysis: z.object({
      risk_indicators: z.array(z.object({
        type: z.string(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        occurrences: z.number(),
        first_seen: z.string(),
        last_seen: z.string()
      })),
      anomaly_detection: z.array(z.object({
        type: z.string(),
        description: z.string(),
        confidence: z.number(),
        timestamp: z.string(),
        user: z.string()
      })),
      threat_level: z.enum(['low', 'medium', 'high', 'critical'])
    }).optional(),
    report_url: z.string().optional()
  }).optional(),
  error: z.string().optional()
});

type AuditPipelineAccessOutput = z.infer<typeof AuditPipelineAccessOutputSchema>;

/**
 * Audit Pipeline Access MCP Tool
 * 
 * Audits and tracks pipeline access with comprehensive logging, compliance
 * reporting, and security monitoring for Bitbucket repositories.
 * 
 * Features:
 * - Comprehensive access auditing
 * - Permission change tracking
 * - Compliance reporting (SOX, HIPAA, PCI-DSS, GDPR, ISO27001)
 * - Security analysis and threat detection
 * - Risk scoring and anomaly detection
 * - Detailed event logging
 * - Export capabilities (JSON, CSV, PDF)
 * - Input validation and sanitization
 * - Error handling and logging
 * 
 * @param input - Pipeline access audit parameters
 * @returns Pipeline access audit result with comprehensive analysis
 */
export const auditPipelineAccessTool: Tool = {
  name: 'audit_pipeline_access',
  description: 'Audit and track pipeline access with comprehensive logging, compliance reporting, and security monitoring',
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
      audit_type: {
        type: 'string',
        enum: ['access', 'permissions', 'compliance', 'security', 'all'],
        description: 'Type of audit to perform'
      },
      filters: {
        type: 'object',
        description: 'Optional filters for audit data',
        properties: {
          date_from: {
            type: 'string',
            format: 'date-time',
            description: 'Start date for audit (ISO 8601)'
          },
          date_to: {
            type: 'string',
            format: 'date-time',
            description: 'End date for audit (ISO 8601)'
          },
          users: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by specific users'
          },
          actions: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['execute', 'view', 'configure', 'admin', 'grant', 'revoke']
            },
            description: 'Filter by specific actions'
          },
          status: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['success', 'failed', 'denied', 'blocked']
            },
            description: 'Filter by access status'
          },
          ip_addresses: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by IP addresses'
          }
        }
      },
      options: {
        type: 'object',
        description: 'Optional audit options',
        properties: {
          include_details: {
            type: 'boolean',
            description: 'Include detailed event information'
          },
          generate_report: {
            type: 'boolean',
            description: 'Generate a comprehensive audit report'
          },
          export_format: {
            type: 'string',
            enum: ['json', 'csv', 'pdf'],
            description: 'Export format for the audit report'
          },
          compliance_standards: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['SOX', 'HIPAA', 'PCI-DSS', 'GDPR', 'ISO27001']
            },
            description: 'Compliance standards to check against'
          }
        }
      }
    },
    required: ['pipeline_id', 'repository', 'audit_type']
  }
};

/**
 * Execute pipeline access audit
 * 
 * @param input - Pipeline access audit parameters
 * @returns Pipeline access audit result
 */
export async function executeAuditPipelineAccess(input: AuditPipelineAccessInput): Promise<AuditPipelineAccessOutput> {
  try {
    // Validate input
    const validatedInput = AuditPipelineAccessSchema.parse(input);
    
    // Sanitize inputs
    const sanitizedInput = {
      pipeline_id: validatedInput.pipeline_id.trim(),
      repository: validatedInput.repository.trim(),
      audit_type: validatedInput.audit_type,
      filters: validatedInput.filters ? {
        date_from: validatedInput.filters.date_from,
        date_to: validatedInput.filters.date_to,
        users: validatedInput.filters.users?.map(u => u.trim()),
        actions: validatedInput.filters.actions,
        status: validatedInput.filters.status,
        ip_addresses: validatedInput.filters.ip_addresses?.map(ip => ip.trim())
      } : undefined,
      options: validatedInput.options || {
        include_details: true,
        generate_report: false,
        export_format: 'json',
        compliance_standards: []
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

    // Validate date range if provided
    if (sanitizedInput.filters?.date_from && sanitizedInput.filters?.date_to) {
      const fromDate = new Date(sanitizedInput.filters.date_from);
      const toDate = new Date(sanitizedInput.filters.date_to);
      
      if (fromDate >= toDate) {
        return {
          success: false,
          error: 'Start date must be before end date'
        };
      }
    }

    // Simulate pipeline access audit (replace with actual Bitbucket API call)
    const currentTime = new Date();
    const auditStartTime = sanitizedInput.filters?.date_from ? 
      new Date(sanitizedInput.filters.date_from) : 
      new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const auditEndTime = sanitizedInput.filters?.date_to ? 
      new Date(sanitizedInput.filters.date_to) : 
      currentTime;

    // Generate sample audit events
    const sampleEvents = [
      {
        id: 'audit_001',
        timestamp: new Date(auditStartTime.getTime() + 3600000).toISOString(),
        user: 'admin@example.com',
        action: 'execute' as const,
        status: 'success' as const,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: 'Pipeline execution started successfully',
        compliance_flags: ['SOX'],
        risk_score: 2
      },
      {
        id: 'audit_002',
        timestamp: new Date(auditStartTime.getTime() + 7200000).toISOString(),
        user: 'developer@example.com',
        action: 'view' as const,
        status: 'success' as const,
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        details: 'Pipeline status viewed',
        compliance_flags: [],
        risk_score: 1
      },
      {
        id: 'audit_003',
        timestamp: new Date(auditStartTime.getTime() + 10800000).toISOString(),
        user: 'unauthorized@example.com',
        action: 'execute' as const,
        status: 'denied' as const,
        ip_address: '192.168.1.200',
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        details: 'Access denied - insufficient permissions',
        compliance_flags: ['SOX', 'HIPAA'],
        risk_score: 8
      },
      {
        id: 'audit_004',
        timestamp: new Date(auditStartTime.getTime() + 14400000).toISOString(),
        user: 'admin@example.com',
        action: 'grant' as const,
        status: 'success' as const,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: 'Permission granted to developer@example.com',
        compliance_flags: ['SOX'],
        risk_score: 3
      },
      {
        id: 'audit_005',
        timestamp: new Date(auditStartTime.getTime() + 18000000).toISOString(),
        user: 'suspicious@example.com',
        action: 'admin' as const,
        status: 'blocked' as const,
        ip_address: '10.0.0.1',
        user_agent: 'curl/7.68.0',
        details: 'Admin access blocked - suspicious activity detected',
        compliance_flags: ['SOX', 'HIPAA', 'PCI-DSS'],
        risk_score: 10
      }
    ];

    // Apply filters
    let filteredEvents = sampleEvents;
    if (sanitizedInput.filters) {
      if (sanitizedInput.filters.users && sanitizedInput.filters.users.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          sanitizedInput.filters!.users!.includes(event.user)
        );
      }
      
      if (sanitizedInput.filters.actions && sanitizedInput.filters.actions.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          sanitizedInput.filters!.actions!.includes(event.action)
        );
      }
      
      if (sanitizedInput.filters.status && sanitizedInput.filters.status.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          sanitizedInput.filters!.status!.includes(event.status)
        );
      }
      
      if (sanitizedInput.filters.ip_addresses && sanitizedInput.filters.ip_addresses.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          sanitizedInput.filters!.ip_addresses!.includes(event.ip_address)
        );
      }
    }

    // Calculate summary
    const summary = {
      total_events: filteredEvents.length,
      successful_access: filteredEvents.filter(e => e.status === 'success').length,
      failed_access: filteredEvents.filter(e => e.status === 'failed').length,
      denied_access: filteredEvents.filter(e => e.status === 'denied').length,
      blocked_access: filteredEvents.filter(e => e.status === 'blocked').length,
      unique_users: new Set(filteredEvents.map(e => e.user)).size,
      unique_ips: new Set(filteredEvents.map(e => e.ip_address)).size,
      compliance_violations: filteredEvents.filter(e => e.compliance_flags.length > 0).length
    };

    // Generate compliance report if requested
    let complianceReport: any = undefined;
    if (sanitizedInput.options.compliance_standards.length > 0) {
      const violations = filteredEvents
        .filter(e => e.compliance_flags.length > 0)
        .map(event => ({
          standard: event.compliance_flags[0],
          violation_type: 'Unauthorized Access',
          description: event.details,
          severity: event.risk_score > 7 ? 'critical' as const : event.risk_score > 4 ? 'high' as const : 'medium' as const,
          timestamp: event.timestamp,
          user: event.user,
          remediation: 'Review and update access permissions'
        }));

      complianceReport = {
        standards: sanitizedInput.options.compliance_standards,
        violations: violations,
        compliance_score: Math.max(0, 100 - (violations.length * 10)),
        recommendations: [
          'Implement multi-factor authentication',
          'Review and update access permissions regularly',
          'Enable real-time monitoring for suspicious activities',
          'Implement IP whitelisting for sensitive operations'
        ]
      };
    }

    // Generate security analysis if requested
    let securityAnalysis: any = undefined;
    if (sanitizedInput.audit_type === 'security' || sanitizedInput.audit_type === 'all') {
      const riskIndicators = [
        {
          type: 'High Risk Access Attempts',
          description: 'Multiple failed access attempts from suspicious IPs',
          severity: 'high' as const,
          occurrences: filteredEvents.filter(e => e.risk_score > 7).length,
          first_seen: filteredEvents[0]?.timestamp || auditStartTime.toISOString(),
          last_seen: filteredEvents[filteredEvents.length - 1]?.timestamp || auditEndTime.toISOString()
        },
        {
          type: 'Compliance Violations',
          description: 'Access attempts that violate compliance standards',
          severity: 'medium' as const,
          occurrences: summary.compliance_violations,
          first_seen: filteredEvents[0]?.timestamp || auditStartTime.toISOString(),
          last_seen: filteredEvents[filteredEvents.length - 1]?.timestamp || auditEndTime.toISOString()
        }
      ];

      const anomalyDetection = filteredEvents
        .filter(e => e.risk_score > 5)
        .map(event => ({
          type: 'Suspicious Activity',
          description: `High risk activity detected: ${event.details}`,
          confidence: event.risk_score / 10,
          timestamp: event.timestamp,
          user: event.user
        }));

      const threatLevel = summary.blocked_access > 0 ? 'high' as const : 
                         summary.denied_access > 2 ? 'medium' as const : 'low' as const;

      securityAnalysis = {
        risk_indicators: riskIndicators,
        anomaly_detection: anomalyDetection,
        threat_level: threatLevel
      };
    }

    const auditResult = {
      pipeline_id: sanitizedInput.pipeline_id,
      repository: sanitizedInput.repository,
      audit_type: sanitizedInput.audit_type,
      audit_period: {
        from: auditStartTime.toISOString(),
        to: auditEndTime.toISOString()
      },
      summary: summary,
      events: sanitizedInput.options.include_details ? filteredEvents : undefined,
      compliance_report: complianceReport,
      security_analysis: securityAnalysis,
      report_url: sanitizedInput.options.generate_report ? 
        `https://bitbucket.example.com/audit-reports/${sanitizedInput.pipeline_id}_${Date.now()}.${sanitizedInput.options.export_format}` : 
        undefined
    };

    // Log audit execution
    console.log(`Pipeline access audit completed: ${sanitizedInput.pipeline_id} in repository: ${sanitizedInput.repository}`);

    return {
      success: true,
      audit_result: auditResult
    };

  } catch (error) {
    console.error('Error auditing pipeline access:', error);
    
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

export default auditPipelineAccessTool;
