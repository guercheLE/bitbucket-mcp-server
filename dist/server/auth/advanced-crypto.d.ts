/**
 * Advanced Cryptographic Security for Bitbucket MCP Server
 *
 * This module provides enterprise-grade cryptographic security for token storage
 * and transmission, implementing industry best practices for data protection.
 *
 * Key Features:
 * - AES-256-GCM encryption with authenticated encryption
 * - PBKDF2 key derivation with configurable iterations
 * - Secure random number generation
 * - Token integrity verification
 * - Forward secrecy support
 * - Memory-safe operations
 *
 * Constitutional Requirements:
 * - Military-grade encryption standards
 * - Zero-knowledge architecture
 * - Memory protection
 * - Audit trail compliance
 * - Performance optimization
 */
/**
 * Cryptographic Configuration
 * Security parameters for encryption operations
 */
export interface CryptoConfig {
    /** Encryption algorithm */
    algorithm: 'aes-256-gcm' | 'aes-256-cbc';
    /** Key derivation function */
    kdf: 'pbkdf2' | 'scrypt';
    /** PBKDF2 iterations (minimum 100,000 for security) */
    pbkdf2Iterations: number;
    /** Scrypt parameters */
    scryptParams: {
        N: number;
        r: number;
        p: number;
    };
    /** Salt length in bytes */
    saltLength: number;
    /** IV length in bytes */
    ivLength: number;
    /** Tag length in bytes (for GCM mode) */
    tagLength: number;
    /** Key length in bytes */
    keyLength: number;
    /** Maximum key age in milliseconds */
    maxKeyAge: number;
    /** Enable memory protection */
    memoryProtection: boolean;
    /** Enable forward secrecy */
    forwardSecrecy: boolean;
}
/**
 * Encrypted Data Structure
 * Container for encrypted data with metadata
 */
export interface EncryptedData {
    /** Encrypted payload */
    readonly data: string;
    /** Initialization vector */
    readonly iv: string;
    /** Authentication tag (for GCM mode) */
    readonly tag?: string;
    /** Salt used for key derivation */
    readonly salt: string;
    /** Key derivation parameters */
    readonly kdfParams: {
        type: string;
        iterations?: number;
        scryptParams?: any;
    };
    /** Encryption timestamp */
    readonly timestamp: number;
    /** Data integrity hash */
    readonly integrity: string;
    /** Encryption version */
    readonly version: string;
}
/**
 * Key Management Interface
 * Manages encryption keys with rotation and security
 */
export interface KeyManager {
    /** Generate a new encryption key */
    generateKey(): Promise<Buffer>;
    /** Derive key from password */
    deriveKey(password: string, salt: Buffer): Promise<Buffer>;
    /** Rotate encryption key */
    rotateKey(): Promise<Buffer>;
    /** Get current active key */
    getCurrentKey(): Promise<Buffer>;
    /** Validate key integrity */
    validateKey(key: Buffer): Promise<boolean>;
    /** Secure key destruction */
    destroyKey(key: Buffer): void;
}
/**
 * Advanced Cryptographic Service
 * Enterprise-grade encryption and security operations
 */
export declare class AdvancedCryptoService {
    private config;
    private keyManager;
    private currentKey;
    private keyRotationTimer;
    constructor(config?: Partial<CryptoConfig>);
    /**
     * Encrypt sensitive data with advanced security
     */
    encrypt(data: string, password?: string): Promise<EncryptedData>;
    /**
     * Decrypt data with integrity verification
     */
    decrypt(encryptedData: EncryptedData, password?: string): Promise<string>;
    /**
     * Encrypt token with additional security measures
     */
    encryptToken(token: any): Promise<EncryptedData>;
    /**
     * Decrypt token with validation
     */
    decryptToken<T = any>(encryptedData: EncryptedData): Promise<T>;
    /**
     * Generate secure random token
     */
    generateSecureToken(length?: number): string;
    /**
     * Generate cryptographically secure password
     */
    generateSecurePassword(length?: number): string;
    /**
     * Hash data with salt for integrity verification
     */
    hashData(data: string, salt: Buffer): string;
    /**
     * Create HMAC for data authentication
     */
    createHmac(data: string, key: Buffer): string;
    /**
     * Verify HMAC for data authentication
     */
    verifyHmac(data: string, key: Buffer, expectedHmac: string): boolean;
    /**
     * Secure memory cleanup
     */
    private secureMemoryCleanup;
    /**
     * Create cipher for encryption
     */
    private createCipher;
    /**
     * Create decipher for decryption
     */
    private createDecipher;
    /**
     * Calculate data integrity hash
     */
    private calculateIntegrity;
    /**
     * Validate encrypted data structure
     */
    private validateEncryptedData;
    /**
     * Initialize automatic key rotation
     */
    private initializeKeyRotation;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Default crypto service instance
 */
export declare const defaultCryptoService: AdvancedCryptoService;
/**
 * Factory function for creating crypto services
 */
export declare function createCryptoService(config?: Partial<CryptoConfig>): AdvancedCryptoService;
//# sourceMappingURL=advanced-crypto.d.ts.map