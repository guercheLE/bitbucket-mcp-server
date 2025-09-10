/**
 * System Maintenance Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse } from './base.types.js';

// System Status Types
export interface SystemStatus {
  status: SystemHealthStatus;
  version: string;
  buildNumber: string;
  buildDate: string;
  displayName: string;
  serverTime: number;
  timeZone: string;
  database: DatabaseStatus;
  cache: CacheStatus;
  storage: StorageStatus;
  memory: MemoryStatus;
  cpu: CpuStatus;
  network: NetworkStatus;
  services: ServiceStatus[];
  links: Link[];
}

export type SystemHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'MAINTENANCE';

export interface DatabaseStatus {
  status: ComponentStatus;
  version: string;
  connectionPool: ConnectionPoolStatus;
  queries: QueryStats;
  lastBackup?: number;
  nextBackup?: number;
}

export interface CacheStatus {
  status: ComponentStatus;
  type: CacheType;
  hitRate: number;
  size: number;
  maxSize: number;
  evictions: number;
  connections: number;
}

export type CacheType = 'HAZELCAST' | 'REDIS' | 'MEMCACHED' | 'IN_MEMORY';

export interface StorageStatus {
  status: ComponentStatus;
  type: StorageType;
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  usage: number;
  iops: number;
  latency: number;
}

export type StorageType = 'LOCAL' | 'NFS' | 'S3' | 'AZURE' | 'GCS';

export interface MemoryStatus {
  status: ComponentStatus;
  total: number;
  used: number;
  free: number;
  usage: number;
  heap: HeapStatus;
  nonHeap: NonHeapStatus;
}

export interface HeapStatus {
  total: number;
  used: number;
  free: number;
  usage: number;
  max: number;
}

export interface NonHeapStatus {
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface CpuStatus {
  status: ComponentStatus;
  usage: number;
  cores: number;
  loadAverage: number[];
  processes: number;
  threads: number;
}

export interface NetworkStatus {
  status: ComponentStatus;
  interfaces: NetworkInterface[];
  connections: ConnectionStats;
  bandwidth: BandwidthStats;
}

export interface NetworkInterface {
  name: string;
  type: InterfaceType;
  status: ComponentStatus;
  speed: number;
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
}

export type InterfaceType = 'ETHERNET' | 'WIFI' | 'LOOPBACK' | 'VIRTUAL';

export interface ConnectionStats {
  active: number;
  established: number;
  timeWait: number;
  closeWait: number;
  listen: number;
}

export interface BandwidthStats {
  inbound: number;
  outbound: number;
  peakInbound: number;
  peakOutbound: number;
}

export interface ServiceStatus {
  name: string;
  status: ComponentStatus;
  version?: string;
  uptime: number;
  lastRestart?: number;
  health: ServiceHealth;
  dependencies: string[];
}

export type ComponentStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';

export interface ServiceHealth {
  status: ComponentStatus;
  message?: string;
  lastCheck: number;
  responseTime?: number;
  errorRate?: number;
}

export interface ConnectionPoolStatus {
  active: number;
  idle: number;
  max: number;
  min: number;
  usage: number;
  waitTime: number;
}

export interface QueryStats {
  total: number;
  average: number;
  slow: number;
  failed: number;
  cacheHits: number;
  cacheMisses: number;
}

// System Status Response Types
export interface SystemStatusResponse extends SystemStatus {}

// Maintenance Task Types
export interface MaintenanceTask {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  schedule: TaskSchedule;
  lastRun?: TaskExecution;
  nextRun?: number;
  configuration: TaskConfiguration;
  createdDate: number;
  updatedDate: number;
  createdBy: number;
  links: Link[];
}

export type TaskType =
  | 'BACKUP'
  | 'CLEANUP'
  | 'OPTIMIZATION'
  | 'INDEX_REBUILD'
  | 'CACHE_CLEAR'
  | 'LOG_ROTATION'
  | 'HEALTH_CHECK'
  | 'CUSTOM_SCRIPT';

export type TaskStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ERROR';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface TaskSchedule {
  type: ScheduleType;
  cron?: string;
  interval?: number;
  timezone: string;
  enabled: boolean;
}

export type ScheduleType = 'MANUAL' | 'CRON' | 'INTERVAL' | 'ONCE';

export interface TaskExecution {
  id: string;
  taskId: string;
  status: ExecutionStatus;
  startedDate: number;
  completedDate?: number;
  duration?: number;
  result: ExecutionResult;
  logs: TaskLog[];
  triggeredBy: number;
}

export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';

export interface ExecutionResult {
  success: boolean;
  message?: string;
  metrics?: Record<string, any>;
  errors?: TaskError[];
}

export interface TaskLog {
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface TaskError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface TaskConfiguration {
  parameters: Record<string, any>;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  notifications: TaskNotification[];
}

export interface TaskNotification {
  type: NotificationType;
  enabled: boolean;
  recipients: string[];
  conditions: NotificationCondition[];
}

export type NotificationType = 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'TEAMS';

export interface NotificationCondition {
  event: NotificationEvent;
  threshold?: number;
  operator?: ConditionOperator;
}

export type NotificationEvent = 'SUCCESS' | 'FAILURE' | 'START' | 'COMPLETION';

export type ConditionOperator = 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';

// Maintenance Task Request Types
export interface MaintenanceTaskCreateRequest {
  name: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  schedule: TaskSchedule;
  configuration: TaskConfiguration;
}

export interface MaintenanceTaskUpdateRequest {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  schedule?: TaskSchedule;
  configuration?: TaskConfiguration;
}

export interface MaintenanceTaskQueryParams {
  start?: number;
  limit?: number;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
}

// Maintenance Task Response Types
export interface MaintenanceTaskResponse extends MaintenanceTask {}

export interface MaintenanceTaskListResponse extends PagedResponse<MaintenanceTask> {}

// Task Execution Types
export interface TaskExecutionResponse extends TaskExecution {}

export interface TaskExecutionListResponse extends PagedResponse<TaskExecution> {}

export interface TaskExecutionQueryParams {
  start?: number;
  limit?: number;
  taskId?: string;
  status?: ExecutionStatus;
  fromDate?: number;
  toDate?: number;
}

// System Configuration Types
export interface SystemConfiguration {
  general: GeneralConfiguration;
  database: DatabaseConfiguration;
  cache: CacheConfiguration;
  storage: StorageConfiguration;
  security: SecurityConfiguration;
  performance: PerformanceConfiguration;
  monitoring: MonitoringConfiguration;
}

export interface GeneralConfiguration {
  instanceName: string;
  baseUrl: string;
  timezone: string;
  locale: string;
  maintenanceMode: boolean;
  debugMode: boolean;
}

export interface DatabaseConfiguration {
  type: DatabaseType;
  host: string;
  port: number;
  name: string;
  username: string;
  connectionPool: ConnectionPoolConfig;
  backup: BackupConfiguration;
}

export type DatabaseType = 'POSTGRESQL' | 'MYSQL' | 'ORACLE' | 'SQLSERVER' | 'H2';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
}

export interface BackupConfiguration {
  enabled: boolean;
  schedule: string;
  retention: number;
  compression: boolean;
  encryption: boolean;
  location: string;
}

export interface CacheConfiguration {
  type: CacheType;
  host: string;
  port: number;
  maxSize: number;
  ttl: number;
  evictionPolicy: EvictionPolicy;
  clustering: ClusteringConfiguration;
}

export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO' | 'TTL';

export interface ClusteringConfiguration {
  enabled: boolean;
  nodes: string[];
  discovery: DiscoveryConfiguration;
}

export interface DiscoveryConfiguration {
  type: DiscoveryType;
  multicast?: MulticastConfig;
  tcp?: TcpConfig;
  aws?: AwsConfig;
}

export type DiscoveryType = 'MULTICAST' | 'TCP' | 'AWS' | 'KUBERNETES';

export interface MulticastConfig {
  group: string;
  port: number;
  ttl: number;
}

export interface TcpConfig {
  members: string[];
  port: number;
}

export interface AwsConfig {
  region: string;
  securityGroup: string;
  tagKey: string;
  tagValue: string;
}

export interface StorageConfiguration {
  type: StorageType;
  path: string;
  maxSize: number;
  compression: boolean;
  encryption: boolean;
  replication: ReplicationConfiguration;
}

export interface ReplicationConfiguration {
  enabled: boolean;
  factor: number;
  nodes: string[];
  strategy: ReplicationStrategy;
}

export type ReplicationStrategy = 'SYNC' | 'ASYNC' | 'QUORUM';

export interface SecurityConfiguration {
  ssl: SslConfiguration;
  authentication: AuthenticationConfiguration;
  authorization: AuthorizationConfiguration;
  audit: AuditConfiguration;
}

export interface SslConfiguration {
  enabled: boolean;
  certificate: string;
  privateKey: string;
  trustStore?: string;
  protocols: string[];
  ciphers: string[];
}

export interface AuthenticationConfiguration {
  provider: AuthProvider;
  sessionTimeout: number;
  maxSessions: number;
  passwordPolicy: PasswordPolicy;
}

export type AuthProvider = 'INTERNAL' | 'LDAP' | 'SAML' | 'OAUTH' | 'CROWD';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays?: number;
}

export interface AuthorizationConfiguration {
  provider: AuthzProvider;
  cacheTimeout: number;
  defaultPermissions: string[];
}

export type AuthzProvider = 'INTERNAL' | 'LDAP' | 'CROWD' | 'CUSTOM';

export interface AuditConfiguration {
  enabled: boolean;
  level: AuditLevel;
  retention: number;
  realTime: boolean;
}

export type AuditLevel = 'MINIMAL' | 'STANDARD' | 'DETAILED' | 'VERBOSE';

export interface PerformanceConfiguration {
  threadPool: ThreadPoolConfiguration;
  gc: GarbageCollectionConfiguration;
  jvm: JvmConfiguration;
}

export interface ThreadPoolConfiguration {
  coreSize: number;
  maxSize: number;
  queueSize: number;
  keepAlive: number;
}

export interface GarbageCollectionConfiguration {
  type: GcType;
  heapSize: string;
  newGenSize: string;
  survivorRatio: number;
  maxGcPause: number;
}

export type GcType = 'G1GC' | 'PARALLEL' | 'CMS' | 'SERIAL';

export interface JvmConfiguration {
  heapSize: string;
  newGenSize: string;
  permGenSize: string;
  maxDirectMemory: string;
  gcOptions: string[];
  jvmOptions: string[];
}

export interface MonitoringConfiguration {
  enabled: boolean;
  metrics: MetricsConfiguration;
  alerts: AlertsConfiguration;
  dashboards: DashboardsConfiguration;
}

export interface MetricsConfiguration {
  collection: boolean;
  retention: number;
  exporters: MetricsExporter[];
}

export interface MetricsExporter {
  type: ExporterType;
  enabled: boolean;
  configuration: Record<string, any>;
}

export type ExporterType = 'PROMETHEUS' | 'JMX' | 'GRAPHITE' | 'INFLUXDB';

export interface AlertsConfiguration {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  id: string;
  type: ChannelType;
  enabled: boolean;
  configuration: Record<string, any>;
}

export type ChannelType = 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'TEAMS';

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  enabled: boolean;
  channels: string[];
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface DashboardsConfiguration {
  enabled: boolean;
  defaultDashboard: string;
  refreshInterval: number;
  retention: number;
}

// System Configuration Response Types
export interface SystemConfigurationResponse extends SystemConfiguration {}

// System Metrics Types
export interface SystemMetrics {
  timestamp: number;
  system: SystemMetricsData;
  application: ApplicationMetricsData;
  database: DatabaseMetricsData;
  cache: CacheMetricsData;
  storage: StorageMetricsData;
}

export interface SystemMetricsData {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  load: LoadMetrics;
}

export interface CpuMetrics {
  usage: number;
  cores: number;
  loadAverage: number[];
  processes: number;
  threads: number;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
  swap: SwapMetrics;
}

export interface SwapMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
  iops: number;
  latency: number;
}

export interface NetworkMetrics {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  errors: number;
  dropped: number;
}

export interface LoadMetrics {
  oneMinute: number;
  fiveMinutes: number;
  fifteenMinutes: number;
}

export interface ApplicationMetricsData {
  requests: RequestMetrics;
  sessions: SessionMetrics;
  errors: ErrorMetrics;
  performance: PerformanceMetrics;
}

export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface SessionMetrics {
  active: number;
  total: number;
  averageDuration: number;
  maxDuration: number;
}

export interface ErrorMetrics {
  total: number;
  byType: Record<string, number>;
  byEndpoint: Record<string, number>;
  rate: number;
}

export interface PerformanceMetrics {
  throughput: number;
  latency: number;
  concurrency: number;
  queueSize: number;
}

export interface DatabaseMetricsData {
  connections: ConnectionMetrics;
  queries: QueryMetrics;
  transactions: TransactionMetrics;
  locks: LockMetrics;
}

export interface ConnectionMetrics {
  active: number;
  idle: number;
  max: number;
  usage: number;
  waitTime: number;
}

export interface QueryMetrics {
  total: number;
  average: number;
  slow: number;
  failed: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface TransactionMetrics {
  total: number;
  committed: number;
  rolledBack: number;
  averageDuration: number;
  deadlocks: number;
}

export interface LockMetrics {
  total: number;
  waiting: number;
  deadlocks: number;
  averageWaitTime: number;
}

export interface CacheMetricsData {
  size: number;
  maxSize: number;
  usage: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  connections: number;
}

export interface StorageMetricsData {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  usage: number;
  iops: number;
  latency: number;
  throughput: number;
}

// System Metrics Response Types
export interface SystemMetricsResponse extends SystemMetrics {}

export interface SystemMetricsListResponse {
  metrics: SystemMetrics[];
  total: number;
}

export interface SystemMetricsQueryParams {
  start?: number;
  limit?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
  interval?: number;
}
