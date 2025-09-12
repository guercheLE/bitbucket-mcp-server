import { loggerService } from '@/services/logger.service';
import { MetricsCollector } from './metrics';
import { RateLimiter } from './rate-limiter';
import { createToolError } from '@/services/error-handler.service';

export interface MiddlewareContext extends Record<string, unknown> {
  toolName: string;
  startTime: number;
  requestId: string;
  userId?: string;
  serverType?: string;
}

export interface MiddlewareResult {
  success: boolean;
  error?: string;
  duration: number;
  rateLimited?: boolean;
}

export class MiddlewareManager {
  private logger = loggerService.getLogger('middleware');
  private metricsCollector: MetricsCollector;
  private rateLimiter: RateLimiter;

  constructor(metricsCollector: MetricsCollector, rateLimiter: RateLimiter) {
    this.metricsCollector = metricsCollector;
    this.rateLimiter = rateLimiter;
  }

  public async executeMiddleware(
    context: MiddlewareContext,
    handler: () => Promise<any>
  ): Promise<MiddlewareResult> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      // Pre-execution middleware
      await this.preExecution(context);

      // Execute the actual handler
      const result = await handler();
      success = true;

      // Post-execution middleware
      await this.postExecution(context, result, success);

      return {
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      success = false;

      // Post-execution middleware for errors
      await this.postExecution(context, null, success, error);

      return {
        success: false,
        error,
        duration: Date.now() - startTime,
      };
    } finally {
      // Always record metrics
      this.recordMetrics(context, startTime, success, error);
    }
  }

  private async preExecution(context: MiddlewareContext): Promise<void> {
    // Rate limiting check
    const rateLimitKey = this.generateRateLimitKey(context);
    const { allowed, info } = this.rateLimiter.isAllowed(rateLimitKey);

    if (!allowed) {
      const error = createToolError(
        'middleware',
        'rate_limit',
        new Error('Rate limit exceeded'),
        context
      );

      this.logger.warn('Request rate limited', {
        toolName: context.toolName,
        requestId: context.requestId,
        rateLimitInfo: info,
      });

      throw error;
    }

    this.logger.debug('Pre-execution middleware completed', {
      toolName: context.toolName,
      requestId: context.requestId,
      rateLimitRemaining: info.remaining,
    });
  }

  private async postExecution(
    context: MiddlewareContext,
    _result: any,
    success: boolean,
    error?: string
  ): Promise<void> {
    // Log execution result
    if (success) {
      this.logger.debug('Tool execution successful', {
        toolName: context.toolName,
        requestId: context.requestId,
        duration: Date.now() - context.startTime,
      });
    } else {
      this.logger.warn('Tool execution failed', {
        toolName: context.toolName,
        requestId: context.requestId,
        error,
        duration: Date.now() - context.startTime,
      });
    }

    // Record rate limiter usage
    const rateLimitKey = this.generateRateLimitKey(context);
    this.rateLimiter.recordRequest(rateLimitKey, success);
  }

  private recordMetrics(
    context: MiddlewareContext,
    startTime: number,
    success: boolean,
    error?: string
  ): void {
    this.metricsCollector.recordToolCall(context.toolName, startTime, success, error);
  }

  private generateRateLimitKey(context: MiddlewareContext): string {
    // Generate a rate limit key based on user and tool
    const parts = [context.toolName];

    if (context.userId) {
      parts.push(context.userId);
    }

    if (context.serverType) {
      parts.push(context.serverType);
    }

    return parts.join(':');
  }

  public getMetrics(): any {
    return this.metricsCollector.getMetrics();
  }

  public getRateLimitInfo(key: string = 'default'): any {
    return this.rateLimiter.getInfo(key);
  }

  public resetMetrics(): void {
    this.metricsCollector.reset();
    this.logger.info('Metrics reset');
  }

  public resetRateLimits(key?: string): void {
    this.rateLimiter.reset(key);
    this.logger.info('Rate limits reset', { key });
  }

  public updateRateLimitConfig(config: any): void {
    this.rateLimiter.setConfig(config);
    this.logger.info('Rate limit config updated', { config });
  }
}
