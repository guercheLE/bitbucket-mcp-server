import { 
  RETRY_CONFIG,
  TIMEOUTS
} from '../../types/auth';

/**
 * Tipos de erro para classificação
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface para informações de erro
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
  context?: Record<string, any>;
}

/**
 * Interface para configuração de retry
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

/**
 * Interface para métricas de erro
 */
export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  retryAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryTime: number;
}

/**
 * Classe para tratamento de erros e estratégias de retry
 */
export class ErrorHandlingService {
  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {} as Record<ErrorType, number>,
    retryAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageRetryTime: 0
  };

  private circuitBreakerState: Map<string, {
    failures: number;
    lastFailureTime: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  }> = new Map();

  /**
   * Implementa exponential backoff com jitter
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config: RetryConfig = {
      maxRetries: customRetryConfig?.maxRetries ?? RETRY_CONFIG.MAX_RETRIES,
      baseDelay: customRetryConfig?.baseDelay ?? RETRY_CONFIG.BASE_DELAY,
      maxDelay: customRetryConfig?.maxDelay ?? RETRY_CONFIG.MAX_DELAY,
      backoffMultiplier: customRetryConfig?.backoffMultiplier ?? 2,
      jitter: customRetryConfig?.jitter ?? true
    };

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Verificar circuit breaker
        if (this.isCircuitBreakerOpen(context)) {
          throw new Error(`Circuit breaker is OPEN for context: ${context}`);
        }

        const result = await operation();
        
        // Sucesso - resetar circuit breaker
        this.resetCircuitBreaker(context);
        
        if (attempt > 0) {
          this.errorMetrics.successfulRetries++;
          this.updateAverageRetryTime(Date.now() - startTime);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Classificar erro
        const errorInfo = this.classifyError(lastError);
        this.recordError(errorInfo);
        
        // Verificar se é retryable
        if (!errorInfo.retryable || attempt === config.maxRetries) {
          this.recordCircuitBreakerFailure(context);
          throw this.createEnhancedError(errorInfo, attempt);
        }
        
        // Calcular delay para próximo retry
        const delay = this.calculateRetryDelay(attempt, config, errorInfo);
        
        this.errorMetrics.retryAttempts++;
        
        // Aguardar antes do próximo retry
        await this.sleep(delay);
      }
    }
    
    this.errorMetrics.failedRetries++;
    throw this.createEnhancedError(this.classifyError(lastError!), config.maxRetries);
  }

  /**
   * Implementa circuit breaker pattern
   */
  private isCircuitBreakerOpen(context: string): boolean {
    const state = this.circuitBreakerState.get(context);
    if (!state) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastFailure = now - state.lastFailureTime;
    const circuitBreakerTimeout = 60000; // 1 minuto

    switch (state.state) {
      case 'CLOSED':
        return false;
      case 'OPEN':
        if (timeSinceLastFailure > circuitBreakerTimeout) {
          state.state = 'HALF_OPEN';
          return false;
        }
        return true;
      case 'HALF_OPEN':
        return false;
      default:
        return false;
    }
  }

  /**
   * Registra falha no circuit breaker
   */
  private recordCircuitBreakerFailure(context: string): void {
    const state = this.circuitBreakerState.get(context) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED' as const
    };

    state.failures++;
    state.lastFailureTime = Date.now();

    // Abrir circuit breaker após 5 falhas consecutivas
    if (state.failures >= 5) {
      state.state = 'OPEN';
    }

    this.circuitBreakerState.set(context, state);
  }

  /**
   * Reseta circuit breaker após sucesso
   */
  private resetCircuitBreaker(context: string): void {
    const state = this.circuitBreakerState.get(context);
    if (state) {
      state.failures = 0;
      state.state = 'CLOSED';
      this.circuitBreakerState.set(context, state);
    }
  }

  /**
   * Classifica erro baseado no tipo e contexto
   */
  private classifyError(error: Error): ErrorInfo {
    const message = error.message.toLowerCase();
    
    // Erros de rede
    if (message.includes('network') || message.includes('connection') || 
        message.includes('econnreset') || message.includes('enotfound')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
        context: { networkError: true }
      };
    }

    // Erros de autenticação
    if (message.includes('unauthorized') || message.includes('forbidden') ||
        message.includes('invalid token') || message.includes('authentication')) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        message: error.message,
        originalError: error,
        retryable: false,
        context: { authError: true }
      };
    }

    // Erros de servidor
    if (message.includes('internal server error') || message.includes('500') ||
        message.includes('502') || message.includes('503') || message.includes('504')) {
      return {
        type: ErrorType.SERVER_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
        context: { serverError: true }
      };
    }

    // Erros de validação
    if (message.includes('validation') || message.includes('invalid') ||
        message.includes('bad request') || message.includes('400')) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: error.message,
        originalError: error,
        retryable: false,
        context: { validationError: true }
      };
    }

    // Erros de timeout
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
        context: { timeoutError: true }
      };
    }

    // Erros de rate limit
    if (message.includes('rate limit') || message.includes('too many requests') ||
        message.includes('429')) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
        retryAfter: this.extractRetryAfter(error.message),
        context: { rateLimitError: true }
      };
    }

    // Erro desconhecido
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message,
      originalError: error,
      retryable: true,
      context: { unknownError: true }
    };
  }

  /**
   * Extrai tempo de retry de mensagens de rate limit
   */
  private extractRetryAfter(message: string): number | undefined {
    const retryAfterMatch = message.match(/retry.after[:\s]+(\d+)/i);
    if (retryAfterMatch) {
      return parseInt(retryAfterMatch[1], 10);
    }
    return undefined;
  }

  /**
   * Calcula delay para retry com exponential backoff e jitter
   */
  private calculateRetryDelay(
    attempt: number, 
    config: RetryConfig, 
    errorInfo: ErrorInfo
  ): number {
    // Usar retryAfter se disponível (rate limit)
    if (errorInfo.retryAfter) {
      return errorInfo.retryAfter * 1000; // Converter para ms
    }

    // Calcular delay base
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Aplicar limite máximo
    delay = Math.min(delay, config.maxDelay);
    
    // Adicionar jitter se habilitado
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% de jitter
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return Math.max(0, delay);
  }

  /**
   * Registra erro nas métricas
   */
  private recordError(errorInfo: ErrorInfo): void {
    this.errorMetrics.totalErrors++;
    this.errorMetrics.errorsByType[errorInfo.type] = 
      (this.errorMetrics.errorsByType[errorInfo.type] || 0) + 1;
  }

  /**
   * Atualiza tempo médio de retry
   */
  private updateAverageRetryTime(retryTime: number): void {
    const totalRetries = this.errorMetrics.successfulRetries + this.errorMetrics.failedRetries;
    this.errorMetrics.averageRetryTime = 
      (this.errorMetrics.averageRetryTime * (totalRetries - 1) + retryTime) / totalRetries;
  }

  /**
   * Cria erro aprimorado com informações de contexto
   */
  private createEnhancedError(errorInfo: ErrorInfo, attemptCount: number): Error {
    const enhancedMessage = `[${errorInfo.type}] ${errorInfo.message} (Attempt ${attemptCount + 1})`;
    const error = new Error(enhancedMessage);
    
    // Adicionar propriedades customizadas
    (error as any).errorType = errorInfo.type;
    (error as any).retryable = errorInfo.retryable;
    (error as any).attemptCount = attemptCount;
    (error as any).context = errorInfo.context;
    
    return error;
  }

  /**
   * Utilitário para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Trata erros de rede com retry específico
   */
  async handleNetworkError<T>(
    operation: () => Promise<T>,
    context: string = 'network'
  ): Promise<T> {
    return this.executeWithRetry(operation, context, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    });
  }

  /**
   * Trata erros de autenticação
   */
  handleAuthenticationError(error: Error): Error {
    const errorInfo = this.classifyError(error);
    this.recordError(errorInfo);
    
    // Log de segurança
    console.error(`[SECURITY] Authentication error: ${error.message}`);
    
    return this.createEnhancedError(errorInfo, 0);
  }

  /**
   * Trata erros de servidor com retry específico
   */
  async handleServerError<T>(
    operation: () => Promise<T>,
    context: string = 'server'
  ): Promise<T> {
    return this.executeWithRetry(operation, context, {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000
    });
  }

  /**
   * Trata erros de validação
   */
  handleValidationError(error: Error): Error {
    const errorInfo = this.classifyError(error);
    this.recordError(errorInfo);
    
    return this.createEnhancedError(errorInfo, 0);
  }

  /**
   * Trata erros de timeout
   */
  async handleTimeoutError<T>(
    operation: () => Promise<T>,
    context: string = 'timeout'
  ): Promise<T> {
    return this.executeWithRetry(operation, context, {
      maxRetries: 2,
      baseDelay: 5000,
      maxDelay: 15000
    });
  }

  /**
   * Trata erros de rate limit
   */
  async handleRateLimitError<T>(
    operation: () => Promise<T>,
    context: string = 'rate_limit'
  ): Promise<T> {
    return this.executeWithRetry(operation, context, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 60000 // 1 minuto máximo para rate limit
    });
  }

  /**
   * Obtém métricas de erro
   */
  getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  /**
   * Obtém estado do circuit breaker
   */
  getCircuitBreakerState(): Record<string, any> {
    const state: Record<string, any> = {};
    this.circuitBreakerState.forEach((value, key) => {
      state[key] = { ...value };
    });
    return state;
  }

  /**
   * Reseta métricas de erro
   */
  resetErrorMetrics(): void {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      retryAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryTime: 0
    };
  }

  /**
   * Reseta circuit breaker para um contexto específico
   */
  resetCircuitBreakerForContext(context: string): void {
    this.circuitBreakerState.delete(context);
  }

  /**
   * Reseta todos os circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakerState.clear();
  }

  /**
   * Obtém estatísticas de saúde do sistema
   */
  getHealthStats(): {
    isHealthy: boolean;
    errorRate: number;
    circuitBreakerStates: Record<string, string>;
    recommendations: string[];
  } {
    const totalOperations = this.errorMetrics.totalErrors + this.errorMetrics.successfulRetries;
    const errorRate = totalOperations > 0 ? this.errorMetrics.totalErrors / totalOperations : 0;
    
    const circuitBreakerStates: Record<string, string> = {};
    this.circuitBreakerState.forEach((state, context) => {
      circuitBreakerStates[context] = state.state;
    });
    
    const recommendations: string[] = [];
    
    if (errorRate > 0.1) { // 10% de taxa de erro
      recommendations.push('Taxa de erro alta detectada. Verifique conectividade e configurações.');
    }
    
    if (this.errorMetrics.errorsByType[ErrorType.AUTHENTICATION_ERROR] > 0) {
      recommendations.push('Erros de autenticação detectados. Verifique credenciais e tokens.');
    }
    
    const openCircuitBreakers = Object.values(circuitBreakerStates).filter(state => state === 'OPEN');
    if (openCircuitBreakers.length > 0) {
      recommendations.push(`${openCircuitBreakers.length} circuit breaker(s) aberto(s). Verifique serviços.`);
    }
    
    return {
      isHealthy: errorRate < 0.05 && openCircuitBreakers.length === 0, // 5% de taxa de erro e nenhum circuit breaker aberto
      errorRate,
      circuitBreakerStates,
      recommendations
    };
  }
}

// Instância singleton do serviço de tratamento de erros
export const errorHandlingService = new ErrorHandlingService();
