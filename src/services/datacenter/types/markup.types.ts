/**
 * Markup Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link } from './base.types.js';

// Markup type enum
export type MarkupType =
  | 'MARKDOWN'
  | 'PLAIN'
  | 'ATLASSIAN_WIKI'
  | 'CONFLUENCE'
  | 'TEXTILE'
  | 'RST'
  | 'ASCIIDOC'
  | 'MEDIAWIKI'
  | 'CREOLE'
  | 'ORIGINAL';

// Markup render request
export interface MarkupRenderRequest {
  markup: string;
  type: MarkupType;
  context?: {
    repository?: {
      slug: string;
      project: {
        key: string;
      };
    };
    project?: {
      key: string;
    };
  };
}

// Markup render response
export interface MarkupRenderResponse {
  rendered: string;
  type: MarkupType;
  original: string;
  links: {
    self: Link[];
  };
}

// Markup preview request
export interface MarkupPreviewRequest {
  markup: string;
  type: MarkupType;
  context?: {
    repository?: {
      slug: string;
      project: {
        key: string;
      };
    };
    project?: {
      key: string;
    };
  };
}

// Markup preview response
export interface MarkupPreviewResponse {
  preview: string;
  type: MarkupType;
  original: string;
  links: {
    self: Link[];
  };
}

// Markup validation request
export interface MarkupValidationRequest {
  markup: string;
  type: MarkupType;
}

// Markup validation response
export interface MarkupValidationResponse {
  valid: boolean;
  errors: Array<{
    line?: number;
    column?: number;
    message: string;
    type: 'ERROR' | 'WARNING' | 'INFO';
  }>;
  type: MarkupType;
  original: string;
  links: {
    self: Link[];
  };
}

// Markup supported types response
export interface MarkupSupportedTypesResponse {
  types: Array<{
    type: MarkupType;
    name: string;
    description: string;
    supported: boolean;
  }>;
  links: {
    self: Link[];
  };
}
