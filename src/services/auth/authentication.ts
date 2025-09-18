import { 
  AuthenticationCredentials, 
  AuthenticationMethod, 
  AuthenticationResult,
  AUTHENTICATION_PRIORITIES,
  ServerType
} from '../../types/auth';

/**
 * Classe base para autenticação
 */
export abstract class Authentication {
  protected credentials: AuthenticationCredentials;
  protected serverType: ServerType;

  constructor(credentials: AuthenticationCredentials, serverType: ServerType) {
    this.credentials = credentials;
    this.serverType = serverType;
  }

  /**
   * Autentica com o servidor
   */
  abstract authenticate(): Promise<AuthenticationResult>;

  /**
   * Obtém prioridade do método de autenticação
   */
  getPriority(): number {
    return AUTHENTICATION_PRIORITIES[this.credentials.type].priority;
  }

  /**
   * Verifica se o método é seguro
   */
  isSecure(): boolean {
    return AUTHENTICATION_PRIORITIES[this.credentials.type].isSecure;
  }

  /**
   * Verifica se o método é recomendado
   */
  isRecommended(): boolean {
    return AUTHENTICATION_PRIORITIES[this.credentials.type].isRecommended;
  }
}

/**
 * Autenticação OAuth 2.0 (prioridade máxima)
 */
export class OAuth2Auth extends Authentication {
  async authenticate(): Promise<AuthenticationResult> {
    try {
      // Simular validação de token OAuth2
      if (!this.credentials.accessToken || !this.credentials.clientId || !this.credentials.clientSecret) {
        return {
          success: false,
          method: 'oauth2',
          priority: 1,
          error: 'Credenciais OAuth2 incompletas',
          fallbackAvailable: true
        };
      }

      // Simular verificação de token
      const isValidToken = await this.validateOAuthToken();
      
      if (!isValidToken) {
        return {
          success: false,
          method: 'oauth2',
          priority: 1,
          error: 'Token OAuth2 inválido ou expirado',
          fallbackAvailable: true
        };
      }

      return {
        success: true,
        method: 'oauth2',
        priority: 1,
        fallbackAvailable: true
      };
    } catch (error) {
      return {
        success: false,
        method: 'oauth2',
        priority: 1,
        error: error instanceof Error ? error.message : 'Erro de autenticação OAuth2',
        fallbackAvailable: true
      };
    }
  }

  private async validateOAuthToken(): Promise<boolean> {
    // Simular validação de token
    return this.credentials.accessToken!.length > 10;
  }
}

/**
 * Autenticação Personal Access Token
 */
export class PersonalTokenAuth extends Authentication {
  async authenticate(): Promise<AuthenticationResult> {
    try {
      if (!this.credentials.token) {
        return {
          success: false,
          method: 'personal_token',
          priority: 2,
          error: 'Token pessoal não fornecido',
          fallbackAvailable: true
        };
      }

      // Simular validação de token pessoal
      const isValidToken = await this.validatePersonalToken();
      
      if (!isValidToken) {
        return {
          success: false,
          method: 'personal_token',
          priority: 2,
          error: 'Token pessoal inválido',
          fallbackAvailable: true
        };
      }

      return {
        success: true,
        method: 'personal_token',
        priority: 2,
        fallbackAvailable: true
      };
    } catch (error) {
      return {
        success: false,
        method: 'personal_token',
        priority: 2,
        error: error instanceof Error ? error.message : 'Erro de autenticação com token pessoal',
        fallbackAvailable: true
      };
    }
  }

  private async validatePersonalToken(): Promise<boolean> {
    // Simular validação de token pessoal
    return this.credentials.token!.length > 10;
  }
}

/**
 * Autenticação App Password
 */
export class AppPasswordAuth extends Authentication {
  async authenticate(): Promise<AuthenticationResult> {
    try {
      if (!this.credentials.username || !this.credentials.password) {
        return {
          success: false,
          method: 'app_password',
          priority: 3,
          error: 'Username ou password não fornecidos',
          fallbackAvailable: true
        };
      }

      // Simular validação de app password
      const isValidPassword = await this.validateAppPassword();
      
      if (!isValidPassword) {
        return {
          success: false,
          method: 'app_password',
          priority: 3,
          error: 'App password inválido',
          fallbackAvailable: true
        };
      }

      return {
        success: true,
        method: 'app_password',
        priority: 3,
        fallbackAvailable: true
      };
    } catch (error) {
      return {
        success: false,
        method: 'app_password',
        priority: 3,
        error: error instanceof Error ? error.message : 'Erro de autenticação com app password',
        fallbackAvailable: true
      };
    }
  }

  private async validateAppPassword(): Promise<boolean> {
    // Simular validação de app password
    return this.credentials.username!.length > 0 && this.credentials.password!.length > 0;
  }
}

/**
 * Autenticação Basic Auth (fallback)
 */
export class BasicAuth extends Authentication {
  async authenticate(): Promise<AuthenticationResult> {
    try {
      if (!this.credentials.username || !this.credentials.password) {
        return {
          success: false,
          method: 'basic_auth',
          priority: 4,
          error: 'Username ou password não fornecidos',
          fallbackAvailable: false
        };
      }

      // Simular validação de basic auth
      const isValidAuth = await this.validateBasicAuth();
      
      if (!isValidAuth) {
        return {
          success: false,
          method: 'basic_auth',
          priority: 4,
          error: 'Credenciais básicas inválidas',
          fallbackAvailable: false
        };
      }

      return {
        success: true,
        method: 'basic_auth',
        priority: 4,
        fallbackAvailable: false
      };
    } catch (error) {
      return {
        success: false,
        method: 'basic_auth',
        priority: 4,
        error: error instanceof Error ? error.message : 'Erro de autenticação básica',
        fallbackAvailable: false
      };
    }
  }

  private async validateBasicAuth(): Promise<boolean> {
    // Simular validação de basic auth
    return this.credentials.username!.length > 0 && this.credentials.password!.length > 0;
  }
}

/**
 * Serviço de autenticação com hierarquia de prioridades
 */
export class AuthenticationService {
  private authMethods: Map<AuthenticationMethod, Authentication> = new Map();

  /**
   * Registra método de autenticação
   */
  registerAuthMethod(method: AuthenticationMethod, auth: Authentication): void {
    this.authMethods.set(method, auth);
  }

  /**
   * Autentica usando hierarquia de prioridades
   * Tenta OAuth2 → Personal Token → App Password → Basic Auth
   */
  async authenticate(): Promise<AuthenticationResult> {
    const methods = this.getMethodsByPriority();
    
    for (const method of methods) {
      const auth = this.authMethods.get(method);
      if (!auth) {
        continue;
      }

      try {
        const result = await auth.authenticate();
        
        if (result.success) {
          return result;
        }

        // Se falhou e não há fallback, retorna erro
        if (!result.fallbackAvailable) {
          return result;
        }

        // Continua para o próximo método
        console.warn(`Falha na autenticação ${method}: ${result.error}`);
      } catch (error) {
        console.error(`Erro na autenticação ${method}:`, error);
        continue;
      }
    }

    // Se chegou aqui, todos os métodos falharam
    return {
      success: false,
      method: 'basic_auth',
      priority: 4,
      error: 'Todos os métodos de autenticação falharam',
      fallbackAvailable: false
    };
  }

  /**
   * Obtém métodos de autenticação ordenados por prioridade
   */
  private getMethodsByPriority(): AuthenticationMethod[] {
    const methods: AuthenticationMethod[] = ['oauth2', 'personal_token', 'app_password', 'basic_auth'];
    
    return methods.sort((a, b) => {
      const priorityA = AUTHENTICATION_PRIORITIES[a].priority;
      const priorityB = AUTHENTICATION_PRIORITIES[b].priority;
      return priorityA - priorityB;
    });
  }

  /**
   * Obtém estatísticas dos métodos de autenticação
   */
  getAuthStats(): Array<{
    method: AuthenticationMethod;
    priority: number;
    isSecure: boolean;
    isRecommended: boolean;
    isRegistered: boolean;
  }> {
    const methods: AuthenticationMethod[] = ['oauth2', 'personal_token', 'app_password', 'basic_auth'];
    
    return methods.map(method => ({
      method,
      priority: AUTHENTICATION_PRIORITIES[method].priority,
      isSecure: AUTHENTICATION_PRIORITIES[method].isSecure,
      isRecommended: AUTHENTICATION_PRIORITIES[method].isRecommended,
      isRegistered: this.authMethods.has(method)
    }));
  }

  /**
   * Limpa todos os métodos de autenticação registrados
   */
  clearAuthMethods(): void {
    this.authMethods.clear();
  }
}

/**
 * Factory para criar instâncias de autenticação
 */
export class AuthenticationFactory {
  static create(
    method: AuthenticationMethod, 
    credentials: AuthenticationCredentials, 
    serverType: ServerType
  ): Authentication {
    switch (method) {
      case 'oauth2':
        return new OAuth2Auth(credentials, serverType);
      case 'personal_token':
        return new PersonalTokenAuth(credentials, serverType);
      case 'app_password':
        return new AppPasswordAuth(credentials, serverType);
      case 'basic_auth':
        return new BasicAuth(credentials, serverType);
      default:
        throw new Error(`Método de autenticação não suportado: ${method}`);
    }
  }
}
