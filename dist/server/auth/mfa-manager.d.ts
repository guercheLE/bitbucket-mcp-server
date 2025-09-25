/**
 * Multi-Factor Authentication Manager
 *
 * Handles TOTP-based multi-factor authentication including secret generation,
 * QR code creation, and token verification for enhanced security.
 *
 * Features:
 * - TOTP secret generation
 * - QR code generation for authenticator apps
 * - Token verification with time window
 * - Backup code generation and validation
 */
/**
 * MFA Provider Configuration
 */
export interface MFAConfiguration {
    /** MFA provider type */
    type: 'totp' | 'sms' | 'email' | 'hardware';
    /** Whether MFA is enabled */
    enabled: boolean;
    /** Secret key for TOTP */
    secret?: string;
    /** Backup recovery codes */
    backupCodes?: string[];
    /** Last used timestamp to prevent replay */
    lastUsed?: Date;
}
/**
 * MFA Setup Result
 */
export interface MFASetupResult {
    /** Base32 encoded secret */
    secret: string;
    /** QR code as data URL */
    qrCodeDataUrl: string;
    /** Manual entry key for users who can't scan QR */
    manualEntryKey: string;
    /** Backup recovery codes */
    backupCodes: string[];
}
/**
 * MFA Verification Result
 */
export interface MFAVerificationResult {
    /** Whether verification was successful */
    valid: boolean;
    /** Error message if verification failed */
    error?: string;
    /** Whether a backup code was used */
    usedBackupCode?: boolean;
}
/**
 * Multi-Factor Authentication Manager
 */
export declare class MFAManager {
    private readonly issuer;
    private readonly algorithm;
    private readonly digits;
    private readonly period;
    private readonly window;
    constructor(options?: {
        issuer?: string;
        algorithm?: string;
        digits?: number;
        period?: number;
        window?: number;
    });
    /**
     * Generate MFA secret and setup information for a user
     */
    generateSecret(userLabel: string, issuer?: string): Promise<MFASetupResult>;
    /**
     * Verify TOTP token
     */
    verifyToken(token: string, secret: string, lastUsed?: Date): MFAVerificationResult;
    /**
     * Verify backup code
     */
    verifyBackupCode(code: string, backupCodes: string[]): MFAVerificationResult;
    /**
     * Generate backup recovery codes
     */
    private generateBackupCodes;
    /**
     * Get the time step for a token (for replay protection)
     */
    private getTokenTime;
    /**
     * Validate MFA configuration
     */
    validateConfiguration(config: MFAConfiguration): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Generate new backup codes (for regeneration)
     */
    regenerateBackupCodes(): string[];
    /**
     * Remove used backup code from array
     */
    removeUsedBackupCode(code: string, backupCodes: string[]): string[];
}
export default MFAManager;
//# sourceMappingURL=mfa-manager.d.ts.map