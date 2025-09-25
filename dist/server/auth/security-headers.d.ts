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
export declare enum SecurityHeaderType {
    HSTS = "Strict-Transport-Security",
    CSP = "Content-Security-Policy",
    X_FRAME_OPTIONS = "X-Frame-Options",
    X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options",
    X_XSS_PROTECTION = "X-XSS-Protection",
    REFERRER_POLICY = "Referrer-Policy",
    PERMISSIONS_POLICY = "Permissions-Policy",
    CROSS_ORIGIN_EMBEDDER_POLICY = "Cross-Origin-Embedder-Policy",
    CROSS_ORIGIN_OPENER_POLICY = "Cross-Origin-Opener-Policy",
    CROSS_ORIGIN_RESOURCE_POLICY = "Cross-Origin-Resource-Policy"
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
export declare class SecurityHeadersManager extends EventEmitter {
    private config;
    private corsConfig;
    private customHeaders;
    constructor(securityConfig?: Partial<SecurityHeadersConfig>, corsConfig?: Partial<CorsConfig>);
    /**
     * Generate security headers for a request
     */
    generateSecurityHeaders(request?: {
        origin?: string;
        userAgent?: string;
        isHttps?: boolean;
    }): Record<string, string>;
    /**
     * Generate CORS headers for a request
     */
    generateCorsHeaders(request: {
        origin?: string;
        method?: string;
        headers?: string[];
    }): Record<string, string>;
    /**
     * Validate security headers
     */
    validateHeaders(headers: Record<string, string>): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Add custom security header
     */
    addCustomHeader(name: string, value: string): void;
    /**
     * Remove custom security header
     */
    removeCustomHeader(name: string): void;
    /**
     * Update CORS configuration
     */
    updateCorsConfig(config: Partial<CorsConfig>): void;
    /**
     * Update security headers configuration
     */
    updateSecurityConfig(config: Partial<SecurityHeadersConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): {
        security: SecurityHeadersConfig;
        cors: CorsConfig;
    };
    private generateCspHeader;
    private generatePermissionsPolicyHeader;
    private isOriginAllowed;
}
/**
 * Default security headers manager instance
 */
export declare const defaultSecurityHeadersManager: SecurityHeadersManager;
/**
 * Factory function for creating security headers managers
 */
export declare function createSecurityHeadersManager(securityConfig?: Partial<SecurityHeadersConfig>, corsConfig?: Partial<CorsConfig>): SecurityHeadersManager;
//# sourceMappingURL=security-headers.d.ts.map