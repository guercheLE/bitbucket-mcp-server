/**
 * Deprecated Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// Deprecated endpoint information
export interface DeprecatedEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  deprecatedSince: string;
  removalVersion?: string;
  alternativeEndpoint?: string;
  description: string;
  links: Link[];
}

// Deprecated endpoint list response
export interface DeprecatedEndpointListResponse extends PagedResponse<DeprecatedEndpoint> {}

// Deprecated endpoint query parameters
export interface DeprecatedEndpointQueryParams extends PaginationParams {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  deprecatedSince?: string;
  removalVersion?: string;
}

// Deprecated endpoint details response
export interface DeprecatedEndpointResponse {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  deprecatedSince: string;
  removalVersion?: string;
  alternativeEndpoint?: string;
  description: string;
  migrationGuide?: string;
  breakingChanges?: string[];
  links: Link[];
}

// Deprecated endpoint usage statistics
export interface DeprecatedEndpointUsage {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  usageCount: number;
  lastUsed?: string;
  users: string[];
  applications: string[];
}

// Deprecated endpoint usage statistics response
export interface DeprecatedEndpointUsageResponse extends PagedResponse<DeprecatedEndpointUsage> {}

// Deprecated endpoint usage query parameters
export interface DeprecatedEndpointUsageQueryParams extends PaginationParams {
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  since?: string;
  until?: string;
}

// Deprecated feature information
export interface DeprecatedFeature {
  feature: string;
  deprecatedSince: string;
  removalVersion?: string;
  alternativeFeature?: string;
  description: string;
  migrationGuide?: string;
  breakingChanges?: string[];
  links: Link[];
}

// Deprecated feature list response
export interface DeprecatedFeatureListResponse extends PagedResponse<DeprecatedFeature> {}

// Deprecated feature query parameters
export interface DeprecatedFeatureQueryParams extends PaginationParams {
  feature?: string;
  deprecatedSince?: string;
  removalVersion?: string;
}

// Deprecated API version information
export interface DeprecatedApiVersion {
  version: string;
  deprecatedSince: string;
  removalDate?: string;
  alternativeVersion?: string;
  description: string;
  migrationGuide?: string;
  breakingChanges?: string[];
  links: Link[];
}

// Deprecated API version list response
export interface DeprecatedApiVersionListResponse extends PagedResponse<DeprecatedApiVersion> {}

// Deprecated API version query parameters
export interface DeprecatedApiVersionQueryParams extends PaginationParams {
  version?: string;
  deprecatedSince?: string;
  removalDate?: string;
}

// Deprecation notice
export interface DeprecationNotice {
  id: string;
  type: 'ENDPOINT' | 'FEATURE' | 'API_VERSION' | 'PARAMETER';
  resource: string;
  deprecatedSince: string;
  removalDate?: string;
  alternative?: string;
  description: string;
  migrationGuide?: string;
  breakingChanges?: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  links: Link[];
}

// Deprecation notice list response
export interface DeprecationNoticeListResponse extends PagedResponse<DeprecationNotice> {}

// Deprecation notice query parameters
export interface DeprecationNoticeQueryParams extends PaginationParams {
  type?: 'ENDPOINT' | 'FEATURE' | 'API_VERSION' | 'PARAMETER';
  resource?: string;
  deprecatedSince?: string;
  removalDate?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Deprecation policy information
export interface DeprecationPolicy {
  version: string;
  deprecationPeriod: number; // in days
  noticePeriod: number; // in days
  removalPolicy: 'IMMEDIATE' | 'GRACEFUL' | 'SCHEDULED';
  migrationSupport: boolean;
  documentation: string;
  supportChannels: string[];
  links: Link[];
}

// Deprecation policy response
export interface DeprecationPolicyResponse {
  version: string;
  deprecationPeriod: number;
  noticePeriod: number;
  removalPolicy: 'IMMEDIATE' | 'GRACEFUL' | 'SCHEDULED';
  migrationSupport: boolean;
  documentation: string;
  supportChannels: string[];
  links: Link[];
}

// Deprecation timeline
export interface DeprecationTimeline {
  resource: string;
  type: 'ENDPOINT' | 'FEATURE' | 'API_VERSION' | 'PARAMETER';
  timeline: Array<{
    date: string;
    event: 'DEPRECATED' | 'NOTICE' | 'REMOVAL' | 'MIGRATION_DEADLINE';
    description: string;
    version?: string;
  }>;
  links: Link[];
}

// Deprecation timeline response
export interface DeprecationTimelineResponse {
  resource: string;
  type: 'ENDPOINT' | 'FEATURE' | 'API_VERSION' | 'PARAMETER';
  timeline: Array<{
    date: string;
    event: 'DEPRECATED' | 'NOTICE' | 'REMOVAL' | 'MIGRATION_DEADLINE';
    description: string;
    version?: string;
  }>;
  links: Link[];
}

// Deprecation timeline query parameters
export interface DeprecationTimelineQueryParams extends PaginationParams {
  resource?: string;
  type?: 'ENDPOINT' | 'FEATURE' | 'API_VERSION' | 'PARAMETER';
  since?: string;
  until?: string;
}
