import { 
  ServerDetectionResult, 
  ServerConfiguration, 
  ApplicationPropertiesResponse, 
  Api2Response,
  ServerType,
  DetectionMethod,
  SERVER_CAPABILITIES,
  CACHE_DURATION,
  TIMEOUTS,
  RETRY_CONFIG
} from '../../types/auth';

/**
 * Serviço de detecção automática de servidor Bitbucket
 * Implementa detecção via application-properties, fallback para Data Center 7.16
 * e cache de configurações com timeout e retry logic
 */
export class ServerDetectionService {
  private cache = new Map<string, ServerConfiguration>();
  private healthCheckCache = new Map<string, { timestamp: number; isHealthy: boolean }>();

  /**
   * Detecta o tipo de servidor Bitbucket automaticamente
   * @param baseUrl URL base do servidor Bitbucket
   * @returns Resultado da detecção com tipo de servidor e capacidades
   */
  async detectServer(baseUrl: string): Promise<ServerDetectionResult> {
    // Validar URL
    this.validateUrl(baseUrl);

    // Verificar cache primeiro
    const cached = this.getCachedConfiguration(baseUrl);
    if (cached) {
      return this.convertToDetectionResult(cached);
    }

    // Tentar detecção via application-properties (Data Center)
    try {
      const result = await this.detectViaApplicationProperties(baseUrl);
      this.cacheConfiguration(baseUrl, result);
      return result;
    } catch (error) {
      console.warn(`Falha na detecção via application-properties: ${error}`);
    }

    // Tentar detecção via API 2.0 (Cloud)
    try {
      const result = await this.detectViaApi2(baseUrl);
      this.cacheConfiguration(baseUrl, result);
      return result;
    } catch (error) {
      console.warn(`Falha na detecção via API 2.0: ${error}`);
    }

    // Fallback para Data Center 7.16
    console.warn('Usando fallback para Data Center 7.16');
    const fallbackResult = this.createFallbackResult(baseUrl);
    this.cacheConfiguration(baseUrl, fallbackResult);
    return fallbackResult;
  }

  /**
   * Detecta servidor via endpoint application-properties (Data Center)
   */
  private async detectViaApplicationProperties(baseUrl: string): Promise<ServerDetectionResult> {
    const url = `${baseUrl}/rest/api/1.0/application-properties`;
    
    const response = await this.makeRequest(url, TIMEOUTS.DETECTION);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as ApplicationPropertiesResponse;
    
    // Validar se é realmente um Data Center
    if (!data.version || !data.buildNumber || !data.displayName) {
      throw new Error('Resposta inválida do application-properties');
    }

    const now = new Date();
    const cacheExpiresAt = new Date(now.getTime() + CACHE_DURATION.SERVER_CONFIG);

    return {
      serverType: 'datacenter',
      baseUrl,
      apiVersion: '1.0',
      capabilities: this.getServerCapabilities('datacenter'),
      detectedAt: now.toISOString(),
      cacheExpiresAt: cacheExpiresAt.toISOString(),
      detectionMethod: 'application_properties'
    };
  }

  /**
   * Detecta servidor via API 2.0 (Cloud)
   */
  private async detectViaApi2(baseUrl: string): Promise<ServerDetectionResult> {
    const url = `${baseUrl}/2.0/user`;
    
    const response = await this.makeRequest(url, TIMEOUTS.DETECTION);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as Api2Response;
    
    // Validar se é realmente um Cloud
    if (!data.uuid || !data.links?.self?.href) {
      throw new Error('Resposta inválida da API 2.0');
    }

    const now = new Date();
    const cacheExpiresAt = new Date(now.getTime() + CACHE_DURATION.SERVER_CONFIG);

    return {
      serverType: 'cloud',
      baseUrl,
      apiVersion: '2.0',
      capabilities: this.getServerCapabilities('cloud'),
      detectedAt: now.toISOString(),
      cacheExpiresAt: cacheExpiresAt.toISOString(),
      detectionMethod: 'api_2_0'
    };
  }

  /**
   * Cria resultado de fallback para Data Center 7.16
   */
  private createFallbackResult(baseUrl: string): ServerDetectionResult {
    const now = new Date();
    const cacheExpiresAt = new Date(now.getTime() + CACHE_DURATION.SERVER_CONFIG);

    return {
      serverType: 'datacenter',
      baseUrl,
      apiVersion: '7.16',
      capabilities: ['basic_auth'], // Capacidades limitadas para 7.16
      detectedAt: now.toISOString(),
      cacheExpiresAt: cacheExpiresAt.toISOString(),
      detectionMethod: 'fallback'
    };
  }

  /**
   * Faz requisição HTTP com timeout e retry
   */
  private async makeRequest(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Bitbucket-MCP-Server/1.0.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Valida se a URL é válida
   */
  private validateUrl(baseUrl: string): void {
    try {
      new URL(baseUrl);
    } catch (error) {
      throw new Error(`URL inválida: ${baseUrl}`);
    }
  }

  /**
   * Obtém capacidades do servidor baseado no tipo
   */
  private getServerCapabilities(serverType: ServerType): string[] {
    return [...SERVER_CAPABILITIES[serverType]];
  }

  /**
   * Obtém configuração do cache se ainda válida
   */
  private getCachedConfiguration(baseUrl: string): ServerConfiguration | null {
    const cached = this.cache.get(baseUrl);
    if (!cached) {
      return null;
    }

    const now = new Date();
    const cacheExpiresAt = new Date(cached.cacheExpiresAt);
    
    if (now >= cacheExpiresAt) {
      this.cache.delete(baseUrl);
      return null;
    }

    return cached;
  }

  /**
   * Armazena configuração no cache
   */
  private cacheConfiguration(baseUrl: string, result: ServerDetectionResult): void {
    const config: ServerConfiguration = {
      serverType: result.serverType,
      baseUrl: result.baseUrl,
      apiVersion: result.apiVersion,
      capabilities: result.capabilities,
      detectedAt: result.detectedAt,
      cacheExpiresAt: result.cacheExpiresAt,
      detectionMethod: result.detectionMethod
    };

    this.cache.set(baseUrl, config);
  }

  /**
   * Converte configuração para resultado de detecção
   */
  private convertToDetectionResult(config: ServerConfiguration): ServerDetectionResult {
    return {
      serverType: config.serverType,
      baseUrl: config.baseUrl,
      apiVersion: config.apiVersion,
      capabilities: config.capabilities,
      detectedAt: config.detectedAt,
      cacheExpiresAt: config.cacheExpiresAt,
      detectionMethod: config.detectionMethod
    };
  }

  /**
   * Executa health check no servidor
   * @param baseUrl URL base do servidor
   * @returns Status de saúde do servidor
   */
  async healthCheck(baseUrl: string): Promise<{ isHealthy: boolean; responseTime: number; error?: string }> {
    // Verificar cache de health check
    const cached = this.healthCheckCache.get(baseUrl);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < CACHE_DURATION.HEALTH_CHECK) {
        return { isHealthy: cached.isHealthy, responseTime: 0 };
      }
    }

    const startTime = Date.now();
    
    try {
      // Tentar endpoint simples primeiro
      const response = await this.makeRequest(`${baseUrl}/rest/api/1.0/application-properties`, 3000);
      const responseTime = Date.now() - startTime;
      
      const isHealthy = response.ok && responseTime < 1000; // Menos de 1 segundo
      
      // Cache do resultado
      this.healthCheckCache.set(baseUrl, {
        timestamp: Date.now(),
        isHealthy
      });

      return { isHealthy, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Cache do resultado negativo
      this.healthCheckCache.set(baseUrl, {
        timestamp: Date.now(),
        isHealthy: false
      });

      return { 
        isHealthy: false, 
        responseTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Limpa cache de configurações
   */
  clearCache(): void {
    this.cache.clear();
    this.healthCheckCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { configCacheSize: number; healthCheckCacheSize: number } {
    return {
      configCacheSize: this.cache.size,
      healthCheckCacheSize: this.healthCheckCache.size
    };
  }
}

// Instância singleton do serviço
export const serverDetectionService = new ServerDetectionService();
