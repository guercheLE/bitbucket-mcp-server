/**
 * Data Center Security Tools
 * Ferramentas para gerenciamento de segurança no Bitbucket Data Center
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { SecurityService } from '../../services/datacenter/security.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for parameter validation
const GetSecurityAuditLogsSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  user: z.string().optional(),
  action: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityConfigurationSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityMetricsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListSecurityPoliciesSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateSecurityPolicySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  rules: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityAuditLogSchema = z.object({
  log_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ExportSecurityAuditLogsSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  format: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityPolicySchema = z.object({
  policy_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateSecurityPolicySchema = z.object({
  policy_id: z.string(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DeleteSecurityPolicySchema = z.object({
  policy_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const EnableSecurityPolicySchema = z.object({
  policy_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const DisableSecurityPolicySchema = z.object({
  policy_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListSecurityViolationsSchema = z.object({
  start: z.number().optional(),
  limit: z.number().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityViolationSchema = z.object({
  violation_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateSecurityViolationSchema = z.object({
  violation_id: z.string(),
  updates: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ResolveSecurityViolationSchema = z.object({
  violation_id: z.string(),
  resolution: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const IgnoreSecurityViolationSchema = z.object({
  violation_id: z.string(),
  reason: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ListSecurityScansSchema = z.object({
  start: z.number().optional(),
  limit: z.number().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityScanSchema = z.object({
  scan_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateSecurityScanSchema = z.object({
  name: z.string(),
  type: z.string(),
  target: z.string().optional(),
  schedule: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartSecurityScanSchema = z.object({
  scan_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StopSecurityScanSchema = z.object({
  scan_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CancelSecurityScanSchema = z.object({
  scan_id: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const UpdateSecurityConfigurationSchema = z.object({
  settings: z.any(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetSecurityMetricsForRangeSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  metric_type: z.string().optional(),
  granularity: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class DataCenterSecurityTools {
  private static logger = Logger.forContext('DataCenterSecurityTools');
  private static securityServicePool: Pool<SecurityService>;

  static initialize(): void {
    const securityServiceFactory = {
      create: async () =>
        new SecurityService(new ApiClient(), Logger.forContext('SecurityService')),
      destroy: async () => {},
    };

    this.securityServicePool = createPool(securityServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Data Center Security tools initialized');
  }

  // Static Methods
  static async getSecurityAuditLogs(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityAuditLogs');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security audit logs:', {
        start_date: params.start_date,
        end_date: params.end_date,
        user: params.user,
        action: params.action,
      });

      const result = await service.getSecurityAuditLogs({
        fromTimestamp: params.start_date ? new Date(params.start_date).getTime() : undefined,
        toTimestamp: params.end_date ? new Date(params.end_date).getTime() : undefined,
        userId: params.user ? parseInt(params.user) : undefined,
        action: params.action,
        start: params.start,
        limit: params.limit,
      });

      methodLogger.info('Successfully retrieved security audit logs');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security audit logs:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async getSecurityConfiguration(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityConfiguration');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security configuration');

      const result = await service.getSecurityConfiguration();

      methodLogger.info('Successfully retrieved security configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security configuration:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async getSecurityMetrics(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityMetrics');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security metrics');

      const result = await service.getSecurityMetrics();

      methodLogger.info('Successfully retrieved security metrics');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security metrics:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async listSecurityPolicies(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listSecurityPolicies');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Listing security policies:', {
        name: params.name,
        status: params.status,
        start: params.start,
        limit: params.limit,
      });

      const result = await service.listSecurityPolicies({
        type: params.type,
        enabled: params.status === 'enabled',
        start: params.start,
        limit: params.limit,
      });

      methodLogger.info('Successfully listed security policies');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list security policies:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async createSecurityPolicy(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('createSecurityPolicy');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Creating security policy:', {
        name: params.name,
      });

      const result = await service.createSecurityPolicy({
        name: params.name,
        description: params.description,
        type: 'CUSTOM',
        rules: params.rules ? JSON.parse(params.rules) : [],
        scope: {
          type: 'GLOBAL',
          targets: [],
        },
      });

      methodLogger.info('Successfully created security policy');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create security policy:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async getSecurityAuditLog(auditId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityAuditLog');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security audit log:', { audit_id: auditId });

      const result = await service.getSecurityAuditLog(auditId);

      methodLogger.info('Successfully retrieved security audit log');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security audit log:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async exportSecurityAuditLogs(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('exportSecurityAuditLogs');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Exporting security audit logs:', {
        format: params.format,
        start_date: params.start_date,
        end_date: params.end_date,
      });

      const result = await service.exportSecurityAuditLogs({
        fromTimestamp: params.start_date ? new Date(params.start_date).getTime() : undefined,
        toTimestamp: params.end_date ? new Date(params.end_date).getTime() : undefined,
      });

      methodLogger.info('Successfully exported security audit logs');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to export security audit logs:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async getSecurityPolicy(policyId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityPolicy');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security policy:', { policy_id: policyId });

      const result = await service.getSecurityPolicy(policyId);

      methodLogger.info('Successfully retrieved security policy');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security policy:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async updateSecurityPolicy(
    policyId: string,
    updates: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateSecurityPolicy');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Updating security policy:', { policy_id: policyId });

      const result = await service.updateSecurityPolicy(policyId, updates);

      methodLogger.info('Successfully updated security policy');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update security policy:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async deleteSecurityPolicy(policyId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('deleteSecurityPolicy');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Deleting security policy:', { policy_id: policyId });

      await service.deleteSecurityPolicy(policyId);

      methodLogger.info('Successfully deleted security policy');
      return createMcpResponse({ message: 'Security policy deleted successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to delete security policy:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async enableSecurityPolicy(policyId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('enableSecurityPolicy');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Enabling security policy:', { policy_id: policyId });

      const result = await service.enableSecurityPolicy(policyId);

      methodLogger.info('Successfully enabled security policy');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to enable security policy:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async disableSecurityPolicy(policyId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('disableSecurityPolicy');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Disabling security policy:', { policy_id: policyId });

      const result = await service.disableSecurityPolicy(policyId);

      methodLogger.info('Successfully disabled security policy');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to disable security policy:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async listSecurityViolations(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listSecurityViolations');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Listing security violations:', {
        severity: params.severity,
        status: params.status,
        start_date: params.start_date,
        end_date: params.end_date,
      });

      const result = await service.listSecurityViolations({
        severity: params.severity,
        status: params.status,
        fromTimestamp: params.start_date ? new Date(params.start_date).getTime() : undefined,
        toTimestamp: params.end_date ? new Date(params.end_date).getTime() : undefined,
        start: params.start,
        limit: params.limit,
      });

      methodLogger.info('Successfully listed security violations');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list security violations:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async getSecurityViolation(violationId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityViolation');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security violation:', { violation_id: violationId });

      const result = await service.getSecurityViolation(violationId);

      methodLogger.info('Successfully retrieved security violation');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security violation:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async updateSecurityViolation(
    violationId: string,
    updates: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateSecurityViolation');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Updating security violation:', { violation_id: violationId });

      const result = await service.updateSecurityViolation(violationId, updates);

      methodLogger.info('Successfully updated security violation');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update security violation:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async resolveSecurityViolation(
    violationId: string,
    resolution: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('resolveSecurityViolation');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Resolving security violation:', { violation_id: violationId });

      const result = await service.resolveSecurityViolation(violationId, resolution);

      methodLogger.info('Successfully resolved security violation');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to resolve security violation:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async ignoreSecurityViolation(
    violationId: string,
    reason: string,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('ignoreSecurityViolation');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Ignoring security violation:', { violation_id: violationId });

      const result = await service.ignoreSecurityViolation(violationId, reason);

      methodLogger.info('Successfully ignored security violation');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to ignore security violation:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async listSecurityScans(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('listSecurityScans');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Listing security scans:', {
        status: params.status,
        type: params.type,
        start_date: params.start_date,
        end_date: params.end_date,
      });

      const result = await service.listSecurityScans({
        status: params.status,
        type: params.type,
        fromDate: params.start_date ? new Date(params.start_date).getTime() : undefined,
        toDate: params.end_date ? new Date(params.end_date).getTime() : undefined,
        start: params.start,
        limit: params.limit,
      });

      methodLogger.info('Successfully listed security scans');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to list security scans:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async getSecurityScan(scanId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityScan');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security scan:', { scan_id: scanId });

      const result = await service.getSecurityScan(scanId);

      methodLogger.info('Successfully retrieved security scan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security scan:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async createSecurityScan(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('createSecurityScan');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Creating security scan:', {
        name: params.name,
        type: params.type,
      });

      const result = await service.createSecurityScan({
        type: params.type,
        target: {
          type: 'REPOSITORY',
          id: params.target || 'default',
          name: params.name || 'Default Target',
        },
      });

      methodLogger.info('Successfully created security scan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create security scan:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async startSecurityScan(scanId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('startSecurityScan');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Starting security scan:', { scan_id: scanId });

      const result = await service.startSecurityScan(scanId);

      methodLogger.info('Successfully started security scan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start security scan:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async stopSecurityScan(scanId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('stopSecurityScan');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Stopping security scan:', { scan_id: scanId });

      const result = await service.stopSecurityScan(scanId);

      methodLogger.info('Successfully stopped security scan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to stop security scan:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async cancelSecurityScan(scanId: string, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('cancelSecurityScan');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Canceling security scan:', { scan_id: scanId });

      const result = await service.cancelSecurityScan(scanId);

      methodLogger.info('Successfully canceled security scan');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to cancel security scan:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async updateSecurityConfiguration(
    configuration: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('updateSecurityConfiguration');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Updating security configuration');

      const result = await service.updateSecurityConfiguration(configuration);

      methodLogger.info('Successfully updated security configuration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to update security configuration:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static async getSecurityMetricsForRange(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getSecurityMetricsForRange');
    let service: SecurityService | null = null;

    try {
      service = await this.securityServicePool.acquire();
      methodLogger.debug('Getting security metrics for range:', {
        start_date: params.start_date,
        end_date: params.end_date,
        metric_type: params.metric_type,
      });

      const result = await service.getSecurityMetricsForRange(
        new Date(params.start_date).getTime(),
        new Date(params.end_date).getTime()
      );

      methodLogger.info('Successfully retrieved security metrics for range');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get security metrics for range:', error);
      if (service) {
        this.securityServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.securityServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Get Security Audit Logs
    server.registerTool(
      'security_get_audit_logs',
      {
        description: `Obtém logs de auditoria de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Logs de auditoria
- Filtros por data e usuário
- Resultados paginados

**Parâmetros:**
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`user\`: Usuário (opcional)
- \`action\`: Ação (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os logs de auditoria.`,
        inputSchema: GetSecurityAuditLogsSchema.shape,
      },
      async (params: z.infer<typeof GetSecurityAuditLogsSchema>) => {
        const validatedParams = GetSecurityAuditLogsSchema.parse(params);
        return await this.getSecurityAuditLogs(
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            user: validatedParams.user,
            action: validatedParams.action,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Security Configuration
    server.registerTool(
      'security_get_configuration',
      {
        description: `Obtém configuração de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Configurações de segurança
- Políticas de acesso
- Configurações de autenticação

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração de segurança.`,
        inputSchema: GetSecurityConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetSecurityConfigurationSchema>) => {
        const validatedParams = GetSecurityConfigurationSchema.parse(params);
        return await this.getSecurityConfiguration(validatedParams.output);
      }
    );

    // Get Security Metrics
    server.registerTool(
      'security_get_metrics',
      {
        description: `Obtém métricas de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Métricas de segurança
- Estatísticas de violações
- Indicadores de performance

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as métricas de segurança.`,
        inputSchema: GetSecurityMetricsSchema.shape,
      },
      async (params: z.infer<typeof GetSecurityMetricsSchema>) => {
        const validatedParams = GetSecurityMetricsSchema.parse(params);
        return await this.getSecurityMetrics(validatedParams.output);
      }
    );

    // List Security Policies
    server.registerTool(
      'security_list_policies',
      {
        description: `Lista políticas de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de políticas
- Filtros e paginação
- Informações resumidas

**Parâmetros:**
- \`name\`: Filtro por nome da política (opcional)
- \`status\`: Filtro por status (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de políticas de segurança.`,
        inputSchema: ListSecurityPoliciesSchema.shape,
      },
      async (params: z.infer<typeof ListSecurityPoliciesSchema>) => {
        const validatedParams = ListSecurityPoliciesSchema.parse(params);
        return await this.listSecurityPolicies(
          {
            name: validatedParams.name,
            status: validatedParams.status,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Create Security Policy
    server.registerTool(
      'security_create_policy',
      {
        description: `Cria uma nova política de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Criação de políticas
- Configuração de regras
- Metadados da política

**Parâmetros:**
- \`name\`: Nome da política
- \`description\`: Descrição da política (opcional)
- \`type\`: Tipo da política
- \`rules\`: Regras da política
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da política criada.`,
        inputSchema: CreateSecurityPolicySchema.shape,
      },
      async (params: z.infer<typeof CreateSecurityPolicySchema>) => {
        const validatedParams = CreateSecurityPolicySchema.parse(params);
        return await this.createSecurityPolicy(
          {
            name: validatedParams.name,
            description: validatedParams.description,
            type: validatedParams.type,
            rules: validatedParams.rules,
          },
          validatedParams.output
        );
      }
    );

    // Get Security Audit Log
    server.registerTool(
      'security_get_audit_log',
      {
        description: `Obtém um log de auditoria específico no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes do log de auditoria
- Informações específicas
- Metadados do evento

**Parâmetros:**
- \`log_id\`: ID do log de auditoria
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do log de auditoria.`,
        inputSchema: GetSecurityAuditLogSchema.shape,
      },
      async (params: z.infer<typeof GetSecurityAuditLogSchema>) => {
        const validatedParams = GetSecurityAuditLogSchema.parse(params);
        return await this.getSecurityAuditLog(validatedParams.log_id, validatedParams.output);
      }
    );

    // Export Security Audit Logs
    server.registerTool(
      'security_export_audit_logs',
      {
        description: `Exporta logs de auditoria de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Exportação de logs
- Geração de relatórios
- Download de dados

**Parâmetros:**
- \`format\`: Formato de exportação (opcional)
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os dados exportados.`,
        inputSchema: ExportSecurityAuditLogsSchema.shape,
      },
      async (params: z.infer<typeof ExportSecurityAuditLogsSchema>) => {
        const validatedParams = ExportSecurityAuditLogsSchema.parse(params);
        return await this.exportSecurityAuditLogs(
          {
            format: validatedParams.format,
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
          },
          validatedParams.output
        );
      }
    );

    // Get Security Policy
    server.registerTool(
      'security_get_policy',
      {
        description: `Obtém uma política de segurança específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da política
- Configurações específicas
- Status atual

**Parâmetros:**
- \`policy_id\`: ID da política
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da política.`,
        inputSchema: GetSecurityPolicySchema.shape,
      },
      async (params: z.infer<typeof GetSecurityPolicySchema>) => {
        const validatedParams = GetSecurityPolicySchema.parse(params);
        return await this.getSecurityPolicy(validatedParams.policy_id, validatedParams.output);
      }
    );

    // Update Security Policy
    server.registerTool(
      'security_update_policy',
      {
        description: `Atualiza uma política de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Modificação de políticas
- Atualização de regras
- Alteração de configurações

**Parâmetros:**
- \`policy_id\`: ID da política
- \`updates\`: Objeto com as atualizações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a política atualizada.`,
        inputSchema: UpdateSecurityPolicySchema.shape,
      },
      async (params: z.infer<typeof UpdateSecurityPolicySchema>) => {
        const validatedParams = UpdateSecurityPolicySchema.parse(params);
        return await this.updateSecurityPolicy(
          validatedParams.policy_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Delete Security Policy
    server.registerTool(
      'security_delete_policy',
      {
        description: `Remove uma política de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Remoção de políticas
- Limpeza de configurações
- Confirmação de exclusão

**Parâmetros:**
- \`policy_id\`: ID da política
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a confirmação da remoção.`,
        inputSchema: DeleteSecurityPolicySchema.shape,
      },
      async (params: z.infer<typeof DeleteSecurityPolicySchema>) => {
        const validatedParams = DeleteSecurityPolicySchema.parse(params);
        return await this.deleteSecurityPolicy(validatedParams.policy_id, validatedParams.output);
      }
    );

    // Enable Security Policy
    server.registerTool(
      'security_enable_policy',
      {
        description: `Habilita uma política de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Ativação de políticas
- Habilitação de regras
- Configuração de aplicação

**Parâmetros:**
- \`policy_id\`: ID da política
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a política habilitada.`,
        inputSchema: EnableSecurityPolicySchema.shape,
      },
      async (params: z.infer<typeof EnableSecurityPolicySchema>) => {
        const validatedParams = EnableSecurityPolicySchema.parse(params);
        return await this.enableSecurityPolicy(validatedParams.policy_id, validatedParams.output);
      }
    );

    // Disable Security Policy
    server.registerTool(
      'security_disable_policy',
      {
        description: `Desabilita uma política de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Desativação de políticas
- Desabilitação de regras
- Pausa de aplicação

**Parâmetros:**
- \`policy_id\`: ID da política
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a política desabilitada.`,
        inputSchema: DisableSecurityPolicySchema.shape,
      },
      async (params: z.infer<typeof DisableSecurityPolicySchema>) => {
        const validatedParams = DisableSecurityPolicySchema.parse(params);
        return await this.disableSecurityPolicy(validatedParams.policy_id, validatedParams.output);
      }
    );

    // List Security Violations
    server.registerTool(
      'security_list_violations',
      {
        description: `Lista violações de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de violações
- Filtros e paginação
- Informações de status

**Parâmetros:**
- \`severity\`: Filtro por severidade (opcional)
- \`status\`: Filtro por status (opcional)
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de violações.`,
        inputSchema: ListSecurityViolationsSchema.shape,
      },
      async (params: z.infer<typeof ListSecurityViolationsSchema>) => {
        const validatedParams = ListSecurityViolationsSchema.parse(params);
        return await this.listSecurityViolations(
          {
            severity: validatedParams.severity,
            status: validatedParams.status,
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Security Violation
    server.registerTool(
      'security_get_violation',
      {
        description: `Obtém uma violação de segurança específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da violação
- Informações específicas
- Status atual

**Parâmetros:**
- \`violation_id\`: ID da violação
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da violação.`,
        inputSchema: GetSecurityViolationSchema.shape,
      },
      async (params: z.infer<typeof GetSecurityViolationSchema>) => {
        const validatedParams = GetSecurityViolationSchema.parse(params);
        return await this.getSecurityViolation(
          validatedParams.violation_id,
          validatedParams.output
        );
      }
    );

    // Update Security Violation
    server.registerTool(
      'security_update_violation',
      {
        description: `Atualiza uma violação de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Modificação de violações
- Atualização de status
- Alteração de informações

**Parâmetros:**
- \`violation_id\`: ID da violação
- \`updates\`: Objeto com as atualizações
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a violação atualizada.`,
        inputSchema: UpdateSecurityViolationSchema.shape,
      },
      async (params: z.infer<typeof UpdateSecurityViolationSchema>) => {
        const validatedParams = UpdateSecurityViolationSchema.parse(params);
        return await this.updateSecurityViolation(
          validatedParams.violation_id,
          validatedParams.updates,
          validatedParams.output
        );
      }
    );

    // Resolve Security Violation
    server.registerTool(
      'security_resolve_violation',
      {
        description: `Resolve uma violação de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Resolução de violações
- Marcação como resolvida
- Atualização de status

**Parâmetros:**
- \`violation_id\`: ID da violação
- \`resolution\`: Descrição da resolução
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a violação resolvida.`,
        inputSchema: ResolveSecurityViolationSchema.shape,
      },
      async (params: z.infer<typeof ResolveSecurityViolationSchema>) => {
        const validatedParams = ResolveSecurityViolationSchema.parse(params);
        return await this.resolveSecurityViolation(
          validatedParams.violation_id,
          validatedParams.resolution,
          validatedParams.output
        );
      }
    );

    // Ignore Security Violation
    server.registerTool(
      'security_ignore_violation',
      {
        description: `Ignora uma violação de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Ignorar violações
- Marcação como ignorada
- Atualização de status

**Parâmetros:**
- \`violation_id\`: ID da violação
- \`reason\`: Motivo para ignorar
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a violação ignorada.`,
        inputSchema: IgnoreSecurityViolationSchema.shape,
      },
      async (params: z.infer<typeof IgnoreSecurityViolationSchema>) => {
        const validatedParams = IgnoreSecurityViolationSchema.parse(params);
        return await this.ignoreSecurityViolation(
          validatedParams.violation_id,
          validatedParams.reason,
          validatedParams.output
        );
      }
    );

    // List Security Scans
    server.registerTool(
      'security_list_scans',
      {
        description: `Lista varreduras de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Listagem de varreduras
- Filtros e paginação
- Informações de status

**Parâmetros:**
- \`status\`: Filtro por status (opcional)
- \`type\`: Filtro por tipo (opcional)
- \`start_date\`: Data de início (opcional)
- \`end_date\`: Data de fim (opcional)
- \`start\`: Índice de início para paginação (opcional)
- \`limit\`: Número máximo de resultados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a lista de varreduras.`,
        inputSchema: ListSecurityScansSchema.shape,
      },
      async (params: z.infer<typeof ListSecurityScansSchema>) => {
        const validatedParams = ListSecurityScansSchema.parse(params);
        return await this.listSecurityScans(
          {
            status: validatedParams.status,
            type: validatedParams.type,
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            start: validatedParams.start,
            limit: validatedParams.limit,
          },
          validatedParams.output
        );
      }
    );

    // Get Security Scan
    server.registerTool(
      'security_get_scan',
      {
        description: `Obtém uma varredura de segurança específica no Bitbucket Data Center.

**Funcionalidades:**
- Detalhes da varredura
- Informações específicas
- Status atual

**Parâmetros:**
- \`scan_id\`: ID da varredura
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da varredura.`,
        inputSchema: GetSecurityScanSchema.shape,
      },
      async (params: z.infer<typeof GetSecurityScanSchema>) => {
        const validatedParams = GetSecurityScanSchema.parse(params);
        return await this.getSecurityScan(validatedParams.scan_id, validatedParams.output);
      }
    );

    // Create Security Scan
    server.registerTool(
      'security_create_scan',
      {
        description: `Cria uma nova varredura de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Criação de varreduras
- Configuração de parâmetros
- Metadados da varredura

**Parâmetros:**
- \`name\`: Nome da varredura
- \`type\`: Tipo da varredura
- \`target\`: Alvo da varredura (opcional)
- \`schedule\`: Agendamento (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da varredura criada.`,
        inputSchema: CreateSecurityScanSchema.shape,
      },
      async (params: z.infer<typeof CreateSecurityScanSchema>) => {
        const validatedParams = CreateSecurityScanSchema.parse(params);
        return await this.createSecurityScan(
          {
            name: validatedParams.name,
            type: validatedParams.type,
            target: validatedParams.target,
            schedule: validatedParams.schedule,
          },
          validatedParams.output
        );
      }
    );

    // Start Security Scan
    server.registerTool(
      'security_start_scan',
      {
        description: `Inicia uma varredura de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Início de varreduras
- Execução imediata
- Monitoramento de progresso

**Parâmetros:**
- \`scan_id\`: ID da varredura
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a varredura iniciada.`,
        inputSchema: StartSecurityScanSchema.shape,
      },
      async (params: z.infer<typeof StartSecurityScanSchema>) => {
        const validatedParams = StartSecurityScanSchema.parse(params);
        return await this.startSecurityScan(validatedParams.scan_id, validatedParams.output);
      }
    );

    // Stop Security Scan
    server.registerTool(
      'security_stop_scan',
      {
        description: `Para uma varredura de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Parada de varreduras
- Interrupção de execução
- Limpeza de recursos

**Parâmetros:**
- \`scan_id\`: ID da varredura
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a varredura parada.`,
        inputSchema: StopSecurityScanSchema.shape,
      },
      async (params: z.infer<typeof StopSecurityScanSchema>) => {
        const validatedParams = StopSecurityScanSchema.parse(params);
        return await this.stopSecurityScan(validatedParams.scan_id, validatedParams.output);
      }
    );

    // Cancel Security Scan
    server.registerTool(
      'security_cancel_scan',
      {
        description: `Cancela uma varredura de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Cancelamento de varreduras
- Interrupção de execução
- Limpeza de recursos

**Parâmetros:**
- \`scan_id\`: ID da varredura
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a varredura cancelada.`,
        inputSchema: CancelSecurityScanSchema.shape,
      },
      async (params: z.infer<typeof CancelSecurityScanSchema>) => {
        const validatedParams = CancelSecurityScanSchema.parse(params);
        return await this.cancelSecurityScan(validatedParams.scan_id, validatedParams.output);
      }
    );

    // Update Security Configuration
    server.registerTool(
      'security_update_configuration',
      {
        description: `Atualiza configuração de segurança no Bitbucket Data Center.

**Funcionalidades:**
- Atualização de configurações
- Modificação de parâmetros
- Aplicação de mudanças

**Parâmetros:**
- \`settings\`: Objeto com as configurações a serem atualizadas
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a configuração atualizada.`,
        inputSchema: UpdateSecurityConfigurationSchema.shape,
      },
      async (params: z.infer<typeof UpdateSecurityConfigurationSchema>) => {
        const validatedParams = UpdateSecurityConfigurationSchema.parse(params);
        return await this.updateSecurityConfiguration(
          validatedParams.settings,
          validatedParams.output
        );
      }
    );

    // Get Security Metrics For Range
    server.registerTool(
      'security_get_metrics_for_range',
      {
        description: `Obtém métricas de segurança para um período específico no Bitbucket Data Center.

**Funcionalidades:**
- Métricas por período
- Análise temporal
- Comparação de performance

**Parâmetros:**
- \`start_date\`: Data de início
- \`end_date\`: Data de fim
- \`metric_type\`: Tipo de métrica (opcional)
- \`granularity\`: Granularidade dos dados (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com as métricas do período.`,
        inputSchema: GetSecurityMetricsForRangeSchema.shape,
      },
      async (params: z.infer<typeof GetSecurityMetricsForRangeSchema>) => {
        const validatedParams = GetSecurityMetricsForRangeSchema.parse(params);
        return await this.getSecurityMetricsForRange(
          {
            start_date: validatedParams.start_date,
            end_date: validatedParams.end_date,
            metric_type: validatedParams.metric_type,
            granularity: validatedParams.granularity,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all data center security tools');
  }
}
