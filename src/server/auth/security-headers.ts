/**
 * Security Headers and CORS Management for Bitbucket MCP Server
 * 
 * This module provides comprehensive security headers and CORS configuration
 * for protecting the authentication system and API endpoints.
 * 
 * Key Features:
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
 * - CORS configuration with fine-grained control
 * - Content Security Policy management
 * - Security header validation
 * - Dynamic header configuration
 * - Security policy enforcement
 * 
 * Constitutional Requirements:
 * - Security best practices
 * - CORS compliance
 * - Content Security Policy
 * - Header validation
 * - Performance optimization
 */

import { EventEmitter } from 'events';

/**
 * Security Header Types
 * Types of security headers supported
 */
export enum SecurityHeaderType {
  HSTS = 'Strict-Transport-Security',
  CSP = 'Content-Security-Policy',
  X_FRAME_OPTIONS = 'X-Frame-Options',
  X_CONTENT_TYPE_OPTIONS = 'X-Content-Type-Options',
  X_XSS_PROTECTION = 'X-XSS-Protection',
  REFERRER_POLICY = 'Referrer-Policy',
  PERMISSIONS_POLICY = 'Permissions-Policy',
  CROSS_ORIGIN_EMBEDDER_POLICY = 'Cross-Origin-Embedder-Policy',
  CROSS_ORIGIN_OPENER_POLICY = 'Cross-Origin-Opener-Policy',
  CROSS_ORIGIN_RESOURCE_POLICY = 'Cross-Origin-Resource-Policy'
}

/**
 * CORS Configuration
 * Configuration for Cross-Origin Resource Sharing
 */
export interface CorsConfig {
  /** Allowed origins */
  origins: string[];
  
  /** Allowed methods */
  methods: string[];
  
  /** Allowed headers */
  headers: string[];
  
  /** Exposed headers */
  exposedHeaders: string[];
  
  /** Whether credentials are allowed */
  credentials: boolean;
  
  /** Preflight cache duration */
  maxAge: number;
  
  /** Whether to allow all origins */
  allowAllOrigins: boolean;
  
  /** Custom origin validation function */
  originValidator?: (origin: string) => boolean;
}

/**
 * Content Security Policy Configuration
 * Configuration for Content Security Policy
 */
export interface CspConfig {
  /** Default source directive */
  defaultSrc: string[];
  
  /** Script source directive */
  scriptSrc: string[];
  
  /** Style source directive */
  styleSrc: string[];
  
  /** Image source directive */
  imgSrc: string[];
  
  /** Font source directive */
  fontSrc: string[];
  
  /** Connect source directive */
  connectSrc: string[];
  
  /** Media source directive */
  mediaSrc: string[];
  
  /** Object source directive */
  objectSrc: string[];
  
  /** Child source directive */
  childSrc: string[];
  
  /** Frame source directive */
  frameSrc: string[];
  
  /** Worker source directive */
  workerSrc: string[];
  
  /** Manifest source directive */
  manifestSrc: string[];
  
  /** Form action directive */
  formAction: string[];
  
  /** Frame ancestors directive */
  frameAncestors: string[];
  
  /** Base URI directive */
  baseUri: string[];
  
  /** Upgrade insecure requests */
  upgradeInsecureRequests: boolean;
  
  /** Block all mixed content */
  blockAllMixedContent: boolean;
  
  /** Report URI */
  reportUri?: string;
  
  /** Report only mode */
  reportOnly: boolean;
}

/**
 * Security Headers Configuration
 * Configuration for security headers
 */
export interface SecurityHeadersConfig {
  /** HSTS configuration */
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  
  /** Content Security Policy */
  csp: CspConfig;
  
  /** X-Frame-Options */
  xFrameOptions: {
    enabled: boolean;
    value: 'DENY' | 'SAMEORIGIN' | string;
  };
  
  /** X-Content-Type-Options */
  xContentTypeOptions: {
    enabled: boolean;
  };
  
  /** X-XSS-Protection */
  xXssProtection: {
    enabled: boolean;
    mode: '0' | '1' | '1; mode=block';
  };
  
  /** Referrer Policy */
  referrerPolicy: {
    enabled: boolean;
    value: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  };
  
  /** Permissions Policy */
  permissionsPolicy: {
    enabled: boolean;
    features: Record<string, string[]>;
  };
  
  /** Cross-Origin Policies */
  crossOriginPolicies: {
    embedderPolicy: 'unsafe-none' | 'require-corp';
    openerPolicy: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
    resourcePolicy: 'same-site' | 'same-origin' | 'cross-origin';
  };
}

/**
 * Security Headers Manager
 * Main class for managing security headers and CORS
 */
export class SecurityHeadersManager extends EventEmitter {
  private config: SecurityHeadersConfig;
  private corsConfig: CorsConfig;
  private customHeaders: Map<string, string> = new Map();

  constructor(
    securityConfig: Partial<SecurityHeadersConfig> = {},
    corsConfig: Partial<CorsConfig> = {}
  ) {
    super();
    
    this.config = {
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'self'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: true,
        blockAllMixedContent: true,
        reportOnly: false
      },
      xFrameOptions: {
        enabled: true,
        value: 'DENY'
      },
      xContentTypeOptions: {
        enabled: true
      },
      xXssProtection: {
        enabled: true,
        mode: '1; mode=block'
      },
      referrerPolicy: {
        enabled: true,
        value: 'strict-origin-when-cross-origin'
      },
      permissionsPolicy: {
        enabled: true,
        features: {
          camera: ['none'],
          microphone: ['none'],
          geolocation: ['none'],
          payment: ['none'],
          usb: ['none']
        }
      },
      crossOriginPolicies: {
        embedderPolicy: 'require-corp',
        openerPolicy: 'same-origin',
        resourcePolicy: 'same-origin'
      },
      ...securityConfig
    };

    this.corsConfig = {
      origins: ['http://localhost:3000', 'https://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
      credentials: true,
      maxAge: 86400, // 24 hours
      allowAllOrigins: false,
      ...corsConfig
    };
  }

  /**
   * Generate security headers for a request
   */
  generateSecurityHeaders(request?: {
    origin?: string;
    userAgent?: string;
    isHttps?: boolean;
  }): Record<string, string> {
    const headers: Record<string, string> = {};

    // HSTS (only for HTTPS)
    if (this.config.hsts.enabled && request?.isHttps) {
      let hstsValue = `max-age=${this.config.hsts.maxAge}`;
      if (this.config.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.config.hsts.preload) {
        hstsValue += '; preload';
      }
      headers[SecurityHeaderType.HSTS] = hstsValue;
    }

    // Content Security Policy
    if (this.config.csp) {
      const cspValue = this.generateCspHeader();
      if (this.config.csp.reportOnly) {
        headers['Content-Security-Policy-Report-Only'] = cspValue;
      } else {
        headers[SecurityHeaderType.CSP] = cspValue;
      }
    }

    // X-Frame-Options
    if (this.config.xFrameOptions.enabled) {
      headers[SecurityHeaderType.X_FRAME_OPTIONS] = this.config.xFrameOptions.value;
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions.enabled) {
      headers[SecurityHeaderType.X_CONTENT_TYPE_OPTIONS] = 'nosniff';
    }

    // X-XSS-Protection
    if (this.config.xXssProtection.enabled) {
      headers[SecurityHeaderType.X_XSS_PROTECTION] = this.config.xXssProtection.mode;
    }

    // Referrer Policy
    if (this.config.referrerPolicy.enabled) {
      headers[SecurityHeaderType.REFERRER_POLICY] = this.config.referrerPolicy.value;
    }

    // Permissions Policy
    if (this.config.permissionsPolicy.enabled) {
      const permissionsValue = this.generatePermissionsPolicyHeader();
      headers[SecurityHeaderType.PERMISSIONS_POLICY] = permissionsValue;
    }

    // Cross-Origin Policies
    headers[SecurityHeaderType.CROSS_ORIGIN_EMBEDDER_POLICY] = this.config.crossOriginPolicies.embedderPolicy;
    headers[SecurityHeaderType.CROSS_ORIGIN_OPENER_POLICY] = this.config.crossOriginPolicies.openerPolicy;
    headers[SecurityHeaderType.CROSS_ORIGIN_RESOURCE_POLICY] = this.config.crossOriginPolicies.resourcePolicy;

    // Add custom headers
    for (const [key, value] of this.customHeaders.entries()) {
      headers[key] = value;
    }

    return headers;
  }

  /**
   * Generate CORS headers for a request
   */
  generateCorsHeaders(request: {
    origin?: string;
    method?: string;
    headers?: string[];
  }): Record<string, string> {
    const corsHeaders: Record<string, string> = {};

    // Check if origin is allowed
    const origin = request.origin;
    if (origin && this.isOriginAllowed(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
    } else if (this.corsConfig.allowAllOrigins) {
      corsHeaders['Access-Control-Allow-Origin'] = '*';
    }

    // Allow credentials (only if not using wildcard origin)
    if (this.corsConfig.credentials && corsHeaders['Access-Control-Allow-Origin'] !== '*') {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      corsHeaders['Access-Control-Allow-Methods'] = this.corsConfig.methods.join(', ');
      corsHeaders['Access-Control-Allow-Headers'] = this.corsConfig.headers.join(', ');
      corsHeaders['Access-Control-Max-Age'] = this.corsConfig.maxAge.toString();
    }

    // Exposed headers
    if (this.corsConfig.exposedHeaders.length > 0) {
      corsHeaders['Access-Control-Expose-Headers'] = this.corsConfig.exposedHeaders.join(', ');
    }

    return corsHeaders;
  }

  /**
   * Validate security headers
   */
  validateHeaders(headers: Record<string, string>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required security headers
    const requiredHeaders = [
      SecurityHeaderType.X_CONTENT_TYPE_OPTIONS,
      SecurityHeaderType.X_FRAME_OPTIONS
    ];

    for (const header of requiredHeaders) {
      if (!headers[header]) {
        errors.push(`Missing required security header: ${header}`);
      }
    }

    // Validate HSTS
    if (headers[SecurityHeaderType.HSTS]) {
      const hstsValue = headers[SecurityHeaderType.HSTS];
      if (!hstsValue.includes('max-age=')) {
        errors.push('HSTS header missing max-age directive');
      }
    }

    // Validate CSP
    if (headers[SecurityHeaderType.CSP]) {
      const cspValue = headers[SecurityHeaderType.CSP];
      if (!cspValue.includes("default-src")) {
        warnings.push('CSP header missing default-src directive');
      }
    }

    // Check for dangerous headers
    if (headers['Server']) {
      warnings.push('Server header should be removed or minimized for security');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add custom security header
   */
  addCustomHeader(name: string, value: string): void {
    this.customHeaders.set(name, value);
    this.emit('header:added', { name, value });
  }

  /**
   * Remove custom security header
   */
  removeCustomHeader(name: string): void {
    this.customHeaders.delete(name);
    this.emit('header:removed', { name });
  }

  /**
   * Update CORS configuration
   */
  updateCorsConfig(config: Partial<CorsConfig>): void {
    this.corsConfig = { ...this.corsConfig, ...config };
    this.emit('cors:updated', this.corsConfig);
  }

  /**
   * Update security headers configuration
   */
  updateSecurityConfig(config: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('security:updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): { security: SecurityHeadersConfig; cors: CorsConfig } {
    return {
      security: { ...this.config },
      cors: { ...this.corsConfig }
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateCspHeader(): string {
    const directives: string[] = [];

    // Default source
    if (this.config.csp.defaultSrc.length > 0) {
      directives.push(`default-src ${this.config.csp.defaultSrc.join(' ')}`);
    }

    // Script source
    if (this.config.csp.scriptSrc.length > 0) {
      directives.push(`script-src ${this.config.csp.scriptSrc.join(' ')}`);
    }

    // Style source
    if (this.config.csp.styleSrc.length > 0) {
      directives.push(`style-src ${this.config.csp.styleSrc.join(' ')}`);
    }

    // Image source
    if (this.config.csp.imgSrc.length > 0) {
      directives.push(`img-src ${this.config.csp.imgSrc.join(' ')}`);
    }

    // Font source
    if (this.config.csp.fontSrc.length > 0) {
      directives.push(`font-src ${this.config.csp.fontSrc.join(' ')}`);
    }

    // Connect source
    if (this.config.csp.connectSrc.length > 0) {
      directives.push(`connect-src ${this.config.csp.connectSrc.join(' ')}`);
    }

    // Media source
    if (this.config.csp.mediaSrc.length > 0) {
      directives.push(`media-src ${this.config.csp.mediaSrc.join(' ')}`);
    }

    // Object source
    if (this.config.csp.objectSrc.length > 0) {
      directives.push(`object-src ${this.config.csp.objectSrc.join(' ')}`);
    }

    // Child source
    if (this.config.csp.childSrc.length > 0) {
      directives.push(`child-src ${this.config.csp.childSrc.join(' ')}`);
    }

    // Frame source
    if (this.config.csp.frameSrc.length > 0) {
      directives.push(`frame-src ${this.config.csp.frameSrc.join(' ')}`);
    }

    // Worker source
    if (this.config.csp.workerSrc.length > 0) {
      directives.push(`worker-src ${this.config.csp.workerSrc.join(' ')}`);
    }

    // Manifest source
    if (this.config.csp.manifestSrc.length > 0) {
      directives.push(`manifest-src ${this.config.csp.manifestSrc.join(' ')}`);
    }

    // Form action
    if (this.config.csp.formAction.length > 0) {
      directives.push(`form-action ${this.config.csp.formAction.join(' ')}`);
    }

    // Frame ancestors
    if (this.config.csp.frameAncestors.length > 0) {
      directives.push(`frame-ancestors ${this.config.csp.frameAncestors.join(' ')}`);
    }

    // Base URI
    if (this.config.csp.baseUri.length > 0) {
      directives.push(`base-uri ${this.config.csp.baseUri.join(' ')}`);
    }

    // Upgrade insecure requests
    if (this.config.csp.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }

    // Block all mixed content
    if (this.config.csp.blockAllMixedContent) {
      directives.push('block-all-mixed-content');
    }

    // Report URI
    if (this.config.csp.reportUri) {
      directives.push(`report-uri ${this.config.csp.reportUri}`);
    }

    return directives.join('; ');
  }

  private generatePermissionsPolicyHeader(): string {
    const features: string[] = [];

    for (const [feature, allowlist] of Object.entries(this.config.permissionsPolicy.features)) {
      if (allowlist.length === 0) {
        features.push(`${feature}=()`);
      } else {
        features.push(`${feature}=(${allowlist.join(' ')})`);
      }
    }

    return features.join(', ');
  }

  private isOriginAllowed(origin: string): boolean {
    // Check against configured origins
    if (this.corsConfig.origins.includes(origin)) {
      return true;
    }

    // Check with custom validator
    if (this.corsConfig.originValidator) {
      return this.corsConfig.originValidator(origin);
    }

    return false;
  }
}

/**
 * Default security headers manager instance
 */
export const defaultSecurityHeadersManager = new SecurityHeadersManager();

/**
 * Factory function for creating security headers managers
 */
export function createSecurityHeadersManager(
  securityConfig?: Partial<SecurityHeadersConfig>,
  corsConfig?: Partial<CorsConfig>
): SecurityHeadersManager {
  return new SecurityHeadersManager(securityConfig, corsConfig);
}
