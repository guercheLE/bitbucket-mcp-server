import { ResponseProcessor } from '../response-processor';

describe('ResponseProcessor', () => {
  let responseProcessor: ResponseProcessor;

  beforeEach(() => {
    responseProcessor = new ResponseProcessor({
      enablePagination: true,
      enableMetadata: true,
      enableErrorCollection: true,
      enableWarningCollection: true,
      maxResponseSize: 1024 * 1024, // 1MB
      timeout: 30000,
    });
  });

  describe('processResponse', () => {
    it('should process successful response with data', async () => {
      const response = {
        data: { id: '123', name: 'test' },
        headers: { 'x-api-version': '2.0' },
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.data).toEqual({ id: '123', name: 'test' });
      expect(result.metadata.source).toBe('bitbucket-cloud');
      expect(result.metadata.version).toBe('2.0');
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should process response with values field', async () => {
      const response = {
        values: [{ id: '1' }, { id: '2' }],
        next: 'next-page-url',
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-datacenter');

      expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
      expect(result.metadata.pagination).toBeDefined();
      expect(result.metadata.pagination?.hasNext).toBe(true);
    });

    it('should process response with results field', async () => {
      const response = {
        results: [{ id: '1' }, { id: '2' }],
        totalPages: 2,
        page: 1,
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
      expect(result.metadata.pagination).toBeDefined();
      expect(result.metadata.pagination?.page).toBe(1);
    });

    it('should process response with items field', async () => {
      const response = {
        items: [{ id: '1' }, { id: '2' }],
        totalElements: 2,
        pageSize: 10,
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-datacenter');

      expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
      expect(result.metadata.pagination).toBeDefined();
      expect(result.metadata.pagination?.total).toBe(2);
    });

    it('should process response without standard data fields', async () => {
      const response = { id: '123', name: 'test' };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.data).toEqual({ id: '123', name: 'test' });
    });

    it('should process null response', async () => {
      const result = await responseProcessor.processResponse(null, 'bitbucket-cloud');

      expect(result.data).toBeNull();
    });

    it('should extract errors from response', async () => {
      const response = {
        data: { id: '123' },
        errors: [{ message: 'Error 1' }, { message: 'Error 2' }],
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.errors).toHaveLength(2);
      expect(result.errors?.[0]?.message).toContain('Error 1');
      expect(result.errors?.[1]?.message).toContain('Error 2');
    });

    it('should extract single error from response', async () => {
      const response = {
        data: { id: '123' },
        error: { message: 'Single error' },
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.message).toContain('Single error');
    });

    it('should extract warnings from response', async () => {
      const response = {
        data: { id: '123' },
        warnings: ['Warning 1', 'Warning 2'],
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.warnings).toEqual(['Warning 1', 'Warning 2']);
    });

    it('should extract single warning from response', async () => {
      const response = {
        data: { id: '123' },
        warning: 'Single warning',
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.warnings).toEqual(['Single warning']);
    });

    it('should extract deprecation warnings from headers', async () => {
      const response = {
        data: { id: '123' },
        headers: {
          'x-deprecation-warning': 'This API is deprecated',
        },
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.warnings).toContain('Deprecation warning: This API is deprecated');
    });

    it('should process pagination information', async () => {
      const response = {
        data: [{ id: '1' }, { id: '2' }],
        next: 'next-url',
        previous: 'prev-url',
        page: 2,
        size: 10,
        total: 25,
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.metadata.pagination).toEqual({
        page: 2,
        size: 10,
        total: 25,
        hasNext: true,
        hasPrevious: true,
      });
    });

    it('should handle pagination with totalPages', async () => {
      const response = {
        data: [{ id: '1' }, { id: '2' }],
        page: 1,
        size: 10,
        totalPages: 3,
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.metadata.pagination?.total).toBe(30); // 3 pages * 10 size
      expect(result.metadata.pagination?.hasNext).toBe(true);
    });

    it('should handle pagination with totalElements', async () => {
      const response = {
        data: [{ id: '1' }, { id: '2' }],
        page: 1,
        pageSize: 10,
        totalElements: 25,
      };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.metadata.pagination?.total).toBe(25);
      expect(result.metadata.pagination?.size).toBe(10);
    });

    it('should validate response size', async () => {
      const largeResponse = {
        data: 'x'.repeat(2 * 1024 * 1024), // 2MB
      };

      await expect(
        responseProcessor.processResponse(largeResponse, 'bitbucket-cloud')
      ).rejects.toThrow('Response size');
    });

    it('should handle processing errors gracefully', async () => {
      const invalidResponse = {
        get data() {
          throw new Error('Processing error');
        },
      };

      const result = await responseProcessor.processResponse(invalidResponse, 'bitbucket-cloud');

      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.type).toBe('PROCESSING_ERROR');
      expect(result.errors?.[0]?.message).toContain('Failed to process response');
    });

    it('should include processing time in metadata', async () => {
      const response = { data: { id: '123' } };

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.processingTime).toBeLessThan(1000);
    });

    it('should include timestamp in metadata', async () => {
      const response = { data: { id: '123' } };
      const beforeTime = new Date().toISOString();

      const result = await responseProcessor.processResponse(response, 'bitbucket-cloud');

      expect(result.metadata.timestamp).toBeDefined();
      expect(new Date(result.metadata.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime()
      );
    });
  });

  describe('setConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        enablePagination: false,
        enableMetadata: false,
        maxResponseSize: 512 * 1024,
      };

      responseProcessor.setConfig(newConfig);
      const config = responseProcessor.getConfig();

      expect(config.enablePagination).toBe(false);
      expect(config.enableMetadata).toBe(false);
      expect(config.maxResponseSize).toBe(512 * 1024);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = responseProcessor.getConfig();

      expect(config.enablePagination).toBe(true);
      expect(config.enableMetadata).toBe(true);
      expect(config.enableErrorCollection).toBe(true);
      expect(config.enableWarningCollection).toBe(true);
      expect(config.maxResponseSize).toBe(1024 * 1024);
      expect(config.timeout).toBe(30000);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const stats = responseProcessor.getStats();

      expect(stats.config).toBeDefined();
      expect(stats.capabilities.pagination).toBe(true);
      expect(stats.capabilities.metadata).toBe(true);
      expect(stats.capabilities.errorCollection).toBe(true);
      expect(stats.capabilities.warningCollection).toBe(true);
    });
  });
});
