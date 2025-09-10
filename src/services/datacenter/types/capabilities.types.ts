/**
 * Capabilities Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link } from './base.types.js';

// Capability Types
export interface Capability {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  version: string;
  type: CapabilityType;
  configuration?: Record<string, any>;
  links: Link[];
}

export type CapabilityType = 'PLUGIN' | 'FEATURE' | 'INTEGRATION' | 'EXTENSION';

// Capability Query Types
export interface CapabilityQueryParams {
  type?: CapabilityType;
  enabled?: boolean;
  version?: string;
}

// Capability Response Types
export interface CapabilityResponse extends Capability {}

export interface CapabilityListResponse {
  capabilities: Capability[];
  total: number;
}

// System Capabilities
export interface SystemCapabilities {
  version: string;
  buildNumber: string;
  buildDate: string;
  displayName: string;
  capabilities: Capability[];
  links: Link[];
}

export interface SystemCapabilitiesResponse extends SystemCapabilities {}

// Plugin Capabilities
export interface PluginCapability extends Capability {
  pluginKey: string;
  pluginName: string;
  pluginVersion: string;
  pluginDescription?: string;
  pluginVendor?: string;
  pluginState: PluginState;
  dependencies: PluginDependency[];
}

export type PluginState = 'ENABLED' | 'DISABLED' | 'UNLOADED' | 'ERROR';

export interface PluginDependency {
  pluginKey: string;
  pluginName: string;
  version: string;
  optional: boolean;
}

export interface PluginCapabilityResponse extends PluginCapability {}

export interface PluginCapabilityListResponse {
  plugins: PluginCapability[];
  total: number;
}

// Feature Capabilities
export interface FeatureCapability extends Capability {
  featureKey: string;
  featureName: string;
  featureDescription?: string;
  category: FeatureCategory;
  experimental: boolean;
  deprecated: boolean;
}

export type FeatureCategory = 'CORE' | 'ADVANCED' | 'EXPERIMENTAL' | 'DEPRECATED';

export interface FeatureCapabilityResponse extends FeatureCapability {}

export interface FeatureCapabilityListResponse {
  features: FeatureCapability[];
  total: number;
}

// Integration Capabilities
export interface IntegrationCapability extends Capability {
  integrationKey: string;
  integrationName: string;
  integrationDescription?: string;
  provider: string;
  supportedOperations: IntegrationOperation[];
  configurationSchema?: Record<string, any>;
}

export interface IntegrationOperation {
  operation: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface IntegrationCapabilityResponse extends IntegrationCapability {}

export interface IntegrationCapabilityListResponse {
  integrations: IntegrationCapability[];
  total: number;
}

// Capability Configuration Types
export interface CapabilityConfiguration {
  capabilityId: string;
  configuration: Record<string, any>;
  version: string;
}

export interface CapabilityConfigurationRequest {
  configuration: Record<string, any>;
}

export interface CapabilityConfigurationResponse extends CapabilityConfiguration {}

// Capability Status Types
export interface CapabilityStatus {
  capabilityId: string;
  status: CapabilityStatusType;
  message?: string;
  lastChecked: number;
  health: HealthStatus;
}

export type CapabilityStatusType = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export type HealthStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';

export interface CapabilityStatusResponse extends CapabilityStatus {}

export interface CapabilityStatusListResponse {
  statuses: CapabilityStatus[];
  total: number;
}

// Capability Metrics Types
export interface CapabilityMetrics {
  capabilityId: string;
  metrics: CapabilityMetric[];
  timestamp: number;
}

export interface CapabilityMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface CapabilityMetricsResponse extends CapabilityMetrics {}

export interface CapabilityMetricsListResponse {
  metrics: CapabilityMetrics[];
  total: number;
}

// Capability Events Types
export interface CapabilityEvent {
  id: string;
  capabilityId: string;
  eventType: CapabilityEventType;
  timestamp: number;
  message: string;
  details?: Record<string, any>;
}

export type CapabilityEventType =
  | 'ENABLED'
  | 'DISABLED'
  | 'CONFIGURED'
  | 'ERROR'
  | 'WARNING'
  | 'INFO';

export interface CapabilityEventResponse extends CapabilityEvent {}

export interface CapabilityEventListResponse {
  events: CapabilityEvent[];
  total: number;
}

export interface CapabilityEventQueryParams {
  start?: number;
  limit?: number;
  eventType?: CapabilityEventType;
  fromTimestamp?: number;
  toTimestamp?: number;
}
