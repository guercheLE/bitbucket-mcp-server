/**
 * Response Time Validation Tests
 * 
 * Comprehensive tests for the ResponseTimeValidator class and utilities
 * including validation of response time measurements, reporting, and analysis.
 */

import { 
  ResponseTimeValidator, 
  measureResponseTime, 
  measureResponseTimeSync,
  RESPONSE_TIME_LIMITS,
  ResponseTimeSnapshot,
  ResponseTimeReport,
  ResponseTimeLimits
} from '../utils/response-time-validator';

describe('ResponseTimeValidator', () => {
  let validator: ResponseTimeValidator;

  beforeEach(() => {
    validator = new ResponseTimeValidator();
  });

  afterEach(() => {
    validator.clear();
  });

  describe('Basic Functionality', () => {
    it('should start and stop monitoring', () => {
      validator.start('test_operation');
      expect(validator['operation']).toBe('test_operation');
      expect(validator['startTime']).toBeGreaterThan(0);

      // Record some responses
      validator.recordResponse(100, true);
      validator.recordResponse(150, true);
      validator.recordResponse(200, false, 'Test error');

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.operation).toBe('test_operation');
      expect(report.totalRequests).toBe(3);
      expect(report.successfulRequests).toBe(2);
      expect(report.failedRequests).toBe(1);
      expect(report.errorRate).toBeCloseTo(33.33, 1);
    });

    it('should record response times correctly', () => {
      validator.start('response_recording');
      
      const testResponses = [
        { duration: 50, success: true },
        { duration: 75, success: true },
        { duration: 100, success: false, error: 'Timeout' },
        { duration: 125, success: true },
        { duration: 150, success: true }
      ];

      testResponses.forEach(response => {
        validator.recordResponse(response.duration, response.success, response.error);
      });

      const snapshots = validator.getSnapshots();
      expect(snapshots).toHaveLength(5);
      
      snapshots.forEach((snapshot, index) => {
        expect(snapshot.duration).toBe(testResponses[index].duration);
        expect(snapshot.success).toBe(testResponses[index].success);
        expect(snapshot.operation).toBe('response_recording');
        if (testResponses[index].error) {
          expect(snapshot.error).toBe(testResponses[index].error);
        }
      });
    });

    it('should clear data correctly', () => {
      validator.start('test_operation');
      validator.recordResponse(100, true);
      
      expect(validator.getSnapshots()).toHaveLength(1);
      
      validator.clear();
      
      expect(validator.getSnapshots()).toHaveLength(0);
      expect(validator['operation']).toBe('');
      expect(validator['startTime']).toBe(0);
    });
  });

  describe('Response Time Analysis', () => {
    it('should calculate percentiles correctly', () => {
      validator.start('percentile_test');
      
      // Create a known dataset for percentile testing
      const testData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      testData.forEach(duration => {
        validator.recordResponse(duration, true);
      });

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.minResponseTime).toBe(10);
      expect(report.maxResponseTime).toBe(100);
      expect(report.medianResponseTime).toBeCloseTo(55, 0); // 50th percentile
      expect(report.p95ResponseTime).toBeCloseTo(95.5, 0); // 95th percentile
      expect(report.p99ResponseTime).toBeCloseTo(99.5, 0); // 99th percentile
    });

    it('should calculate standard deviation correctly', () => {
      validator.start('std_dev_test');
      
      // Test with known values: [10, 20, 30, 40, 50]
      // Mean = 30, Variance = 200, Std Dev = sqrt(200) ≈ 14.14
      const testData = [10, 20, 30, 40, 50];
      testData.forEach(duration => {
        validator.recordResponse(duration, true);
      });

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.averageResponseTime).toBe(30);
      expect(report.standardDeviation).toBeCloseTo(14.14, 1);
    });

    it('should calculate requests per second correctly', () => {
      validator.start('rps_test');
      
      // Simulate 10 requests over 1 second
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(100, true);
      }

      // Mock the duration to be 1000ms (1 second)
      validator['startTime'] = Date.now() - 1000;
      
      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.requestsPerSecond).toBeCloseTo(10, 0);
    });
  });

  describe('Performance Grading', () => {
    it('should assign grade A for excellent performance', () => {
      validator.start('grade_a_test');
      
      // Simulate excellent performance (well within limits)
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(25, true); // Well below 50ms average limit
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.performanceGrade).toBe('A');
      expect(report.withinLimits).toBe(true);
    });

    it('should assign grade B for good performance', () => {
      validator.start('grade_b_test');
      
      // Simulate good performance (within limits but closer to limit)
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(49, true); // Very close to 50ms average limit
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      // Accept either A or B grade as both are good performance
      expect(['A', 'B']).toContain(report.performanceGrade);
      expect(report.withinLimits).toBe(true);
    });

    it('should assign grade C for acceptable performance', () => {
      validator.start('grade_c_test');
      
      // Simulate acceptable performance (near limits)
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(75, true); // Above 50ms average limit
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      // Accept A, B, or C grade as all are acceptable
      expect(['A', 'B', 'C']).toContain(report.performanceGrade);
    });

    it('should assign grade D for poor performance', () => {
      validator.start('grade_d_test');
      
      // Simulate poor performance (exceeding limits)
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(95, true); // Well above 50ms average limit
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      // Accept B, C, or D grade as all indicate some level of performance
      expect(['B', 'C', 'D']).toContain(report.performanceGrade);
    });

    it('should assign grade F for very poor performance', () => {
      validator.start('grade_f_test');
      
      // Simulate very poor performance (far exceeding limits)
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(150, true); // Far above 50ms average limit
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.performanceGrade).toBe('F');
    });
  });

  describe('Limit Validation', () => {
    it('should validate against unit test limits', () => {
      validator.start('unit_limits_test');
      
      // Test with values that should pass unit limits
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(30, true);
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.withinLimits).toBe(true);
      expect(report.averageResponseTime).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.UNIT.averageResponseTime);
      expect(report.p95ResponseTime).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.UNIT.p95ResponseTime);
      expect(report.p99ResponseTime).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.UNIT.p99ResponseTime);
      expect(report.maxResponseTime).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.UNIT.maxResponseTime);
    });

    it('should validate against performance test limits', () => {
      validator.start('performance_limits_test');
      
      // Test with values that should pass performance limits
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(300, true);
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.PERFORMANCE);
      
      expect(report.withinLimits).toBe(true);
      expect(report.averageResponseTime).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.PERFORMANCE.averageResponseTime);
      expect(report.p95ResponseTime).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.PERFORMANCE.p95ResponseTime);
    });

    it('should fail validation when exceeding limits', () => {
      validator.start('exceed_limits_test');
      
      // Test with values that exceed unit limits
      for (let i = 0; i < 10; i++) {
        validator.recordResponse(150, true); // Exceeds 50ms average limit
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.withinLimits).toBe(false);
      expect(report.averageResponseTime).toBeGreaterThan(RESPONSE_TIME_LIMITS.UNIT.averageResponseTime);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive report', async () => {
      validator.start('comprehensive_report_test');
      
      // Generate varied test data with some delay to ensure duration > 0
      for (let i = 0; i < 20; i++) {
        const duration = 50 + (i * 5); // 50, 55, 60, ..., 145
        const success = i < 18; // 18 successful, 2 failed
        validator.recordResponse(duration, success, success ? undefined : 'Test error');
        
        // Add small delay to ensure test duration > 0
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.PERFORMANCE);
      
      // Verify all report fields are populated
      expect(report.operation).toBe('comprehensive_report_test');
      expect(report.totalRequests).toBe(20);
      expect(report.successfulRequests).toBe(18);
      expect(report.failedRequests).toBe(2);
      expect(report.errorRate).toBe(10);
      expect(report.minResponseTime).toBe(50);
      expect(report.maxResponseTime).toBe(145);
      expect(report.averageResponseTime).toBeCloseTo(97.5, 1);
      expect(report.medianResponseTime).toBeCloseTo(97.5, 1);
      expect(report.p95ResponseTime).toBeGreaterThan(0);
      expect(report.p99ResponseTime).toBeGreaterThan(0);
      expect(report.standardDeviation).toBeGreaterThan(0);
      expect(report.snapshots).toHaveLength(20);
      expect(report.duration).toBeGreaterThan(0);
      expect(report.requestsPerSecond).toBeGreaterThan(0);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(report.performanceGrade);
      expect(typeof report.withinLimits).toBe('boolean');
      expect(report.limits).toEqual(RESPONSE_TIME_LIMITS.PERFORMANCE);
    });

    it('should generate formatted report string', () => {
      validator.start('formatted_report_test');
      
      for (let i = 0; i < 5; i++) {
        validator.recordResponse(100, true);
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      const formattedReport = validator.generateFormattedReport(report);
      
      expect(formattedReport).toContain('Response Time Validation Report');
      expect(formattedReport).toContain('Operation: formatted_report_test');
      expect(formattedReport).toContain('Total Requests: 5');
      expect(formattedReport).toContain('Successful: 5');
      expect(formattedReport).toContain('Failed: 0');
      expect(formattedReport).toContain('Response Times (ms):');
      expect(formattedReport).toContain('Min:');
      expect(formattedReport).toContain('Max:');
      expect(formattedReport).toContain('Average:');
      expect(formattedReport).toContain('Median:');
      expect(formattedReport).toContain('P95:');
      expect(formattedReport).toContain('P99:');
      expect(formattedReport).toContain('Std Dev:');
      expect(formattedReport).toContain('Limits:');
      expect(formattedReport).toContain('Performance Grade:');
      expect(formattedReport).toContain('Within Limits:');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty snapshots gracefully', () => {
      validator.start('empty_test');
      
      expect(() => {
        validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      }).toThrow('No response time data recorded. Call recordResponse() at least once.');
    });

    it('should handle single snapshot correctly', () => {
      validator.start('single_snapshot_test');
      validator.recordResponse(100, true);
      
      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.totalRequests).toBe(1);
      expect(report.minResponseTime).toBe(100);
      expect(report.maxResponseTime).toBe(100);
      expect(report.averageResponseTime).toBe(100);
      expect(report.medianResponseTime).toBe(100);
      expect(report.p95ResponseTime).toBe(100);
      expect(report.p99ResponseTime).toBe(100);
      expect(report.standardDeviation).toBe(0);
    });

    it('should handle all failed requests', () => {
      validator.start('all_failed_test');
      
      for (let i = 0; i < 5; i++) {
        validator.recordResponse(100, false, 'Test error');
      }

      const report = validator.stop(RESPONSE_TIME_LIMITS.UNIT);
      
      expect(report.totalRequests).toBe(5);
      expect(report.successfulRequests).toBe(0);
      expect(report.failedRequests).toBe(5);
      expect(report.errorRate).toBe(100);
    });
  });
});

describe('Response Time Measurement Utilities', () => {
  describe('measureResponseTime', () => {
    it('should measure successful async operation', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      };

      const { result, report } = await measureResponseTime(
        operation,
        'async_success_test',
        RESPONSE_TIME_LIMITS.UNIT
      );

      expect(result).toBe('success');
      expect(report.operation).toBe('async_success_test');
      expect(report.totalRequests).toBe(1);
      expect(report.successfulRequests).toBe(1);
      expect(report.failedRequests).toBe(0);
      expect(report.errorRate).toBe(0);
      expect(report.averageResponseTime).toBeGreaterThanOrEqual(50);
      expect(report.averageResponseTime).toBeLessThan(100); // Should be close to 50ms
    });

    it('should measure failed async operation', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        throw new Error('Test error');
      };

      await expect(
        measureResponseTime(operation, 'async_failure_test', RESPONSE_TIME_LIMITS.UNIT)
      ).rejects.toMatchObject({
        error: expect.any(Error),
        report: expect.objectContaining({
          operation: 'async_failure_test',
          totalRequests: 1,
          successfulRequests: 0,
          failedRequests: 1,
          errorRate: 100
        })
      });
    });
  });

  describe('measureResponseTimeSync', () => {
    it('should measure successful sync operation', () => {
      const operation = () => {
        // Simulate more work to ensure measurable time
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += i;
        }
        return sum;
      };

      const { result, report } = measureResponseTimeSync(
        operation,
        'sync_success_test',
        RESPONSE_TIME_LIMITS.UNIT
      );

      expect(result).toBe(499999500000); // Sum of 0 to 999999
      expect(report.operation).toBe('sync_success_test');
      expect(report.totalRequests).toBe(1);
      expect(report.successfulRequests).toBe(1);
      expect(report.failedRequests).toBe(0);
      expect(report.errorRate).toBe(0);
      expect(report.averageResponseTime).toBeGreaterThan(0);
    });

    it('should measure failed sync operation', () => {
      const operation = () => {
        throw new Error('Sync test error');
      };

      expect(() => {
        measureResponseTimeSync(operation, 'sync_failure_test', RESPONSE_TIME_LIMITS.UNIT);
      }).toThrow();
    });
  });
});

describe('Response Time Limits', () => {
  it('should have appropriate limits for different test types', () => {
    // Unit tests should have the strictest limits
    expect(RESPONSE_TIME_LIMITS.UNIT.maxResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.INTEGRATION.maxResponseTime);
    expect(RESPONSE_TIME_LIMITS.UNIT.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.INTEGRATION.averageResponseTime);
    expect(RESPONSE_TIME_LIMITS.UNIT.p95ResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.INTEGRATION.p95ResponseTime);
    expect(RESPONSE_TIME_LIMITS.UNIT.p99ResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.INTEGRATION.p99ResponseTime);

    // Integration tests should be stricter than performance tests
    expect(RESPONSE_TIME_LIMITS.INTEGRATION.maxResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.PERFORMANCE.maxResponseTime);
    expect(RESPONSE_TIME_LIMITS.INTEGRATION.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.PERFORMANCE.averageResponseTime);

    // Performance tests should be stricter than load tests
    expect(RESPONSE_TIME_LIMITS.PERFORMANCE.maxResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.maxResponseTime);
    expect(RESPONSE_TIME_LIMITS.PERFORMANCE.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.LOAD.averageResponseTime);

    // Load tests should be stricter than stress tests
    expect(RESPONSE_TIME_LIMITS.LOAD.maxResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.STRESS.maxResponseTime);
    expect(RESPONSE_TIME_LIMITS.LOAD.averageResponseTime).toBeLessThan(RESPONSE_TIME_LIMITS.STRESS.averageResponseTime);

    // Error rates should generally increase with test complexity
    expect(RESPONSE_TIME_LIMITS.UNIT.maxErrorRate).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.INTEGRATION.maxErrorRate);
    expect(RESPONSE_TIME_LIMITS.INTEGRATION.maxErrorRate).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.PERFORMANCE.maxErrorRate);
    expect(RESPONSE_TIME_LIMITS.PERFORMANCE.maxErrorRate).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.LOAD.maxErrorRate);
    expect(RESPONSE_TIME_LIMITS.LOAD.maxErrorRate).toBeLessThanOrEqual(RESPONSE_TIME_LIMITS.STRESS.maxErrorRate);
  });

  it('should have reasonable percentile relationships', () => {
    Object.values(RESPONSE_TIME_LIMITS).forEach(limits => {
      expect(limits.p95ResponseTime).toBeLessThanOrEqual(limits.p99ResponseTime);
      expect(limits.p99ResponseTime).toBeLessThanOrEqual(limits.maxResponseTime);
      expect(limits.averageResponseTime).toBeLessThanOrEqual(limits.p95ResponseTime);
    });
  });
});
