/**
 * Security Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse } from './base.types.js';

// Security Audit Types
export interface SecurityAudit {
  id: string;
  timestamp: number;
  userId: number;
  userName: string;
  action: SecurityAction;
  resource: SecurityResource;
  result: SecurityResult;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export type SecurityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'REPOSITORY_ACCESS'
  | 'REPOSITORY_CREATE'
  | 'REPOSITORY_DELETE'
  | 'PULL_REQUEST_CREATE'
  | 'PULL_REQUEST_MERGE'
  | 'ADMIN_ACTION'
  | 'API_ACCESS'
  | 'WEBHOOK_TRIGGER'
  | 'BUILD_TRIGGER'
  | 'DEPLOYMENT_TRIGGER';

export interface SecurityResource {
  type: ResourceType;
  id: string;
  name?: string;
  projectKey?: string;
  repositorySlug?: string;
}

export type ResourceType =
  | 'SYSTEM'
  | 'PROJECT'
  | 'REPOSITORY'
  | 'PULL_REQUEST'
  | 'COMMIT'
  | 'BRANCH'
  | 'TAG'
  | 'USER'
  | 'GROUP'
  | 'WEBHOOK'
  | 'BUILD'
  | 'DEPLOYMENT';

export type SecurityResult = 'SUCCESS' | 'FAILURE' | 'DENIED' | 'ERROR';

// Security Audit Request Types
export interface SecurityAuditQueryParams {
  start?: number;
  limit?: number;
  userId?: number;
  action?: SecurityAction;
  resourceType?: ResourceType;
  result?: SecurityResult;
  fromTimestamp?: number;
  toTimestamp?: number;
  ipAddress?: string;
}

// Security Audit Response Types
export interface SecurityAuditResponse extends SecurityAudit {}

export interface SecurityAuditListResponse extends PagedResponse<SecurityAudit> {}

// Security Policy Types
export interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  type: PolicyType;
  enabled: boolean;
  rules: SecurityRule[];
  scope: PolicyScope;
  createdDate: number;
  updatedDate: number;
  createdBy: number;
  updatedBy: number;
  links: Link[];
}

export type PolicyType =
  | 'PASSWORD'
  | 'SESSION'
  | 'API_ACCESS'
  | 'REPOSITORY_ACCESS'
  | 'PULL_REQUEST'
  | 'BRANCH_PROTECTION'
  | 'WEBHOOK'
  | 'BUILD'
  | 'DEPLOYMENT'
  | 'CUSTOM';

export interface SecurityRule {
  id: string;
  name: string;
  description?: string;
  type: RuleType;
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
  priority: number;
}

export type RuleType =
  | 'PASSWORD_COMPLEXITY'
  | 'PASSWORD_EXPIRY'
  | 'SESSION_TIMEOUT'
  | 'API_RATE_LIMIT'
  | 'REPOSITORY_PERMISSION'
  | 'BRANCH_RESTRICTION'
  | 'WEBHOOK_VALIDATION'
  | 'BUILD_APPROVAL'
  | 'DEPLOYMENT_APPROVAL'
  | 'CUSTOM_SCRIPT';

export interface RuleCondition {
  field: string;
  operator: SecurityConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export type SecurityConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'NOT_IN'
  | 'REGEX'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY';

export type LogicalOperator = 'AND' | 'OR';

export interface RuleAction {
  type: ActionType;
  parameters: Record<string, any>;
}

export type ActionType = 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL' | 'LOG' | 'NOTIFY' | 'CUSTOM_SCRIPT';

export interface PolicyScope {
  type: ScopeType;
  targets: string[];
}

export type ScopeType = 'GLOBAL' | 'PROJECT' | 'REPOSITORY' | 'USER' | 'GROUP';

// Security Policy Request Types
export interface SecurityPolicyCreateRequest {
  name: string;
  description?: string;
  type: PolicyType;
  rules: SecurityRule[];
  scope: PolicyScope;
}

export interface SecurityPolicyUpdateRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  rules?: SecurityRule[];
  scope?: PolicyScope;
}

export interface SecurityPolicyQueryParams {
  start?: number;
  limit?: number;
  type?: PolicyType;
  enabled?: boolean;
  scopeType?: ScopeType;
}

// Security Policy Response Types
export interface SecurityPolicyResponse extends SecurityPolicy {}

export interface SecurityPolicyListResponse extends PagedResponse<SecurityPolicy> {}

// Security Violation Types
export interface SecurityViolation {
  id: string;
  policyId: string;
  policyName: string;
  userId: number;
  userName: string;
  timestamp: number;
  severity: ViolationSeverity;
  status: ViolationStatus;
  details: ViolationDetails;
  resolution?: ViolationResolution;
  links: Link[];
}

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ViolationStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE' | 'IGNORED';

export interface ViolationDetails {
  action: SecurityAction;
  resource: SecurityResource;
  rule: SecurityRule;
  context: Record<string, any>;
}

export interface ViolationResolution {
  resolvedBy: number;
  resolvedDate: number;
  resolution: string;
  notes?: string;
}

// Security Violation Request Types
export interface SecurityViolationQueryParams {
  start?: number;
  limit?: number;
  policyId?: string;
  userId?: number;
  severity?: ViolationSeverity;
  status?: ViolationStatus;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export interface SecurityViolationUpdateRequest {
  status: ViolationStatus;
  resolution?: string;
  notes?: string;
}

// Security Violation Response Types
export interface SecurityViolationResponse extends SecurityViolation {}

export interface SecurityViolationListResponse extends PagedResponse<SecurityViolation> {}

// Security Configuration Types
export interface SecurityConfig {
  passwordPolicy: SecurityPasswordPolicy;
  sessionPolicy: SessionPolicy;
  apiPolicy: ApiPolicy;
  auditPolicy: AuditPolicy;
  notificationPolicy: NotificationPolicy;
}

export interface SecurityPasswordPolicy {
  enabled: boolean;
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expiryDays?: number;
  lockoutAttempts: number;
  lockoutDuration: number;
}

export interface SessionPolicy {
  enabled: boolean;
  timeoutMinutes: number;
  maxConcurrentSessions: number;
  requireReauth: boolean;
  rememberMeEnabled: boolean;
  rememberMeDays: number;
}

export interface ApiPolicy {
  enabled: boolean;
  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
  requireAuthentication: boolean;
  allowedOrigins: string[];
  blockedOrigins: string[];
}

export interface AuditPolicy {
  enabled: boolean;
  retentionDays: number;
  logLevel: AuditLogLevel;
  includeDetails: boolean;
  realTimeAlerts: boolean;
}

export type AuditLogLevel = 'MINIMAL' | 'STANDARD' | 'DETAILED' | 'VERBOSE';

export interface NotificationPolicy {
  enabled: boolean;
  emailNotifications: boolean;
  webhookNotifications: boolean;
  notificationChannels: NotificationChannel[];
  alertThresholds: AlertThreshold[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: SecurityChannelType;
  enabled: boolean;
  configuration: Record<string, any>;
}

export type SecurityChannelType = 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'TEAMS' | 'CUSTOM';

export interface AlertThreshold {
  severity: ViolationSeverity;
  count: number;
  timeWindow: number;
  enabled: boolean;
}

// Security Configuration Response Types
export interface SecurityConfigurationResponse extends SecurityConfig {}

// Security Metrics Types
export interface SecurityMetrics {
  period: DateRange;
  totalViolations: number;
  violationsBySeverity: Record<ViolationSeverity, number>;
  violationsByType: Record<PolicyType, number>;
  topViolators: SecurityViolator[];
  topPolicies: SecurityPolicyMetrics[];
  trends: SecurityTrend[];
}

export interface DateRange {
  from: number;
  to: number;
}

export interface SecurityViolator {
  userId: number;
  userName: string;
  violationCount: number;
  lastViolation: number;
}

export interface SecurityPolicyMetrics {
  policyId: string;
  policyName: string;
  violationCount: number;
  resolutionRate: number;
  averageResolutionTime: number;
}

export interface SecurityTrend {
  date: number;
  violations: number;
  resolved: number;
  severity: Record<ViolationSeverity, number>;
}

export interface SecurityMetricsResponse extends SecurityMetrics {}

// Security Scan Types
export interface SecurityScan {
  id: string;
  type: ScanType;
  status: ScanStatus;
  target: ScanTarget;
  startedDate: number;
  completedDate?: number;
  findings: SecurityFinding[];
  summary: ScanSummary;
  links: Link[];
}

export type ScanType = 'DEPENDENCY' | 'SECRET' | 'VULNERABILITY' | 'COMPLIANCE' | 'CUSTOM';

export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ScanTarget {
  type: ResourceType;
  id: string;
  name: string;
  projectKey?: string;
  repositorySlug?: string;
}

export interface SecurityFinding {
  id: string;
  type: FindingType;
  severity: ViolationSeverity;
  title: string;
  description: string;
  location: FindingLocation;
  recommendation: string;
  status: FindingStatus;
  discoveredDate: number;
  resolvedDate?: number;
}

export type FindingType =
  | 'VULNERABILITY'
  | 'SECRET_LEAK'
  | 'DEPENDENCY_ISSUE'
  | 'COMPLIANCE_VIOLATION'
  | 'CONFIGURATION_ISSUE';

export interface FindingLocation {
  file?: string;
  line?: number;
  column?: number;
  commit?: string;
  branch?: string;
}

export type FindingStatus = 'OPEN' | 'FIXED' | 'IGNORED' | 'FALSE_POSITIVE';

export interface ScanSummary {
  totalFindings: number;
  findingsBySeverity: Record<ViolationSeverity, number>;
  findingsByType: Record<FindingType, number>;
  resolvedFindings: number;
  falsePositives: number;
}

// Security Scan Request Types
export interface SecurityScanCreateRequest {
  type: ScanType;
  target: ScanTarget;
  configuration?: Record<string, any>;
}

export interface SecurityScanQueryParams {
  start?: number;
  limit?: number;
  type?: ScanType;
  status?: ScanStatus;
  targetType?: ResourceType;
  fromDate?: number;
  toDate?: number;
}

// Security Scan Response Types
export interface SecurityScanResponse extends SecurityScan {}

export interface SecurityScanListResponse extends PagedResponse<SecurityScan> {}
