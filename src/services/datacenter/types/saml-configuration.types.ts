/**
 * SAML Configuration Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link } from './base.types.js';

// SAML configuration
export interface SamlConfiguration {
  id: number;
  name: string;
  description?: string;
  enabled: boolean;
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: {
    id: string;
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    fingerprint: string;
    algorithm: string;
    keySize: number;
  };
  attributeMapping: {
    username: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    groups?: string;
  };
  groupMapping: Array<{
    samlGroup: string;
    bitbucketGroup: string;
  }>;
  defaultGroup?: string;
  autoCreateUsers: boolean;
  autoUpdateUsers: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  links: {
    self: Link[];
  };
}

// SAML configuration request
export interface SamlConfigurationRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: {
    data: string; // Base64 encoded certificate
    password?: string;
  };
  attributeMapping: {
    username: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    groups?: string;
  };
  groupMapping?: Array<{
    samlGroup: string;
    bitbucketGroup: string;
  }>;
  defaultGroup?: string;
  autoCreateUsers?: boolean;
  autoUpdateUsers?: boolean;
}

// SAML configuration update request
export interface SamlConfigurationUpdateRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  entityId?: string;
  ssoUrl?: string;
  sloUrl?: string;
  certificate?: {
    data: string; // Base64 encoded certificate
    password?: string;
  };
  attributeMapping?: {
    username?: string;
    email?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    groups?: string;
  };
  groupMapping?: Array<{
    samlGroup: string;
    bitbucketGroup: string;
  }>;
  defaultGroup?: string;
  autoCreateUsers?: boolean;
  autoUpdateUsers?: boolean;
}

// SAML certificate
export interface SamlCertificate {
  id: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  algorithm: string;
  keySize: number;
  data: string; // Base64 encoded certificate
  createdDate: string;
  updatedDate: string;
  links: {
    self: Link[];
  };
}

// SAML certificate request
export interface SamlCertificateRequest {
  data: string; // Base64 encoded certificate
  password?: string;
}

// SAML test configuration
export interface SamlTestConfiguration {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: {
    data: string; // Base64 encoded certificate
    password?: string;
  };
  attributeMapping: {
    username: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    groups?: string;
  };
}

// SAML test result
export interface SamlTestResult {
  success: boolean;
  message: string;
  details?: {
    certificateValid: boolean;
    ssoUrlReachable: boolean;
    sloUrlReachable?: boolean;
    attributeMappingValid: boolean;
    errors: Array<{
      type: string;
      message: string;
    }>;
  };
  links: {
    self: Link[];
  };
}

// SAML metadata
export interface SamlMetadata {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string; // Base64 encoded certificate
  metadata: string; // XML metadata
  links: {
    self: Link[];
  };
}

// SAML user mapping
export interface SamlUserMapping {
  username: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  groups: string[];
  lastLogin?: string;
  createdDate: string;
  updatedDate: string;
  links: {
    self: Link[];
  };
}

// SAML group mapping
export interface SamlGroupMapping {
  samlGroup: string;
  bitbucketGroup: string;
  createdDate: string;
  updatedDate: string;
  links: {
    self: Link[];
  };
}

// SAML configuration list response
export interface SamlConfigurationListResponse {
  configurations: SamlConfiguration[];
  totalCount: number;
  links: {
    self: Link[];
  };
}
