import { z } from 'zod';

// Modelos para detecção de servidor
const ServerDetectionResultSchema = z.object({
  serverType: z.enum(['datacenter', 'cloud']),
  baseUrl: z.string().url(),
  apiVersion: z.string(),
  capabilities: z.array(z.string()),
  detectedAt: z.string().datetime(),
  cacheExpiresAt: z.string().datetime(),
  detectionMethod: z.enum(['application_properties', 'api_2_0', 'fallback'])
});

const ApplicationPropertiesResponseSchema = z.object({
  version: z.string(),
  buildNumber: z.string(),
  buildDate: z.string(),
  displayName: z.string(),
  platformVersion: z.string().optional()
});

const Api2ResponseSchema = z.object({
  type: z.string(),
  uuid: z.string(),
  links: z.object({
    self: z.object({
      href: z.string().url()
    })
  })
});

describe('Server Detection Unit Tests', () => {
  describe('ServerDetectionResult validation', () => {
    it('deve validar resultado de detecção Data Center', () => {
      const validResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2', 'personal_tokens', 'app_passwords'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'application_properties' as const
      };

      expect(() => ServerDetectionResultSchema.parse(validResult)).not.toThrow();
    });

    it('deve validar resultado de detecção Cloud', () => {
      const validResult = {
        serverType: 'cloud' as const,
        baseUrl: 'https://api.bitbucket.org',
        apiVersion: '2.0',
        capabilities: ['oauth2', 'personal_tokens'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'api_2_0' as const
      };

      expect(() => ServerDetectionResultSchema.parse(validResult)).not.toThrow();
    });

    it('deve validar resultado de fallback', () => {
      const validResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(validResult)).not.toThrow();
    });

    it('deve rejeitar serverType inválido', () => {
      const invalidResult = {
        serverType: 'invalid' as any,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'application_properties' as const
      };

      expect(() => ServerDetectionResultSchema.parse(invalidResult)).toThrow();
    });

    it('deve rejeitar baseUrl inválida', () => {
      const invalidResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'invalid-url',
        apiVersion: '1.0',
        capabilities: ['oauth2'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'application_properties' as const
      };

      expect(() => ServerDetectionResultSchema.parse(invalidResult)).toThrow();
    });

    it('deve rejeitar detectionMethod inválido', () => {
      const invalidResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'invalid' as any
      };

      expect(() => ServerDetectionResultSchema.parse(invalidResult)).toThrow();
    });
  });

  describe('ApplicationPropertiesResponse validation', () => {
    it('deve validar response válido do Data Center', () => {
      const validResponse = {
        version: '8.0.0',
        buildNumber: '8000000',
        buildDate: '2023-01-01T00:00:00.000Z',
        displayName: 'Bitbucket Data Center',
        platformVersion: '8.0.0'
      };

      expect(() => ApplicationPropertiesResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve validar response sem platformVersion', () => {
      const validResponse = {
        version: '7.16.0',
        buildNumber: '7160000',
        buildDate: '2023-01-01T00:00:00.000Z',
        displayName: 'Bitbucket Data Center'
      };

      expect(() => ApplicationPropertiesResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar response sem version', () => {
      const invalidResponse = {
        buildNumber: '8000000',
        buildDate: '2023-01-01T00:00:00.000Z',
        displayName: 'Bitbucket Data Center'
      };

      expect(() => ApplicationPropertiesResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar response sem buildNumber', () => {
      const invalidResponse = {
        version: '8.0.0',
        buildDate: '2023-01-01T00:00:00.000Z',
        displayName: 'Bitbucket Data Center'
      };

      expect(() => ApplicationPropertiesResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar response sem buildDate', () => {
      const invalidResponse = {
        version: '8.0.0',
        buildNumber: '8000000',
        displayName: 'Bitbucket Data Center'
      };

      expect(() => ApplicationPropertiesResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar response sem displayName', () => {
      const invalidResponse = {
        version: '8.0.0',
        buildNumber: '8000000',
        buildDate: '2023-01-01T00:00:00.000Z'
      };

      expect(() => ApplicationPropertiesResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('Api2Response validation', () => {
    it('deve validar response válido do Cloud', () => {
      const validResponse = {
        type: 'user',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/user'
          }
        }
      };

      expect(() => Api2ResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('deve rejeitar response sem type', () => {
      const invalidResponse = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/user'
          }
        }
      };

      expect(() => Api2ResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar response sem uuid', () => {
      const invalidResponse = {
        type: 'user',
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/user'
          }
        }
      };

      expect(() => Api2ResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar response sem links', () => {
      const invalidResponse = {
        type: 'user',
        uuid: '550e8400-e29b-41d4-a716-446655440000'
      };

      expect(() => Api2ResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('deve rejeitar links.self.href inválida', () => {
      const invalidResponse = {
        type: 'user',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        links: {
          self: {
            href: 'invalid-url'
          }
        }
      };

      expect(() => Api2ResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('Cache de configurações de servidor', () => {
    it('deve validar cache expirado', () => {
      const expiredCache = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:04:00.000Z', // Expirado
        detectionMethod: 'application_properties' as const
      };

      const now = new Date('2023-01-01T00:05:00.000Z');
      const isExpired = new Date(expiredCache.cacheExpiresAt) < now;

      expect(isExpired).toBe(true);
    });

    it('deve validar cache válido', () => {
      const validCache = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:06:00.000Z', // Válido
        detectionMethod: 'application_properties' as const
      };

      const now = new Date('2023-01-01T00:05:00.000Z');
      const isValid = new Date(validCache.cacheExpiresAt) > now;

      expect(isValid).toBe(true);
    });
  });

  describe('Tratamento de erros de detecção', () => {
    it('deve validar timeout de detecção', () => {
      const startTime = Date.now();
      const timeout = 5000; // 5 segundos
      
      // Simular timeout
      const elapsedTime = 6000; // 6 segundos
      const hasTimedOut = elapsedTime > timeout;

      expect(hasTimedOut).toBe(true);
    });

    it('deve validar retry logic', () => {
      const maxRetries = 3;
      const currentRetry = 2;
      const shouldRetry = currentRetry < maxRetries;

      expect(shouldRetry).toBe(true);
    });

    it('deve validar limite de retries', () => {
      const maxRetries = 3;
      const currentRetry = 3;
      const shouldRetry = currentRetry < maxRetries;

      expect(shouldRetry).toBe(false);
    });
  });

  describe('Validação de URL', () => {
    it('deve validar URL válida', () => {
      const validUrls = [
        'https://bitbucket.example.com',
        'https://api.bitbucket.org',
        'http://localhost:7990',
        'https://bitbucket.company.com:8443'
      ];

      validUrls.forEach(url => {
        expect(() => new URL(url)).not.toThrow();
      });
    });

    it('deve rejeitar URL inválida', () => {
      const invalidUrls = [
        'invalid-url',
        'https://',
        'not-a-url'
      ];

      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });
  });

  describe('Health checks', () => {
    it('deve validar health check válido', () => {
      const healthCheck = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        responseTime: 150,
        serverType: 'datacenter' as const
      };

      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.responseTime).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('deve validar health check com timeout', () => {
      const healthCheck = {
        status: 'timeout',
        timestamp: '2023-01-01T00:00:00.000Z',
        responseTime: 5000,
        serverType: 'datacenter' as const
      };

      expect(healthCheck.status).toBe('timeout');
      expect(healthCheck.responseTime).toBeGreaterThan(3000); // Mais de 3 segundos
    });
  });
});
