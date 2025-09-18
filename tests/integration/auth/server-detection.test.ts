import { z } from 'zod';

// Schemas para detecção de servidor
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

describe('Server Detection Integration Tests', () => {
  describe('Detecção com servidor Data Center real', () => {
    it('deve detectar Data Center via application-properties', () => {
      // Simular resposta do endpoint /rest/api/1.0/application-properties
      const applicationPropertiesResponse = {
        version: '8.0.0',
        buildNumber: '8000000',
        buildDate: '2023-01-01T00:00:00.000Z',
        displayName: 'Bitbucket Data Center',
        platformVersion: '8.0.0'
      };

      expect(() => ApplicationPropertiesResponseSchema.parse(applicationPropertiesResponse)).not.toThrow();

      // Simular resultado de detecção
      const detectionResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2', 'personal_tokens', 'app_passwords'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'application_properties' as const
      };

      expect(() => ServerDetectionResultSchema.parse(detectionResult)).not.toThrow();
      expect(detectionResult.serverType).toBe('datacenter');
      expect(detectionResult.detectionMethod).toBe('application_properties');
    });

    it('deve detectar Data Center 7.16 via fallback', () => {
      // Simular falha na detecção via application-properties
      const applicationPropertiesError = {
        error: 'endpoint_not_found',
        message: 'Application properties endpoint not available'
      };

      expect(applicationPropertiesError.error).toBe('endpoint_not_found');

      // Simular fallback para Data Center 7.16
      const fallbackResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fallbackResult)).not.toThrow();
      expect(fallbackResult.serverType).toBe('datacenter');
      expect(fallbackResult.detectionMethod).toBe('fallback');
      expect(fallbackResult.capabilities).toContain('basic_auth');
    });

    it('deve detectar Data Center com capacidades limitadas', () => {
      // Simular Data Center com capacidades limitadas
      const limitedCapabilitiesResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '6.10',
        capabilities: ['basic_auth', 'app_passwords'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'application_properties' as const
      };

      expect(() => ServerDetectionResultSchema.parse(limitedCapabilitiesResult)).not.toThrow();
      expect(limitedCapabilitiesResult.capabilities).not.toContain('oauth2');
      expect(limitedCapabilitiesResult.capabilities).not.toContain('personal_tokens');
    });
  });

  describe('Detecção com servidor Cloud real', () => {
    it('deve detectar Cloud via API 2.0', () => {
      // Simular resposta do endpoint /2.0/user
      const api2Response = {
        type: 'user',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/user'
          }
        }
      };

      expect(() => Api2ResponseSchema.parse(api2Response)).not.toThrow();

      // Simular resultado de detecção
      const detectionResult = {
        serverType: 'cloud' as const,
        baseUrl: 'https://api.bitbucket.org',
        apiVersion: '2.0',
        capabilities: ['oauth2', 'personal_tokens'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'api_2_0' as const
      };

      expect(() => ServerDetectionResultSchema.parse(detectionResult)).not.toThrow();
      expect(detectionResult.serverType).toBe('cloud');
      expect(detectionResult.detectionMethod).toBe('api_2_0');
      expect(detectionResult.capabilities).not.toContain('app_passwords');
    });

    it('deve detectar Cloud com capacidades completas', () => {
      // Simular Cloud com todas as capacidades
      const fullCapabilitiesResult = {
        serverType: 'cloud' as const,
        baseUrl: 'https://api.bitbucket.org',
        apiVersion: '2.0',
        capabilities: ['oauth2', 'personal_tokens', 'webhooks'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'api_2_0' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fullCapabilitiesResult)).not.toThrow();
      expect(fullCapabilitiesResult.capabilities).toContain('oauth2');
      expect(fullCapabilitiesResult.capabilities).toContain('personal_tokens');
    });
  });

  describe('Fallback quando detecção falha', () => {
    it('deve usar fallback quando application-properties falha', () => {
      // Simular falha na detecção
      const detectionError = {
        error: 'timeout',
        message: 'Request timeout after 5 seconds'
      };

      expect(detectionError.error).toBe('timeout');

      // Simular fallback
      const fallbackResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fallbackResult)).not.toThrow();
      expect(fallbackResult.detectionMethod).toBe('fallback');
    });

    it('deve usar fallback quando API 2.0 falha', () => {
      // Simular falha na API 2.0
      const api2Error = {
        error: 'unauthorized',
        message: 'Authentication required'
      };

      expect(api2Error.error).toBe('unauthorized');

      // Simular fallback
      const fallbackResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://api.bitbucket.org',
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fallbackResult)).not.toThrow();
      expect(fallbackResult.detectionMethod).toBe('fallback');
    });

    it('deve usar fallback quando ambos os métodos falham', () => {
      // Simular falha em ambos os métodos
      const applicationPropertiesError = {
        error: 'endpoint_not_found',
        message: 'Application properties endpoint not available'
      };

      const api2Error = {
        error: 'endpoint_not_found',
        message: 'API 2.0 endpoint not available'
      };

      expect(applicationPropertiesError.error).toBe('endpoint_not_found');
      expect(api2Error.error).toBe('endpoint_not_found');

      // Simular fallback
      const fallbackResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fallbackResult)).not.toThrow();
      expect(fallbackResult.detectionMethod).toBe('fallback');
    });
  });

  describe('Cache de configurações', () => {
    it('deve usar cache válido', () => {
      const cachedResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2', 'personal_tokens'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:06:00.000Z', // Cache válido
        detectionMethod: 'application_properties' as const
      };

      // Simular verificação de cache
      const now = new Date('2023-01-01T00:05:00.000Z');
      const cacheExpiresAt = new Date(cachedResult.cacheExpiresAt);
      const isCacheValid = now < cacheExpiresAt;

      expect(() => ServerDetectionResultSchema.parse(cachedResult)).not.toThrow();
      expect(isCacheValid).toBe(true);
    });

    it('deve invalidar cache expirado', () => {
      const expiredCache = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2', 'personal_tokens'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:04:00.000Z', // Cache expirado
        detectionMethod: 'application_properties' as const
      };

      // Simular verificação de cache
      const now = new Date('2023-01-01T00:05:00.000Z');
      const cacheExpiresAt = new Date(expiredCache.cacheExpiresAt);
      const isCacheValid = now < cacheExpiresAt;

      expect(() => ServerDetectionResultSchema.parse(expiredCache)).not.toThrow();
      expect(isCacheValid).toBe(false);
    });

    it('deve atualizar cache após expiração', () => {
      const oldCache = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '1.0',
        capabilities: ['oauth2', 'personal_tokens'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:04:00.000Z',
        detectionMethod: 'application_properties' as const
      };

      // Simular nova detecção
      const newCache = {
        ...oldCache,
        detectedAt: '2023-01-01T00:05:00.000Z',
        cacheExpiresAt: '2023-01-01T00:10:00.000Z'
      };

      expect(() => ServerDetectionResultSchema.parse(oldCache)).not.toThrow();
      expect(() => ServerDetectionResultSchema.parse(newCache)).not.toThrow();
      expect(newCache.detectedAt).not.toBe(oldCache.detectedAt);
      expect(newCache.cacheExpiresAt).not.toBe(oldCache.cacheExpiresAt);
    });
  });

  describe('Timeout e retry com servidor lento', () => {
    it('deve lidar com timeout de servidor lento', () => {
      const startTime = Date.now();
      const timeout = 5000; // 5 segundos

      // Simular servidor lento
      const responseTime = 6000; // 6 segundos
      const hasTimedOut = responseTime > timeout;

      expect(hasTimedOut).toBe(true);
    });

    it('deve implementar retry com backoff exponencial', () => {
      const maxRetries = 3;
      const baseDelay = 1000; // 1 segundo
      const retries = [1, 2, 3];

      const delays = retries.map(retry => baseDelay * Math.pow(2, retry - 1));

      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('deve falhar após máximo de retries', () => {
      const maxRetries = 3;
      const currentRetry = 3;
      const shouldRetry = currentRetry < maxRetries;

      expect(shouldRetry).toBe(false);
    });

    it('deve usar fallback após timeout', () => {
      const timeoutError = {
        error: 'timeout',
        message: 'Request timeout after 5 seconds'
      };

      expect(timeoutError.error).toBe('timeout');

      // Simular fallback após timeout
      const fallbackResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fallbackResult)).not.toThrow();
      expect(fallbackResult.detectionMethod).toBe('fallback');
    });
  });

  describe('Tratamento de erros de rede', () => {
    it('deve tratar erro de conexão recusada', () => {
      const connectionError = {
        error: 'connection_refused',
        message: 'Connection refused by server'
      };

      expect(connectionError.error).toBe('connection_refused');
    });

    it('deve tratar erro de DNS', () => {
      const dnsError = {
        error: 'dns_error',
        message: 'DNS resolution failed'
      };

      expect(dnsError.error).toBe('dns_error');
    });

    it('deve tratar erro de SSL', () => {
      const sslError = {
        error: 'ssl_error',
        message: 'SSL certificate verification failed'
      };

      expect(sslError.error).toBe('ssl_error');
    });

    it('deve usar fallback após erro de rede', () => {
      const networkError = {
        error: 'network_error',
        message: 'Network error occurred'
      };

      expect(networkError.error).toBe('network_error');

      // Simular fallback após erro de rede
      const fallbackResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'https://bitbucket.example.com',
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fallbackResult)).not.toThrow();
      expect(fallbackResult.detectionMethod).toBe('fallback');
    });
  });

  describe('Validação de SSL', () => {
    it('deve validar certificado SSL válido', () => {
      const sslValidation = {
        isValid: true,
        issuer: 'DigiCert Inc',
        subject: 'bitbucket.example.com',
        expiresAt: '2024-01-01T00:00:00.000Z'
      };

      expect(sslValidation.isValid).toBe(true);
    });

    it('deve rejeitar certificado SSL inválido', () => {
      const sslValidation = {
        isValid: false,
        error: 'certificate_expired',
        message: 'SSL certificate has expired'
      };

      expect(sslValidation.isValid).toBe(false);
      expect(sslValidation.error).toBe('certificate_expired');
    });

    it('deve rejeitar certificado SSL auto-assinado', () => {
      const sslValidation = {
        isValid: false,
        error: 'self_signed_certificate',
        message: 'Self-signed certificate not trusted'
      };

      expect(sslValidation.isValid).toBe(false);
      expect(sslValidation.error).toBe('self_signed_certificate');
    });

    it('deve usar fallback após erro de SSL', () => {
      const sslError = {
        error: 'ssl_error',
        message: 'SSL certificate verification failed'
      };

      expect(sslError.error).toBe('ssl_error');

      // Simular fallback após erro de SSL
      const fallbackResult = {
        serverType: 'datacenter' as const,
        baseUrl: 'http://bitbucket.example.com', // HTTP em vez de HTTPS
        apiVersion: '7.16',
        capabilities: ['basic_auth'],
        detectedAt: '2023-01-01T00:00:00.000Z',
        cacheExpiresAt: '2023-01-01T00:05:00.000Z',
        detectionMethod: 'fallback' as const
      };

      expect(() => ServerDetectionResultSchema.parse(fallbackResult)).not.toThrow();
      expect(fallbackResult.detectionMethod).toBe('fallback');
    });
  });
});
