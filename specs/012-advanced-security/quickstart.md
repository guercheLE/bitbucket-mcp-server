# Advanced Security Quick Start Guide

## Prerequisites

- Completed Spec 002: Authentication System
- Completed Spec 011: Multi-workspace Support
- Node.js 18+, TypeScript 5.3+
- Redis for session management
- Database for audit logging

## Phase 1: Quick Setup (30 minutes)

### 1. Install Security Dependencies

```bash
npm install bcrypt jsonwebtoken speakeasy qrcode
npm install --save-dev @types/bcrypt @types/jsonwebtoken @types/speakeasy
```

### 2. Create MFA Manager

```typescript
// src/server/auth/mfa-manager.ts
import speakeasy from 'speakeasy';

export class MFAManager {
  generateSecret(userLabel: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: userLabel,
      issuer: 'Bitbucket MCP Server'
    });
    
    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url!
    };
  }

  verify(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1
    });
  }
}
```

### 3. Create Enhanced Session Manager

```typescript
// src/server/auth/enhanced-session.ts
export interface SecureSession {
  id: string;
  userId: string;
  mfaVerified: boolean;
  permissions: string[];
  expiresAt: Date;
}

export class EnhancedSessionManager {
  private sessions = new Map<string, SecureSession>();

  createSession(userId: string, permissions: string[]): SecureSession {
    const session: SecureSession = {
      id: crypto.randomUUID(),
      userId,
      mfaVerified: false,
      permissions,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    };
    
    this.sessions.set(session.id, session);
    return session;
  }

  validateSession(sessionId: string): SecureSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }
}
```

### 4. Create Basic Audit Logger

```typescript
// src/server/security/audit-logger.ts
export interface AuditEvent {
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  details?: any;
}

export class AuditLogger {
  private events: AuditEvent[] = [];

  log(event: Omit<AuditEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: new Date()
    });
    
    // In production: persist to database
    console.log('AUDIT:', event);
  }

  getEvents(userId?: string): AuditEvent[] {
    return userId 
      ? this.events.filter(e => e.userId === userId)
      : this.events;
  }
}
```

## Phase 2: Integration (45 minutes)

### 1. Update Authentication Middleware

```typescript
// src/server/auth/auth-middleware.ts
import { MFAManager } from './mfa-manager.js';
import { EnhancedSessionManager } from './enhanced-session.js';
import { AuditLogger } from '../security/audit-logger.js';

export class AuthMiddleware {
  constructor(
    private mfaManager: MFAManager,
    private sessionManager: EnhancedSessionManager,
    private auditLogger: AuditLogger
  ) {}

  async authenticateWithMFA(
    username: string, 
    password: string, 
    mfaToken?: string
  ): Promise<{ success: boolean; session?: SecureSession; requiresMFA?: boolean }> {
    
    // Basic auth check
    const user = await this.validateCredentials(username, password);
    if (!user) {
      this.auditLogger.log({
        userId: username,
        action: 'login',
        resource: 'authentication',
        result: 'failure',
        details: { reason: 'invalid_credentials' }
      });
      return { success: false };
    }

    // Check MFA requirement
    if (user.mfaEnabled && !mfaToken) {
      return { success: false, requiresMFA: true };
    }

    // Verify MFA if provided
    if (user.mfaEnabled && mfaToken) {
      const mfaValid = this.mfaManager.verify(mfaToken, user.mfaSecret);
      if (!mfaValid) {
        this.auditLogger.log({
          userId: user.id,
          action: 'mfa_verify',
          resource: 'authentication',
          result: 'failure'
        });
        return { success: false };
      }
    }

    // Create secure session
    const session = this.sessionManager.createSession(user.id, user.permissions);
    session.mfaVerified = user.mfaEnabled ? !!mfaToken : false;

    this.auditLogger.log({
      userId: user.id,
      action: 'login',
      resource: 'authentication',
      result: 'success',
      details: { mfaUsed: user.mfaEnabled }
    });

    return { success: true, session };
  }
}
```

### 2. Create Security Tool

```typescript
// src/server/tools/security_management.ts
import { Tool, ToolParameter, ToolResult } from '../../types/index.js';
import { MFAManager } from '../auth/mfa-manager.js';
import { AuditLogger } from '../security/audit-logger.js';

const securityParameters: ToolParameter[] = [
  {
    name: 'action',
    type: 'string',
    required: true,
    description: 'Security action: setup_mfa, view_audit, security_status',
    schema: { enum: ['setup_mfa', 'view_audit', 'security_status'] }
  }
];

const securityExecutor = async (params: any, context: any): Promise<ToolResult> => {
  const startTime = Date.now();
  const mfaManager = new MFAManager();
  const auditLogger = new AuditLogger();

  try {
    switch (params.action) {
      case 'setup_mfa':
        const mfaSetup = mfaManager.generateSecret(context.user.email);
        return {
          success: true,
          data: {
            secret: mfaSetup.secret,
            qrCode: mfaSetup.qrCode,
            instructions: 'Scan QR code with your authenticator app'
          },
          metadata: {
            executionTime: Date.now() - startTime,
            memoryUsed: process.memoryUsage().heapUsed,
            timestamp: new Date()
          }
        };

      case 'view_audit':
        const events = auditLogger.getEvents(context.user.id);
        return {
          success: true,
          data: { events: events.slice(-50) }, // Last 50 events
          metadata: {
            executionTime: Date.now() - startTime,
            memoryUsed: process.memoryUsage().heapUsed,
            timestamp: new Date()
          }
        };

      case 'security_status':
        return {
          success: true,
          data: {
            mfaEnabled: context.user.mfaEnabled || false,
            lastLogin: context.session.createdAt,
            sessionExpires: context.session.expiresAt,
            securityLevel: context.session.mfaVerified ? 'high' : 'basic'
          },
          metadata: {
            executionTime: Date.now() - startTime,
            memoryUsed: process.memoryUsage().heapUsed,
            timestamp: new Date()
          }
        };

      default:
        return {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Unknown security action'
          },
          metadata: {
            executionTime: Date.now() - startTime,
            memoryUsed: process.memoryUsage().heapUsed,
            timestamp: new Date()
          }
        };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      metadata: {
        executionTime: Date.now() - startTime,
        memoryUsed: process.memoryUsage().heapUsed,
        timestamp: new Date()
      }
    };
  }
};

export const securityTool: Tool = {
  name: 'security_management',
  description: 'Manage advanced security features including MFA and audit logs',
  parameters: securityParameters,
  executor: securityExecutor
};
```

## Phase 3: Testing (15 minutes)

### 1. Create Security Tests

```typescript
// tests/security/mfa.test.ts
import { MFAManager } from '../../src/server/auth/mfa-manager.js';

describe('MFA Manager', () => {
  const mfaManager = new MFAManager();

  test('should generate valid secret', () => {
    const result = mfaManager.generateSecret('test@example.com');
    expect(result.secret).toBeTruthy();
    expect(result.qrCode).toContain('otpauth://');
  });

  test('should verify valid token', () => {
    // Test with known secret and time-based token
    // Implementation depends on test framework
  });
});
```

### 2. Run Security Tests

```bash
npm test -- --testPathPattern=security
```

## Quick Verification

### 1. Check MFA Setup
```bash
curl -X POST http://localhost:3000/auth/mfa/setup \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### 2. Test Security Tool
```bash
# Via MCP client
{
  "method": "tools/call",
  "params": {
    "name": "security_management",
    "arguments": { "action": "security_status" }
  }
}
```

## Next Steps

1. **Phase 2**: Implement RBAC system
2. **Phase 3**: Add comprehensive audit logging
3. **Phase 4**: Implement encryption at rest
4. **Phase 5**: Add rate limiting and DoS protection

## Troubleshooting

### Common Issues

1. **MFA tokens not working**
   - Check system time synchronization
   - Verify secret encoding (base32)

2. **Session expiration**
   - Check Redis connection for session storage
   - Verify token expiration settings

3. **Audit logs missing**
   - Check database connection
   - Verify audit logger initialization

### Debug Commands

```bash
# Check security status
npm run debug:security

# View audit logs
npm run logs:audit

# Test MFA verification
npm run test:mfa
```

## Configuration

```yaml
# config/security.yml
security:
  mfa:
    enabled: true
    issuer: "Bitbucket MCP Server"
    window: 1
  
  sessions:
    maxAge: 86400000  # 24 hours
    requireMFA: false
  
  audit:
    enabled: true
    retention: 2592000000  # 30 days
```

This quickstart gets you running with basic advanced security features in under 90 minutes!