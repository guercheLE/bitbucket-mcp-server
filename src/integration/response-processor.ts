import { loggerService } from '@/services/logger.service';
import { BitbucketError } from '@/types/errors';

export interface ProcessedResponse<T = any> {
  data: T;
  metadata: {
    timestamp: string;
    processingTime: number;
    source: 'bitbucket-cloud' | 'bitbucket-datacenter';
    version?: string;
    pagination?: {
      page: number;
      size: number;
      total: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  errors: BitbucketError[];
  warnings: string[];
}

export interface ResponseProcessorConfig {
  enablePagination: boolean;
  enableMetadata: boolean;
  enableErrorCollection: boolean;
  enableWarningCollection: boolean;
  maxResponseSize: number;
  timeout: number;
}

export class ResponseProcessor {
  private logger = loggerService.getLogger('response-processor');
  private config: ResponseProcessorConfig;

  constructor(config: ResponseProcessorConfig) {
    this.config = config;
  }

  public async processResponse<T>(
    response: any,
    source: 'bitbucket-cloud' | 'bitbucket-datacenter',
    startTime: number = Date.now()
  ): Promise<ProcessedResponse<T>> {
    const processingTime = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    this.logger.debug('Processing response', {
      source,
      processingTime,
      responseType: typeof response,
      hasData: !!response,
    });

    try {
      // Extract data from response
      const data = this.extractData(response);

      // Validate response size
      this.validateResponseSize(data);

      // Extract metadata
      const metadata = this.extractMetadata(response, source, timestamp, processingTime);

      // Extract errors
      const errors = this.extractErrors(response);

      // Extract warnings
      const warnings = this.extractWarnings(response);

      // Process pagination if enabled
      if (this.config.enablePagination && this.isPaginatedResponse(response)) {
        const pagination = this.extractPagination(response);
        if (pagination) {
          metadata.pagination = pagination;
        }
      }

      const processedResponse: ProcessedResponse<T> = {
        data,
        metadata,
        errors,
        warnings,
      };

      this.logger.debug('Response processed successfully', {
        source,
        processingTime,
        dataSize: this.getDataSize(data),
        errorCount: errors.length,
        warningCount: warnings.length,
        hasPagination: !!metadata.pagination,
      });

      return processedResponse;
    } catch (error) {
      this.logger.error('Error processing response', {
        source,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return error response
      return {
        data: null as T,
        metadata: {
          timestamp,
          processingTime,
          source,
        },
        errors: [
          {
            type: 'PROCESSING_ERROR',
            severity: 'HIGH',
            message: 'Failed to process response',
            originalMessage: error instanceof Error ? error.message : 'Unknown error',
            retryable: false,
            timestamp,
            context: { source, processingTime },
          },
        ],
        warnings: [],
      };
    }
  }

  private extractData(response: any): any {
    if (!response) {
      return null;
    }

    // Handle different response formats
    if (response.data !== undefined) {
      return response.data;
    }

    if (response.values !== undefined) {
      return response.values;
    }

    if (response.results !== undefined) {
      return response.results;
    }

    if (response.items !== undefined) {
      return response.items;
    }

    // Return the response itself if no standard data field is found
    return response;
  }

  private extractMetadata(
    response: any,
    source: 'bitbucket-cloud' | 'bitbucket-datacenter',
    timestamp: string,
    processingTime: number
  ): ProcessedResponse['metadata'] {
    const metadata: ProcessedResponse['metadata'] = {
      timestamp,
      processingTime,
      source,
    };

    if (!this.config.enableMetadata) {
      return metadata;
    }

    // Extract version information
    if (response.version) {
      metadata.version = response.version;
    }

    // Extract API version from headers or response
    if (response.headers && response.headers['x-api-version']) {
      metadata.version = response.headers['x-api-version'];
    }

    return metadata;
  }

  private extractErrors(response: any): BitbucketError[] {
    if (!this.config.enableErrorCollection) {
      return [];
    }

    const errors: BitbucketError[] = [];

    // Check for error fields in response
    if (response.errors) {
      for (const error of response.errors) {
        errors.push({
          type: 'SERVER_ERROR',
          severity: 'MEDIUM',
          message: error.message || 'API error occurred',
          originalMessage: JSON.stringify(error),
          retryable: false,
          timestamp: new Date().toISOString(),
          context: { error },
        });
      }
    }

    // Check for error field (singular)
    if (response.error) {
      errors.push({
        type: 'SERVER_ERROR',
        severity: 'MEDIUM',
        message: response.error.message || 'API error occurred',
        originalMessage: JSON.stringify(response.error),
        retryable: false,
        timestamp: new Date().toISOString(),
        context: { error: response.error },
      });
    }

    return errors;
  }

  private extractWarnings(response: any): string[] {
    if (!this.config.enableWarningCollection) {
      return [];
    }

    const warnings: string[] = [];

    // Check for warning fields in response
    if (response.warnings) {
      for (const warning of response.warnings) {
        warnings.push(
          typeof warning === 'string' ? warning : warning.message || 'Warning occurred'
        );
      }
    }

    // Check for warning field (singular)
    if (response.warning) {
      warnings.push(
        typeof response.warning === 'string'
          ? response.warning
          : response.warning.message || 'Warning occurred'
      );
    }

    // Check for deprecation warnings in headers
    if (response.headers && response.headers['x-deprecation-warning']) {
      warnings.push(`Deprecation warning: ${response.headers['x-deprecation-warning']}`);
    }

    return warnings;
  }

  private isPaginatedResponse(response: any): boolean {
    return !!(
      response.next ||
      response.previous ||
      response.page ||
      response.size ||
      response.pagelen ||
      response.pageSize ||
      response.totalPages ||
      response.totalElements
    );
  }

  private extractPagination(response: any): ProcessedResponse['metadata']['pagination'] {
    const pagination: ProcessedResponse['metadata']['pagination'] = {
      page: 1,
      size: 0,
      total: 0,
      hasNext: false,
      hasPrevious: false,
    };

    // Extract page information
    if (response.page !== undefined) {
      pagination.page = parseInt(response.page) || 1;
    }

    // Extract size information
    if (response.size !== undefined) {
      pagination.size = parseInt(response.size) || 0;
    } else if (response.pagelen !== undefined) {
      pagination.size = parseInt(response.pagelen) || 0;
    } else if (response.pageSize !== undefined) {
      pagination.size = parseInt(response.pageSize) || 0;
    }

    // Extract total information
    if (response.total !== undefined) {
      pagination.total = parseInt(response.total) || 0;
    } else if (response.totalElements !== undefined) {
      pagination.total = parseInt(response.totalElements) || 0;
    } else if (response.totalPages !== undefined) {
      pagination.total = parseInt(response.totalPages) * pagination.size;
    }

    // Determine if there are more pages
    if (response.next) {
      pagination.hasNext = true;
    } else if (response.totalPages && pagination.page < parseInt(response.totalPages)) {
      pagination.hasNext = true;
    } else if (response.total && pagination.size > 0) {
      pagination.hasNext = pagination.page * pagination.size < pagination.total;
    }

    // Determine if there are previous pages
    if (response.previous) {
      pagination.hasPrevious = true;
    } else if (pagination.page > 1) {
      pagination.hasPrevious = true;
    }

    return pagination;
  }

  private validateResponseSize(data: any): void {
    if (this.config.maxResponseSize <= 0) {
      return;
    }

    const dataSize = this.getDataSize(data);

    if (dataSize > this.config.maxResponseSize) {
      this.logger.warn('Response size exceeds maximum allowed size', {
        dataSize,
        maxSize: this.config.maxResponseSize,
      });

      throw new Error(
        `Response size (${dataSize} bytes) exceeds maximum allowed size (${this.config.maxResponseSize} bytes)`
      );
    }
  }

  private getDataSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      this.logger.warn('Could not calculate data size', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  public setConfig(newConfig: Partial<ResponseProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Response processor config updated', {
      enablePagination: this.config.enablePagination,
      enableMetadata: this.config.enableMetadata,
      maxResponseSize: this.config.maxResponseSize,
    });
  }

  public getConfig(): ResponseProcessorConfig {
    return { ...this.config };
  }

  public getStats(): {
    config: ResponseProcessorConfig;
    capabilities: {
      pagination: boolean;
      metadata: boolean;
      errorCollection: boolean;
      warningCollection: boolean;
    };
  } {
    return {
      config: this.config,
      capabilities: {
        pagination: this.config.enablePagination,
        metadata: this.config.enableMetadata,
        errorCollection: this.config.enableErrorCollection,
        warningCollection: this.config.enableWarningCollection,
      },
    };
  }
}
