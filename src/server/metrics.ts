import { loggerService } from '@/services/logger.service';

export interface ToolMetrics {
  name: string;
  calls: number;
  successes: number;
  failures: number;
  averageResponseTime: number;
  lastCalled?: string;
  errors: Record<string, number>;
}

export interface ServerMetrics {
  startTime: string;
  uptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tools: ToolMetrics[];
  memory: NodeJS.MemoryUsage;
  systemLoad?: {
    cpu: number;
    memory: number;
  };
}

export class MetricsCollector {
  private logger = loggerService.getLogger('metrics');
  private startTime = Date.now();
  private toolMetrics: Map<string, ToolMetrics> = new Map();
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalResponseTime = 0;

  public recordToolCall(
    toolName: string,
    startTime: number,
    success: boolean,
    error?: string
  ): void {
    const duration = Date.now() - startTime;

    this.totalRequests++;
    this.totalResponseTime += duration;

    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    // Update tool-specific metrics
    const existing = this.toolMetrics.get(toolName) || {
      name: toolName,
      calls: 0,
      successes: 0,
      failures: 0,
      averageResponseTime: 0,
      errors: {},
    };

    existing.calls++;
    existing.lastCalled = new Date().toISOString();

    if (success) {
      existing.successes++;
    } else {
      existing.failures++;
      if (error) {
        existing.errors[error] = (existing.errors[error] || 0) + 1;
      }
    }

    // Update average response time
    const totalToolTime = existing.averageResponseTime * (existing.calls - 1) + duration;
    existing.averageResponseTime = totalToolTime / existing.calls;

    this.toolMetrics.set(toolName, existing);

    this.logger.debug('Tool call recorded', {
      toolName,
      duration,
      success,
      error,
    });
  }

  public getMetrics(): ServerMetrics {
    const tools = Array.from(this.toolMetrics.values());
    const averageResponseTime =
      this.totalRequests > 0 ? this.totalResponseTime / this.totalRequests : 0;

    return {
      startTime: new Date(this.startTime).toISOString(),
      uptime: Date.now() - this.startTime,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      averageResponseTime,
      tools,
      memory: process.memoryUsage(),
    };
  }

  public getToolMetrics(toolName: string): ToolMetrics | undefined {
    return this.toolMetrics.get(toolName);
  }

  public getTopTools(limit = 10): ToolMetrics[] {
    return Array.from(this.toolMetrics.values())
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  public getSlowestTools(limit = 10): ToolMetrics[] {
    return Array.from(this.toolMetrics.values())
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, limit);
  }

  public getMostFailingTools(limit = 10): ToolMetrics[] {
    return Array.from(this.toolMetrics.values())
      .filter(tool => tool.failures > 0)
      .sort((a, b) => b.failures - a.failures)
      .slice(0, limit);
  }

  public reset(): void {
    this.logger.info('Resetting metrics');

    this.startTime = Date.now();
    this.toolMetrics.clear();
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalResponseTime = 0;
  }

  public getSuccessRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.successfulRequests / this.totalRequests) * 100;
  }

  public getFailureRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.failedRequests / this.totalRequests) * 100;
  }

  public getTotalToolCalls(): number {
    return Array.from(this.toolMetrics.values()).reduce((sum, tool) => sum + tool.calls, 0);
  }

  public getUniqueTools(): number {
    return this.toolMetrics.size;
  }

  public getAverageCallsPerTool(): number {
    if (this.toolMetrics.size === 0) return 0;
    return this.getTotalToolCalls() / this.toolMetrics.size;
  }
}
