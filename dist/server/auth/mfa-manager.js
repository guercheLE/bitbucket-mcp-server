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
import crypto from 'crypto';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
/**
 * Multi-Factor Authentication Manager
 */
export class MFAManager {
    issuer;
    algorithm;
    digits;
    period;
    window;
    constructor(options = {}) {
        this.issuer = options.issuer || 'Bitbucket MCP Server';
        this.algorithm = options.algorithm || 'sha1';
        this.digits = options.digits || 6;
        this.period = options.period || 30;
        this.window = options.window || 1; // Allow 1 time step in either direction
    }
    /**
     * Generate MFA secret and setup information for a user
     */
    async generateSecret(userLabel, issuer) {
        try {
            // Generate secret
            const secret = speakeasy.generateSecret({
                name: userLabel,
                issuer: issuer || this.issuer,
                length: 32
            });
            if (!secret.base32) {
                throw new Error('Failed to generate secret');
            }
            // Generate QR code
            const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            return {
                secret: secret.base32,
                qrCodeDataUrl,
                manualEntryKey: secret.base32,
                backupCodes
            };
        }
        catch (error) {
            throw new Error(`Failed to generate MFA secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Verify TOTP token
     */
    verifyToken(token, secret, lastUsed) {
        try {
            // Clean token (remove spaces, hyphens)
            const cleanToken = token.replace(/[\s-]/g, '');
            // Validate token format
            if (!/^\d{6}$/.test(cleanToken)) {
                return {
                    valid: false,
                    error: 'Invalid token format. Token must be 6 digits.'
                };
            }
            // Verify with speakeasy
            const verified = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: cleanToken,
                window: this.window,
                step: this.period
            });
            if (!verified) {
                return {
                    valid: false,
                    error: 'Invalid token or token has expired.'
                };
            }
            // Check for replay attack (if lastUsed is provided)
            if (lastUsed) {
                const tokenTime = this.getTokenTime(cleanToken, secret);
                if (tokenTime && tokenTime <= lastUsed) {
                    return {
                        valid: false,
                        error: 'Token has already been used.'
                    };
                }
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Verify backup code
     */
    verifyBackupCode(code, backupCodes) {
        try {
            const cleanCode = code.trim().toLowerCase();
            if (backupCodes.includes(cleanCode)) {
                return {
                    valid: true,
                    usedBackupCode: true
                };
            }
            return {
                valid: false,
                error: 'Invalid backup code.'
            };
        }
        catch (error) {
            return {
                valid: false,
                error: `Backup code verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Generate backup recovery codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric codes
            const code = crypto.randomBytes(4).toString('hex').toLowerCase();
            codes.push(code);
        }
        return codes;
    }
    /**
     * Get the time step for a token (for replay protection)
     */
    getTokenTime(token, secret) {
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeStep = Math.floor(currentTime / this.period);
            // Check current and adjacent time steps
            for (let i = -this.window; i <= this.window; i++) {
                const testTimeStep = timeStep + i;
                const testToken = speakeasy.totp({
                    secret,
                    encoding: 'base32',
                    time: testTimeStep * this.period
                });
                if (testToken === token) {
                    return new Date(testTimeStep * this.period * 1000);
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Validate MFA configuration
     */
    validateConfiguration(config) {
        const errors = [];
        if (config.enabled && !config.secret) {
            errors.push('Secret is required when MFA is enabled');
        }
        if (config.secret && config.secret.length < 16) {
            errors.push('Secret must be at least 16 characters long');
        }
        if (config.backupCodes && config.backupCodes.length < 5) {
            errors.push('At least 5 backup codes are required');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Generate new backup codes (for regeneration)
     */
    regenerateBackupCodes() {
        return this.generateBackupCodes();
    }
    /**
     * Remove used backup code from array
     */
    removeUsedBackupCode(code, backupCodes) {
        const cleanCode = code.trim().toLowerCase();
        return backupCodes.filter(backupCode => backupCode !== cleanCode);
    }
}
export default MFAManager;
//# sourceMappingURL=mfa-manager.js.map