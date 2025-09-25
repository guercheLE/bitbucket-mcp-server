/**
 * Flaky Test Detection and Analysis System
 * 
 * This module provides comprehensive detection, analysis, and reporting
 * capabilities for flaky tests, including trend analysis and recommendations.
 */

import { Logger } from '../../../src/types/logger';
import { createMockLogger } from '../mocks/logger.mock';
import { TestExecutionMetrics } from './test-health-monitor';

export interface FlakyTestDetection {
  testName: string;
  flakinessRate: number;
  totalRuns: number;
  failureCount: number;
  successCount: number;
  firstFailure?: Date;
  lastFailure?: Date;
  firstSuccess?: Date;
  lastSuccess?: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  failurePattern: 'random' | 'clustered' | 'trending' | 'stable';
  commonErrors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
  timePatterns: {
    hourOfDay: Record<number, number>; // failures by hour
    dayOfWeek: Record<number, number>; // failures by day
    recentTrend: 'improving' | 'stable' | 'degrading';
  };
  confidence: number; // 0-1, how confident we are this is flaky
}

export interface FlakyTestReport {
  summary: {
    totalTests: number;
    flakyTests: number;
    flakinessRate: number;
    averageFlakinessRate: number;
    mostFlakyTest: string;
    leastFlakyTest: string;
  };
  flakyTests: FlakyTestDetection[];
  trends: {
    period: string;
    flakyTestCount: number;
    averageFlakinessRate: number;
    newFlakyTests: number;
    resolvedFlakyTests: number;
  }[];
  recommendations: FlakyTestRecommendation[];
  generatedAt: Date;
}

export interface FlakyTestRecommendation {
  testName: string;
  priority: 'high' | 'medium' | 'low';
  type: 'fix' | 'investigate' | 'monitor' | 'disable';
  reason: string;
  suggestion: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface FlakyTestConfig {
  minRuns: number; // Minimum runs to consider for flakiness detection
  flakinessThreshold: number; // 0-1, threshold for considering a test flaky
  confidenceThreshold: number; // 0-1, minimum confidence for recommendations
  timeWindowDays: number; // Days to look back for analysis
  consecutiveFailureThreshold: number; // Consider flaky if this many consecutive failures
  consecutiveSuccessThreshold: number; // Consider stable if this many consecutive successes
}

export class FlakyTestDetector {
  private testExecutions: Map<string, TestExecutionMetrics[]> = new Map();
  private config: FlakyTestConfig;
  private logger: Logger;
  private isAnalyzing: boolean = false;

  constructor(config?: Partial<FlakyTestConfig>, logger?: Logger) {
    this.config = {
      minRuns: 10,
      flakinessThreshold: 0.05, // 5%
      confidenceThreshold: 0.7,
      timeWindowDays: 30,
      consecutiveFailureThreshold: 3,
      consecutiveSuccessThreshold: 10,
      ...config
    };
    this.logger = logger || createMockLogger();
  }

  /**
   * Record test execution for flakiness analysis
   */
  recordTestExecution(metrics: TestExecutionMetrics): void {
    const testName = metrics.testName;
    
    if (!this.testExecutions.has(testName)) {
      this.testExecutions.set(testName, []);
    }
    
    const executions = this.testExecutions.get(testName)!;
    executions.push(metrics);
    
    // Keep only recent executions to prevent memory issues
    const cutoffDate = new Date(Date.now() - this.config.timeWindowDays * 24 * 60 * 60 * 1000);
    const recentExecutions = executions.filter(exec => exec.timestamp >= cutoffDate);
    this.testExecutions.set(testName, recentExecutions);
    
    this.logger.debug('Recorded test execution for flakiness analysis', {
      testName,
      status: metrics.status,
      totalRuns: recentExecutions.length
    });
  }

  /**
   * Detect flaky tests
   */
  detectFlakyTests(): FlakyTestDetection[] {
    const flakyTests: FlakyTestDetection[] = [];
    
    for (const [testName, executions] of this.testExecutions) {
      if (executions.length < this.config.minRuns) {
        continue; // Not enough data
      }
      
      const detection = this.analyzeTestFlakiness(testName, executions);
      
      if (detection.flakinessRate >= this.config.flakinessThreshold) {
        flakyTests.push(detection);
      }
    }
    
    // Sort by flakiness rate (most flaky first)
    flakyTests.sort((a, b) => b.flakinessRate - a.flakinessRate);
    
    this.logger.info('Detected flaky tests', {
      totalTests: this.testExecutions.size,
      flakyTests: flakyTests.length,
      flakinessThreshold: this.config.flakinessThreshold
    });
    
    return flakyTests;
  }

  /**
   * Analyze flakiness for a specific test
   */
  private analyzeTestFlakiness(testName: string, executions: TestExecutionMetrics[]): FlakyTestDetection {
    const sortedExecutions = executions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const failures = sortedExecutions.filter(exec => exec.status === 'failed');
    const successes = sortedExecutions.filter(exec => exec.status === 'passed');
    
    const flakinessRate = failures.length / executions.length;
    
    // Analyze failure patterns
    const failurePattern = this.analyzeFailurePattern(sortedExecutions);
    
    // Analyze consecutive runs
    const consecutiveFailures = this.calculateConsecutiveFailures(sortedExecutions);
    const consecutiveSuccesses = this.calculateConsecutiveSuccesses(sortedExecutions);
    
    // Analyze common errors
    const commonErrors = this.analyzeCommonErrors(failures);
    
    // Analyze time patterns
    const timePatterns = this.analyzeTimePatterns(failures);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(executions, flakinessRate, consecutiveFailures);
    
    return {
      testName,
      flakinessRate,
      totalRuns: executions.length,
      failureCount: failures.length,
      successCount: successes.length,
      firstFailure: failures.length > 0 ? failures[0].timestamp : undefined,
      lastFailure: failures.length > 0 ? failures[failures.length - 1].timestamp : undefined,
      firstSuccess: successes.length > 0 ? successes[0].timestamp : undefined,
      lastSuccess: successes.length > 0 ? successes[successes.length - 1].timestamp : undefined,
      consecutiveFailures,
      consecutiveSuccesses,
      failurePattern,
      commonErrors,
      timePatterns,
      confidence
    };
  }

  /**
   * Analyze failure pattern
   */
  private analyzeFailurePattern(executions: TestExecutionMetrics[]): 'random' | 'clustered' | 'trending' | 'stable' {
    const failures = executions.filter(exec => exec.status === 'failed');
    
    if (failures.length === 0) {
      return 'stable';
    }
    
    // Check for clustering (failures close together in time)
    const failureTimes = failures.map(f => f.timestamp.getTime());
    const timeGaps = [];
    
    for (let i = 1; i < failureTimes.length; i++) {
      timeGaps.push(failureTimes[i] - failureTimes[i - 1]);
    }
    
    const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    const shortGaps = timeGaps.filter(gap => gap < avgGap * 0.5).length;
    
    if (shortGaps > timeGaps.length * 0.6) {
      return 'clustered';
    }
    
    // Check for trending (increasing or decreasing failure rate over time)
    const recentExecutions = executions.slice(-Math.floor(executions.length * 0.3));
    const olderExecutions = executions.slice(0, Math.floor(executions.length * 0.3));
    
    const recentFailureRate = recentExecutions.filter(exec => exec.status === 'failed').length / recentExecutions.length;
    const olderFailureRate = olderExecutions.filter(exec => exec.status === 'failed').length / olderExecutions.length;
    
    if (Math.abs(recentFailureRate - olderFailureRate) > 0.2) {
      return 'trending';
    }
    
    // Check for randomness (failures distributed throughout time)
    const timeSpan = executions[executions.length - 1].timestamp.getTime() - executions[0].timestamp.getTime();
    const failureDistribution = failures.map(f => (f.timestamp.getTime() - executions[0].timestamp.getTime()) / timeSpan);
    
    // Calculate coefficient of variation for failure distribution
    const mean = failureDistribution.reduce((sum, val) => sum + val, 0) / failureDistribution.length;
    const variance = failureDistribution.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / failureDistribution.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    
    if (cv > 0.5) {
      return 'random';
    }
    
    return 'stable';
  }

  /**
   * Calculate consecutive failures
   */
  private calculateConsecutiveFailures(executions: TestExecutionMetrics[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (const exec of executions) {
      if (exec.status === 'failed') {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    
    return maxConsecutive;
  }

  /**
   * Calculate consecutive successes
   */
  private calculateConsecutiveSuccesses(executions: TestExecutionMetrics[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (const exec of executions) {
      if (exec.status === 'passed') {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    
    return maxConsecutive;
  }

  /**
   * Analyze common errors
   */
  private analyzeCommonErrors(failures: TestExecutionMetrics[]): Array<{ error: string; count: number; percentage: number }> {
    const errorCounts = new Map<string, number>();
    
    for (const failure of failures) {
      const error = failure.errorMessage || 'Unknown error';
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    }
    
    const totalFailures = failures.length;
    const commonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({
        error,
        count,
        percentage: (count / totalFailures) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 most common errors
    
    return commonErrors;
  }

  /**
   * Analyze time patterns
   */
  private analyzeTimePatterns(failures: TestExecutionMetrics[]): {
    hourOfDay: Record<number, number>;
    dayOfWeek: Record<number, number>;
    recentTrend: 'improving' | 'stable' | 'degrading';
  } {
    const hourOfDay: Record<number, number> = {};
    const dayOfWeek: Record<number, number> = {};
    
    // Initialize counters
    for (let i = 0; i < 24; i++) hourOfDay[i] = 0;
    for (let i = 0; i < 7; i++) dayOfWeek[i] = 0;
    
    // Count failures by time
    for (const failure of failures) {
      const hour = failure.timestamp.getHours();
      const day = failure.timestamp.getDay();
      
      hourOfDay[hour]++;
      dayOfWeek[day]++;
    }
    
    // Analyze recent trend
    const recentTrend = this.analyzeRecentTrend(failures);
    
    return { hourOfDay, dayOfWeek, recentTrend };
  }

  /**
   * Analyze recent trend
   */
  private analyzeRecentTrend(failures: TestExecutionMetrics[]): 'improving' | 'stable' | 'degrading' {
    if (failures.length < 6) {
      return 'stable';
    }
    
    const sortedFailures = failures.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recent = sortedFailures.slice(-3);
    const older = sortedFailures.slice(-6, -3);
    
    const recentCount = recent.length;
    const olderCount = older.length;
    
    if (recentCount < olderCount * 0.5) {
      return 'improving';
    } else if (recentCount > olderCount * 1.5) {
      return 'degrading';
    } else {
      return 'stable';
    }
  }

  /**
   * Calculate confidence in flakiness detection
   */
  private calculateConfidence(
    executions: TestExecutionMetrics[],
    flakinessRate: number,
    consecutiveFailures: number
  ): number {
    let confidence = 0;
    
    // Base confidence on flakiness rate
    confidence += Math.min(flakinessRate * 2, 0.5);
    
    // Increase confidence with more data
    confidence += Math.min(executions.length / 50, 0.3);
    
    // Increase confidence with consecutive failures
    confidence += Math.min(consecutiveFailures / 10, 0.2);
    
    return Math.min(confidence, 1);
  }

  /**
   * Generate comprehensive flaky test report
   */
  generateReport(): FlakyTestReport {
    const flakyTests = this.detectFlakyTests();
    
    const summary = this.generateSummary(flakyTests);
    const trends = this.generateTrends();
    const recommendations = this.generateRecommendations(flakyTests);
    
    return {
      summary,
      flakyTests,
      trends,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(flakyTests: FlakyTestDetection[]): FlakyTestReport['summary'] {
    const totalTests = this.testExecutions.size;
    const flakyTestCount = flakyTests.length;
    const flakinessRate = totalTests > 0 ? (flakyTestCount / totalTests) * 100 : 0;
    
    const averageFlakinessRate = flakyTests.length > 0
      ? flakyTests.reduce((sum, test) => sum + test.flakinessRate, 0) / flakyTests.length
      : 0;
    
    const mostFlakyTest = flakyTests.length > 0 ? flakyTests[0].testName : 'N/A';
    const leastFlakyTest = flakyTests.length > 0 ? flakyTests[flakyTests.length - 1].testName : 'N/A';
    
    return {
      totalTests,
      flakyTests: flakyTestCount,
      flakinessRate,
      averageFlakinessRate,
      mostFlakyTest,
      leastFlakyTest
    };
  }

  /**
   * Generate trends over time
   */
  private generateTrends(): FlakyTestReport['trends'] {
    const trends = [];
    const days = 7; // Last 7 days
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const dayExecutions = new Map<string, TestExecutionMetrics[]>();
      
      // Collect executions for this day
      for (const [testName, executions] of this.testExecutions) {
        const dayExecs = executions.filter(exec => 
          exec.timestamp >= startOfDay && exec.timestamp < endOfDay
        );
        if (dayExecs.length > 0) {
          dayExecutions.set(testName, dayExecs);
        }
      }
      
      // Analyze flakiness for this day
      const dayFlakyTests = [];
      for (const [testName, executions] of dayExecutions) {
        if (executions.length >= 3) { // Minimum runs for daily analysis
          const detection = this.analyzeTestFlakiness(testName, executions);
          if (detection.flakinessRate >= this.config.flakinessThreshold) {
            dayFlakyTests.push(detection);
          }
        }
      }
      
      const averageFlakinessRate = dayFlakyTests.length > 0
        ? dayFlakyTests.reduce((sum, test) => sum + test.flakinessRate, 0) / dayFlakyTests.length
        : 0;
      
      trends.push({
        period: startOfDay.toISOString().split('T')[0],
        flakyTestCount: dayFlakyTests.length,
        averageFlakinessRate,
        newFlakyTests: 0, // Would need historical data to calculate
        resolvedFlakyTests: 0 // Would need historical data to calculate
      });
    }
    
    return trends;
  }

  /**
   * Generate recommendations for flaky tests
   */
  private generateRecommendations(flakyTests: FlakyTestDetection[]): FlakyTestRecommendation[] {
    const recommendations: FlakyTestRecommendation[] = [];
    
    for (const flakyTest of flakyTests) {
      if (flakyTest.confidence < this.config.confidenceThreshold) {
        continue;
      }
      
      const recommendation = this.generateTestRecommendation(flakyTest);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
    
    return recommendations;
  }

  /**
   * Generate recommendation for a specific flaky test
   */
  private generateTestRecommendation(flakyTest: FlakyTestDetection): FlakyTestRecommendation | null {
    const { testName, flakinessRate, failurePattern, commonErrors, consecutiveFailures } = flakyTest;
    
    // High priority recommendations
    if (flakinessRate > 0.5) {
      return {
        testName,
        priority: 'high',
        type: 'fix',
        reason: `Test has very high flakiness rate (${(flakinessRate * 100).toFixed(1)}%)`,
        suggestion: 'Investigate and fix the root cause immediately. Consider disabling the test if it blocks development.',
        estimatedEffort: 'high',
        confidence: flakyTest.confidence
      };
    }
    
    if (consecutiveFailures >= this.config.consecutiveFailureThreshold) {
      return {
        testName,
        priority: 'high',
        type: 'investigate',
        reason: `Test has ${consecutiveFailures} consecutive failures`,
        suggestion: 'Investigate the recent failures. This might indicate a systematic issue or environment problem.',
        estimatedEffort: 'medium',
        confidence: flakyTest.confidence
      };
    }
    
    // Medium priority recommendations
    if (flakinessRate > 0.2) {
      return {
        testName,
        priority: 'medium',
        type: 'fix',
        reason: `Test has moderate flakiness rate (${(flakinessRate * 100).toFixed(1)}%)`,
        suggestion: 'Investigate common error patterns and improve test stability.',
        estimatedEffort: 'medium',
        confidence: flakyTest.confidence
      };
    }
    
    if (failurePattern === 'clustered') {
      return {
        testName,
        priority: 'medium',
        type: 'investigate',
        reason: 'Test failures are clustered in time',
        suggestion: 'Investigate if failures correlate with specific events, deployments, or environmental changes.',
        estimatedEffort: 'medium',
        confidence: flakyTest.confidence
      };
    }
    
    // Low priority recommendations
    if (flakinessRate > this.config.flakinessThreshold) {
      return {
        testName,
        priority: 'low',
        type: 'monitor',
        reason: `Test shows some flakiness (${(flakinessRate * 100).toFixed(1)}%)`,
        suggestion: 'Monitor the test and investigate if flakiness increases.',
        estimatedEffort: 'low',
        confidence: flakyTest.confidence
      };
    }
    
    return null;
  }

  /**
   * Export flaky test data
   */
  exportData(): {
    config: FlakyTestConfig;
    testExecutions: Record<string, TestExecutionMetrics[]>;
    flakyTests: FlakyTestDetection[];
    report: FlakyTestReport;
  } {
    const testExecutionsObj: Record<string, TestExecutionMetrics[]> = {};
    for (const [testName, executions] of this.testExecutions) {
      testExecutionsObj[testName] = executions;
    }
    
    return {
      config: this.config,
      testExecutions: testExecutionsObj,
      flakyTests: this.detectFlakyTests(),
      report: this.generateReport()
    };
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.testExecutions.clear();
    this.logger.info('Cleared all flaky test detection data');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FlakyTestConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Updated flaky test detection configuration', { config: this.config });
  }
}

// Global instance for easy access
let globalFlakyDetector: FlakyTestDetector | null = null;

/**
 * Get or create the global flaky test detector
 */
export function getFlakyTestDetector(): FlakyTestDetector {
  if (!globalFlakyDetector) {
    globalFlakyDetector = new FlakyTestDetector();
  }
  return globalFlakyDetector;
}

/**
 * Record test execution for flakiness analysis
 */
export function recordTestExecutionForFlakiness(metrics: TestExecutionMetrics): void {
  const detector = getFlakyTestDetector();
  detector.recordTestExecution(metrics);
}

/**
 * Generate flaky test report
 */
export function generateFlakyTestReport(): FlakyTestReport {
  const detector = getFlakyTestDetector();
  return detector.generateReport();
}

/**
 * Get flaky tests
 */
export function getFlakyTests(): FlakyTestDetection[] {
  const detector = getFlakyTestDetector();
  return detector.detectFlakyTests();
}
