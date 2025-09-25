/**
 * Flaky Test Reporting System
 * 
 * This module provides comprehensive reporting capabilities for flaky tests,
 * including HTML reports, JSON exports, and integration with CI/CD systems.
 */

import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { Logger } from '../../../src/types/logger';
import { createMockLogger } from '../mocks/logger.mock';
import { FlakyTestReport, FlakyTestDetection, FlakyTestRecommendation } from './flaky-test-detector';

export interface ReportConfig {
  outputDir: string;
  formats: ('html' | 'json' | 'csv' | 'markdown')[];
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeTrends: boolean;
  theme: 'light' | 'dark';
  title: string;
  description: string;
}

export interface ReportMetadata {
  generatedAt: Date;
  generatedBy: string;
  version: string;
  config: ReportConfig;
  summary: {
    totalTests: number;
    flakyTests: number;
    flakinessRate: number;
    reportSize: number;
  };
}

export class FlakyTestReporter {
  private config: ReportConfig;
  private logger: Logger;

  constructor(config?: Partial<ReportConfig>, logger?: Logger) {
    this.config = {
      outputDir: './reports',
      formats: ['html', 'json'],
      includeCharts: true,
      includeRecommendations: true,
      includeTrends: true,
      theme: 'light',
      title: 'Flaky Test Report',
      description: 'Comprehensive analysis of flaky tests in the test suite',
      ...config
    };
    this.logger = logger || createMockLogger();
  }

  /**
   * Generate all configured report formats
   */
  async generateReports(report: FlakyTestReport): Promise<ReportMetadata> {
    this.logger.info('Generating flaky test reports', {
      formats: this.config.formats,
      outputDir: this.config.outputDir
    });

    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    const metadata: ReportMetadata = {
      generatedAt: new Date(),
      generatedBy: 'Test Health Monitoring System',
      version: '1.0.0',
      config: this.config,
      summary: {
        totalTests: report.summary.totalTests,
        flakyTests: report.summary.flakyTests,
        flakinessRate: report.summary.flakinessRate,
        reportSize: 0
      }
    };

    // Generate reports in parallel
    const reportPromises = this.config.formats.map(format => {
      switch (format) {
        case 'html':
          return this.generateHtmlReport(report, metadata);
        case 'json':
          return this.generateJsonReport(report, metadata);
        case 'csv':
          return this.generateCsvReport(report, metadata);
        case 'markdown':
          return this.generateMarkdownReport(report, metadata);
        default:
          this.logger.warn('Unknown report format', { format });
          return Promise.resolve();
      }
    });

    await Promise.all(reportPromises);

    // Calculate total report size
    const files = await fs.readdir(this.config.outputDir);
    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(join(this.config.outputDir, file));
      totalSize += stats.size;
    }
    metadata.summary.reportSize = totalSize;

    this.logger.info('Flaky test reports generated successfully', {
      outputDir: this.config.outputDir,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`
    });

    return metadata;
  }

  /**
   * Generate HTML report
   */
  private async generateHtmlReport(report: FlakyTestReport, metadata: ReportMetadata): Promise<void> {
    const html = this.generateHtmlContent(report, metadata);
    const filePath = join(this.config.outputDir, 'flaky-test-report.html');
    
    await fs.writeFile(filePath, html, 'utf8');
    this.logger.info('Generated HTML report', { filePath });
  }

  /**
   * Generate JSON report
   */
  private async generateJsonReport(report: FlakyTestReport, metadata: ReportMetadata): Promise<void> {
    const jsonData = {
      metadata,
      report
    };
    
    const filePath = join(this.config.outputDir, 'flaky-test-report.json');
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    this.logger.info('Generated JSON report', { filePath });
  }

  /**
   * Generate CSV report
   */
  private async generateCsvReport(report: FlakyTestReport, metadata: ReportMetadata): Promise<void> {
    const csv = this.generateCsvContent(report);
    const filePath = join(this.config.outputDir, 'flaky-test-report.csv');
    
    await fs.writeFile(filePath, csv, 'utf8');
    this.logger.info('Generated CSV report', { filePath });
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(report: FlakyTestReport, metadata: ReportMetadata): Promise<void> {
    const markdown = this.generateMarkdownContent(report, metadata);
    const filePath = join(this.config.outputDir, 'flaky-test-report.md');
    
    await fs.writeFile(filePath, markdown, 'utf8');
    this.logger.info('Generated Markdown report', { filePath });
  }

  /**
   * Generate HTML content
   */
  private generateHtmlContent(report: FlakyTestReport, metadata: ReportMetadata): string {
    const theme = this.config.theme;
    const isDark = theme === 'dark';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --bg-color: ${isDark ? '#1a1a1a' : '#ffffff'};
            --text-color: ${isDark ? '#ffffff' : '#333333'};
            --border-color: ${isDark ? '#333333' : '#e0e0e0'};
            --card-bg: ${isDark ? '#2a2a2a' : '#f8f9fa'};
            --primary-color: #007bff;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --danger-color: #dc3545;
            --info-color: #17a2b8;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: var(--card-bg);
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid var(--border-color);
        }
        
        .header h1 {
            color: var(--primary-color);
            margin-bottom: 10px;
        }
        
        .header p {
            color: var(--text-color);
            opacity: 0.8;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            text-align: center;
        }
        
        .summary-card h3 {
            font-size: 2em;
            margin-bottom: 5px;
        }
        
        .summary-card .label {
            color: var(--text-color);
            opacity: 0.7;
            font-size: 0.9em;
        }
        
        .summary-card.success { border-left: 4px solid var(--success-color); }
        .summary-card.warning { border-left: 4px solid var(--warning-color); }
        .summary-card.danger { border-left: 4px solid var(--danger-color); }
        .summary-card.info { border-left: 4px solid var(--info-color); }
        
        .chart-container {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid var(--border-color);
        }
        
        .chart-container h3 {
            margin-bottom: 20px;
            color: var(--text-color);
        }
        
        .flaky-tests-table {
            background: var(--card-bg);
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            margin-bottom: 30px;
        }
        
        .flaky-tests-table h3 {
            padding: 20px;
            margin: 0;
            background: var(--primary-color);
            color: white;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        th {
            background: var(--card-bg);
            font-weight: 600;
        }
        
        tr:hover {
            background: var(--card-bg);
        }
        
        .flakiness-rate {
            font-weight: bold;
        }
        
        .flakiness-rate.high { color: var(--danger-color); }
        .flakiness-rate.medium { color: var(--warning-color); }
        .flakiness-rate.low { color: var(--info-color); }
        
        .recommendations {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            margin-bottom: 30px;
        }
        
        .recommendations h3 {
            margin-bottom: 20px;
            color: var(--text-color);
        }
        
        .recommendation {
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid;
        }
        
        .recommendation.high { border-color: var(--danger-color); background: rgba(220, 53, 69, 0.1); }
        .recommendation.medium { border-color: var(--warning-color); background: rgba(255, 193, 7, 0.1); }
        .recommendation.low { border-color: var(--info-color); background: rgba(23, 162, 184, 0.1); }
        
        .recommendation h4 {
            margin-bottom: 5px;
        }
        
        .recommendation .reason {
            font-style: italic;
            margin-bottom: 10px;
        }
        
        .recommendation .suggestion {
            margin-bottom: 5px;
        }
        
        .recommendation .meta {
            font-size: 0.9em;
            opacity: 0.7;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: var(--text-color);
            opacity: 0.7;
            border-top: 1px solid var(--border-color);
            margin-top: 30px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
            }
            
            table {
                font-size: 0.9em;
            }
            
            th, td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.config.title}</h1>
            <p>${this.config.description}</p>
            <p>Generated on ${metadata.generatedAt.toLocaleString()}</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card info">
                <h3>${report.summary.totalTests}</h3>
                <div class="label">Total Tests</div>
            </div>
            <div class="summary-card ${report.summary.flakyTests > 0 ? 'warning' : 'success'}">
                <h3>${report.summary.flakyTests}</h3>
                <div class="label">Flaky Tests</div>
            </div>
            <div class="summary-card ${report.summary.flakinessRate > 10 ? 'danger' : report.summary.flakinessRate > 5 ? 'warning' : 'success'}">
                <h3>${report.summary.flakinessRate.toFixed(1)}%</h3>
                <div class="label">Flakiness Rate</div>
            </div>
            <div class="summary-card info">
                <h3>${report.summary.averageFlakinessRate.toFixed(1)}%</h3>
                <div class="label">Avg Flakiness</div>
            </div>
        </div>

        ${this.config.includeCharts ? this.generateChartsHtml(report) : ''}

        <div class="flaky-tests-table">
            <h3>Flaky Tests Details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Flakiness Rate</th>
                        <th>Total Runs</th>
                        <th>Failures</th>
                        <th>Pattern</th>
                        <th>Confidence</th>
                        <th>Last Failure</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.flakyTests.map(test => `
                        <tr>
                            <td>${test.testName}</td>
                            <td class="flakiness-rate ${test.flakinessRate > 0.3 ? 'high' : test.flakinessRate > 0.1 ? 'medium' : 'low'}">
                                ${(test.flakinessRate * 100).toFixed(1)}%
                            </td>
                            <td>${test.totalRuns}</td>
                            <td>${test.failureCount}</td>
                            <td>${test.failurePattern}</td>
                            <td>${(test.confidence * 100).toFixed(0)}%</td>
                            <td>${test.lastFailure ? test.lastFailure.toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${this.config.includeRecommendations && report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>Recommendations</h3>
                ${report.recommendations.map(rec => `
                    <div class="recommendation ${rec.priority}">
                        <h4>${rec.testName}</h4>
                        <div class="reason">${rec.reason}</div>
                        <div class="suggestion">${rec.suggestion}</div>
                        <div class="meta">
                            Priority: ${rec.priority.toUpperCase()} | 
                            Type: ${rec.type.toUpperCase()} | 
                            Effort: ${rec.estimatedEffort.toUpperCase()} | 
                            Confidence: ${(rec.confidence * 100).toFixed(0)}%
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${this.config.includeTrends && report.trends.length > 0 ? `
            <div class="chart-container">
                <h3>Flakiness Trends</h3>
                <canvas id="trendsChart" width="400" height="200"></canvas>
            </div>
        ` : ''}

        <div class="footer">
            <p>Report generated by Test Health Monitoring System v${metadata.version}</p>
            <p>Total report size: ${(metadata.summary.reportSize / 1024).toFixed(2)} KB</p>
        </div>
    </div>

    ${this.config.includeCharts ? this.generateChartsScript(report) : ''}
</body>
</html>
    `;
  }

  /**
   * Generate charts HTML
   */
  private generateChartsHtml(report: FlakyTestReport): string {
    return `
        <div class="chart-container">
            <h3>Flakiness Distribution</h3>
            <canvas id="flakinessChart" width="400" height="200"></canvas>
        </div>
    `;
  }

  /**
   * Generate charts JavaScript
   */
  private generateChartsScript(report: FlakyTestReport): string {
    const flakinessRates = report.flakyTests.map(test => test.flakinessRate * 100);
    const testNames = report.flakyTests.map(test => test.testName);
    
    return `
    <script>
        // Flakiness Distribution Chart
        const flakinessCtx = document.getElementById('flakinessChart').getContext('2d');
        new Chart(flakinessCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(testNames)},
                datasets: [{
                    label: 'Flakiness Rate (%)',
                    data: ${JSON.stringify(flakinessRates)},
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        ${this.config.includeTrends && report.trends.length > 0 ? `
        // Trends Chart
        const trendsCtx = document.getElementById('trendsChart').getContext('2d');
        new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(report.trends.map(t => t.period))},
                datasets: [{
                    label: 'Flaky Test Count',
                    data: ${JSON.stringify(report.trends.map(t => t.flakyTestCount))},
                    borderColor: 'rgba(220, 53, 69, 1)',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.1
                }, {
                    label: 'Average Flakiness Rate (%)',
                    data: ${JSON.stringify(report.trends.map(t => t.averageFlakinessRate * 100))},
                    borderColor: 'rgba(255, 193, 7, 1)',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        ` : ''}
    </script>
    `;
  }

  /**
   * Generate CSV content
   */
  private generateCsvContent(report: FlakyTestReport): string {
    const headers = [
      'Test Name',
      'Flakiness Rate (%)',
      'Total Runs',
      'Failure Count',
      'Success Count',
      'Failure Pattern',
      'Confidence (%)',
      'Consecutive Failures',
      'Consecutive Successes',
      'First Failure',
      'Last Failure',
      'Common Errors'
    ];

    const rows = report.flakyTests.map(test => [
      test.testName,
      (test.flakinessRate * 100).toFixed(2),
      test.totalRuns,
      test.failureCount,
      test.successCount,
      test.failurePattern,
      (test.confidence * 100).toFixed(2),
      test.consecutiveFailures,
      test.consecutiveSuccesses,
      test.firstFailure ? test.firstFailure.toISOString() : '',
      test.lastFailure ? test.lastFailure.toISOString() : '',
      test.commonErrors.map(e => `${e.error} (${e.count})`).join('; ')
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Generate Markdown content
   */
  private generateMarkdownContent(report: FlakyTestReport, metadata: ReportMetadata): string {
    return `# ${this.config.title}

${this.config.description}

## Summary

- **Total Tests**: ${report.summary.totalTests}
- **Flaky Tests**: ${report.summary.flakyTests}
- **Flakiness Rate**: ${report.summary.flakinessRate.toFixed(1)}%
- **Average Flakiness Rate**: ${report.summary.averageFlakinessRate.toFixed(1)}%
- **Most Flaky Test**: ${report.summary.mostFlakyTest}
- **Least Flaky Test**: ${report.summary.leastFlakyTest}

## Flaky Tests

${report.flakyTests.length === 0 ? 'No flaky tests detected.' : ''}

${report.flakyTests.map(test => `
### ${test.testName}

- **Flakiness Rate**: ${(test.flakinessRate * 100).toFixed(1)}%
- **Total Runs**: ${test.totalRuns}
- **Failures**: ${test.failureCount}
- **Successes**: ${test.successCount}
- **Failure Pattern**: ${test.failurePattern}
- **Confidence**: ${(test.confidence * 100).toFixed(0)}%
- **Consecutive Failures**: ${test.consecutiveFailures}
- **Consecutive Successes**: ${test.consecutiveSuccesses}
- **Last Failure**: ${test.lastFailure ? test.lastFailure.toLocaleDateString() : 'N/A'}

#### Common Errors
${test.commonErrors.map(error => `- ${error.error} (${error.count} times, ${error.percentage.toFixed(1)}%)`).join('\n')}
`).join('\n')}

## Recommendations

${report.recommendations.length === 0 ? 'No recommendations available.' : ''}

${report.recommendations.map(rec => `
### ${rec.testName} (${rec.priority.toUpperCase()} Priority)

**Reason**: ${rec.reason}

**Suggestion**: ${rec.suggestion}

**Type**: ${rec.type.toUpperCase()} | **Effort**: ${rec.estimatedEffort.toUpperCase()} | **Confidence**: ${(rec.confidence * 100).toFixed(0)}%
`).join('\n')}

## Trends

${report.trends.length === 0 ? 'No trend data available.' : ''}

${report.trends.map(trend => `
### ${trend.period}
- **Flaky Test Count**: ${trend.flakyTestCount}
- **Average Flakiness Rate**: ${(trend.averageFlakinessRate * 100).toFixed(1)}%
- **New Flaky Tests**: ${trend.newFlakyTests}
- **Resolved Flaky Tests**: ${trend.resolvedFlakyTests}
`).join('\n')}

---

*Report generated on ${metadata.generatedAt.toLocaleString()} by ${metadata.generatedBy} v${metadata.version}*
`;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ReportConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Updated flaky test reporter configuration', { config: this.config });
  }
}

// Global instance for easy access
let globalFlakyReporter: FlakyTestReporter | null = null;

/**
 * Get or create the global flaky test reporter
 */
export function getFlakyTestReporter(): FlakyTestReporter {
  if (!globalFlakyReporter) {
    globalFlakyReporter = new FlakyTestReporter();
  }
  return globalFlakyReporter;
}

/**
 * Generate flaky test reports
 */
export async function generateFlakyTestReports(report: FlakyTestReport, config?: Partial<ReportConfig>): Promise<ReportMetadata> {
  const reporter = new FlakyTestReporter(config);
  return reporter.generateReports(report);
}
