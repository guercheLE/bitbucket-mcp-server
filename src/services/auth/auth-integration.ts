import { 
  ServerDetectionResult, 
  ServerType,
  AuthenticationMethod,
  SERVER_CAPABILITIES,
  AUTHENTICATION_PRIORITIES
} from '../../types/auth';
import { serverDetectionService } from './server-detection';
import { OAuthService } from './oauth';
import { AuthenticationService } from './authentication';

/**
 * Serviço de integração entre autenticação e detecção de servidor
 * Implementa registro seletivo de ferramentas MCP baseado no tipo de servidor
 */
export class AuthenticationIntegrationService {
  private serverDetectionCache = new Map<string, ServerDetectionResult>();
  private toolRegistry = new Map<string, any>();

  /**
   * Integra detecção de servidor com autenticação
   * @param baseUrl URL base do servidor Bitbucket
   * @returns Resultado da integração com capacidades do servidor
   */
  async integrateServerDetectionWithAuth(baseUrl: string): Promise<{
    serverDetection: ServerDetectionResult;
    availableAuthMethods: AuthenticationMethod[];
    recommendedAuthMethod: AuthenticationMethod;
    supportedCapabilities: string[];
  }> {
    try {
      // Detectar tipo de servidor
      const serverDetection = await this.detectServerWithCache(baseUrl);
      
      // Determinar métodos de autenticação disponíveis
      const availableAuthMethods = this.getAvailableAuthMethods(serverDetection.serverType);
      
      // Determinar método recomendado baseado na hierarquia
      const recommendedAuthMethod = this.getRecommendedAuthMethod(availableAuthMethods);
      
      // Obter capacidades suportadas
      const supportedCapabilities = this.getSupportedCapabilities(serverDetection.serverType);

      return {
        serverDetection,
        availableAuthMethods,
        recommendedAuthMethod,
        supportedCapabilities
      };
    } catch (error) {
      throw new Error(`Falha na integração de detecção de servidor com autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Implementa registro seletivo de ferramentas MCP baseado no tipo de servidor
   * @param serverType Tipo de servidor detectado
   * @returns Lista de ferramentas MCP disponíveis
   */
  registerSelectiveMCPTools(serverType: ServerType): {
    sharedTools: string[];
    datacenterTools: string[];
    cloudTools: string[];
    availableTools: string[];
  } {
    // Ferramentas compartilhadas (disponíveis em ambos)
    const sharedTools = [
      'mcp_bitbucket_auth_get_oauth_authorization_url',
      'mcp_bitbucket_auth_get_oauth_token',
      'mcp_bitbucket_auth_refresh_oauth_token',
      'mcp_bitbucket_auth_get_current_session',
      'mcp_bitbucket_auth_create_session',
      'mcp_bitbucket_auth_refresh_session',
      'mcp_bitbucket_auth_revoke_session',
      'mcp_bitbucket_auth_list_active_sessions',
      'mcp_bitbucket_auth_get_access_token_info',
      'mcp_bitbucket_auth_revoke_access_token'
    ];

    // Ferramentas específicas do Data Center
    const datacenterTools = [
      'mcp_bitbucket_auth_create_oauth_application',
      'mcp_bitbucket_auth_get_oauth_application',
      'mcp_bitbucket_auth_update_oauth_application',
      'mcp_bitbucket_auth_delete_oauth_application',
      'mcp_bitbucket_auth_list_oauth_applications'
    ];

    // Ferramentas específicas do Cloud
    const cloudTools: string[] = []; // Cloud não tem ferramentas específicas de autenticação

    // Determinar ferramentas disponíveis baseado no tipo de servidor
    let availableTools: string[];
    
    if (serverType === 'datacenter') {
      availableTools = [...sharedTools, ...datacenterTools];
    } else {
      availableTools = [...sharedTools, ...cloudTools];
    }

    // Registrar ferramentas no cache
    this.toolRegistry.set(serverType, availableTools);

    return {
      sharedTools,
      datacenterTools,
      cloudTools,
      availableTools
    };
  }

  /**
   * Implementa fallback para Cloud quando Data Center não suporta
   * @param serverType Tipo de servidor detectado
   * @param requestedCapability Capacidade solicitada
   * @returns Informações sobre fallback disponível
   */
  getFallbackForUnsupportedCapability(
    serverType: ServerType, 
    requestedCapability: string
  ): {
    hasFallback: boolean;
    fallbackMethod?: string;
    fallbackDescription?: string;
    alternativeCapabilities?: string[];
  } {
    // Mapear capacidades não suportadas para alternativas
    const fallbackMap: Record<string, Record<ServerType, {
      hasFallback: boolean;
      fallbackMethod?: string;
      fallbackDescription?: string;
      alternativeCapabilities?: string[];
    }>> = {
      'oauth_applications': {
        'cloud': {
          hasFallback: false,
          fallbackDescription: 'Cloud não suporta gerenciamento de aplicações OAuth',
          alternativeCapabilities: ['oauth2', 'personal_tokens']
        },
        'datacenter': {
          hasFallback: true,
          fallbackMethod: 'oauth_applications',
          fallbackDescription: 'Data Center suporta gerenciamento completo de aplicações OAuth'
        }
      },
      'app_passwords': {
        'cloud': {
          hasFallback: false,
          fallbackDescription: 'Cloud não suporta App Passwords',
          alternativeCapabilities: ['oauth2', 'personal_tokens']
        },
        'datacenter': {
          hasFallback: true,
          fallbackMethod: 'app_passwords',
          fallbackDescription: 'Data Center suporta App Passwords'
        }
      }
    };

    const capabilityFallback = fallbackMap[requestedCapability];
    if (!capabilityFallback) {
      return {
        hasFallback: false,
        fallbackDescription: `Capacidade '${requestedCapability}' não reconhecida`
      };
    }

    return capabilityFallback[serverType] || {
      hasFallback: false,
      fallbackDescription: `Capacidade '${requestedCapability}' não suportada em ${serverType}`
    };
  }

  /**
   * Valida capacidades do servidor para uma operação específica
   * @param serverType Tipo de servidor
   * @param operation Operação solicitada
   * @returns Resultado da validação
   */
  validateServerCapabilities(
    serverType: ServerType, 
    operation: string
  ): {
    isSupported: boolean;
    requiredCapabilities: string[];
    missingCapabilities: string[];
    alternativeOperations?: string[];
  } {
    // Mapear operações para capacidades necessárias
    const operationCapabilities: Record<string, {
      datacenter: string[];
      cloud: string[];
    }> = {
      'oauth_authorization': {
        datacenter: ['oauth2'],
        cloud: ['oauth2']
      },
      'oauth_token_exchange': {
        datacenter: ['oauth2'],
        cloud: ['oauth2']
      },
      'oauth_application_management': {
        datacenter: ['oauth2'],
        cloud: [] // Cloud não suporta
      },
      'personal_token_auth': {
        datacenter: ['personal_tokens'],
        cloud: ['personal_tokens']
      },
      'app_password_auth': {
        datacenter: ['app_passwords'],
        cloud: [] // Cloud não suporta
      },
      'basic_auth': {
        datacenter: ['basic_auth'],
        cloud: ['basic_auth']
      }
    };

    const operationCapability = operationCapabilities[operation];
    if (!operationCapability) {
      return {
        isSupported: false,
        requiredCapabilities: [],
        missingCapabilities: [],
        alternativeOperations: Object.keys(operationCapabilities)
      };
    }

    const requiredCapabilities = operationCapability[serverType];
    const serverCapabilities = SERVER_CAPABILITIES[serverType];
    
    const missingCapabilities = requiredCapabilities.filter(
      capability => !serverCapabilities.includes(capability as any)
    );

    return {
      isSupported: missingCapabilities.length === 0,
      requiredCapabilities,
      missingCapabilities,
      alternativeOperations: missingCapabilities.length > 0 ? 
        Object.keys(operationCapabilities).filter(op => 
          operationCapabilities[op][serverType].length > 0
        ) : undefined
    };
  }

  /**
   * Obtém configuração de autenticação otimizada para o servidor
   * @param serverType Tipo de servidor
   * @returns Configuração otimizada
   */
  getOptimizedAuthConfiguration(serverType: ServerType): {
    primaryAuthMethod: AuthenticationMethod;
    fallbackAuthMethods: AuthenticationMethod[];
    oauthConfig: {
      baseUrl: string;
      endpoints: {
        authorize: string;
        token: string;
        revoke: string;
      };
    };
    sessionConfig: {
      timeout: number;
      refreshThreshold: number;
      maxSessions: number;
    };
  } {
    const availableMethods = this.getAvailableAuthMethods(serverType);
    const primaryMethod = this.getRecommendedAuthMethod(availableMethods);
    const fallbackMethods = availableMethods.filter(method => method !== primaryMethod);

    // Configuração OAuth baseada no tipo de servidor
    const oauthConfig = {
      baseUrl: serverType === 'cloud' ? 'https://bitbucket.org' : 'https://bitbucket.example.com',
      endpoints: {
        authorize: '/oauth/authorize',
        token: '/oauth/token',
        revoke: '/oauth/revoke'
      }
    };

    // Configuração de sessão otimizada
    const sessionConfig = {
      timeout: serverType === 'cloud' ? 3600 : 7200, // Cloud: 1h, Data Center: 2h
      refreshThreshold: 300, // 5 minutos antes da expiração
      maxSessions: serverType === 'cloud' ? 10 : 50 // Cloud: 10, Data Center: 50
    };

    return {
      primaryAuthMethod: primaryMethod,
      fallbackAuthMethods: fallbackMethods,
      oauthConfig,
      sessionConfig
    };
  }

  /**
   * Detecta servidor com cache
   */
  private async detectServerWithCache(baseUrl: string): Promise<ServerDetectionResult> {
    // Verificar cache primeiro
    const cached = this.serverDetectionCache.get(baseUrl);
    if (cached) {
      const now = new Date();
      const cacheExpiresAt = new Date(cached.cacheExpiresAt);
      
      if (now < cacheExpiresAt) {
        return cached;
      }
    }

    // Detectar servidor
    const result = await serverDetectionService.detectServer(baseUrl);
    
    // Armazenar no cache
    this.serverDetectionCache.set(baseUrl, result);
    
    return result;
  }

  /**
   * Obtém métodos de autenticação disponíveis para o tipo de servidor
   */
  private getAvailableAuthMethods(serverType: ServerType): AuthenticationMethod[] {
    const capabilities = SERVER_CAPABILITIES[serverType];
    const availableMethods: AuthenticationMethod[] = [];

    if (capabilities.includes('oauth2')) {
      availableMethods.push('oauth2');
    }
    if (capabilities.includes('personal_tokens')) {
      availableMethods.push('personal_token');
    }
    if (capabilities.includes('app_passwords' as any)) {
      availableMethods.push('app_password');
    }
    if (capabilities.includes('basic_auth')) {
      availableMethods.push('basic_auth');
    }

    return availableMethods;
  }

  /**
   * Obtém método de autenticação recomendado baseado na hierarquia
   */
  private getRecommendedAuthMethod(availableMethods: AuthenticationMethod[]): AuthenticationMethod {
    // Ordenar por prioridade (menor número = maior prioridade)
    const sortedMethods = availableMethods.sort((a, b) => 
      AUTHENTICATION_PRIORITIES[a].priority - AUTHENTICATION_PRIORITIES[b].priority
    );

    return sortedMethods[0] || 'basic_auth';
  }

  /**
   * Obtém capacidades suportadas pelo tipo de servidor
   */
  private getSupportedCapabilities(serverType: ServerType): string[] {
    return [...SERVER_CAPABILITIES[serverType]];
  }

  /**
   * Limpa cache de detecção de servidor
   */
  clearServerDetectionCache(): void {
    this.serverDetectionCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    serverDetectionCacheSize: number;
    toolRegistrySize: number;
  } {
    return {
      serverDetectionCacheSize: this.serverDetectionCache.size,
      toolRegistrySize: this.toolRegistry.size
    };
  }

  /**
   * Obtém informações de integração para um servidor específico
   */
  async getIntegrationInfo(baseUrl: string): Promise<{
    serverType: ServerType;
    capabilities: string[];
    availableAuthMethods: AuthenticationMethod[];
    recommendedAuthMethod: AuthenticationMethod;
    availableTools: string[];
    optimizedConfig: any;
  }> {
    const integration = await this.integrateServerDetectionWithAuth(baseUrl);
    const toolRegistration = this.registerSelectiveMCPTools(integration.serverDetection.serverType);
    const optimizedConfig = this.getOptimizedAuthConfiguration(integration.serverDetection.serverType);

    return {
      serverType: integration.serverDetection.serverType,
      capabilities: integration.supportedCapabilities,
      availableAuthMethods: integration.availableAuthMethods,
      recommendedAuthMethod: integration.recommendedAuthMethod,
      availableTools: toolRegistration.availableTools,
      optimizedConfig
    };
  }
}

// Instância singleton do serviço de integração
export const authenticationIntegrationService = new AuthenticationIntegrationService();
