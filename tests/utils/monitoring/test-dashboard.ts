/**
 * Test Health Dashboard
 * 
 * This module provides a web-based dashboard for monitoring test health,
 * performance metrics, and trends in real-time.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { TestHealthMonitor, TestHealthMetrics, FlakyTestInfo, TestTrend } from './test-health-monitor';
import { PerformanceMetricsCollector, PerformanceAlert, PerformanceSnapshot } from './performance-metrics';
import { Logger } from '../../../src/types/logger';
import { createMockLogger } from '../mocks/logger.mock';

export interface DashboardConfig {
  port: number;
  host: string;
  refreshInterval: number; // milliseconds
  maxHistoryDays: number;
}

export interface DashboardData {
  healthMetrics: TestHealthMetrics;
  flakyTests: FlakyTestInfo[];
  trends: TestTrend[];
  performanceAlerts: PerformanceAlert[];
  performanceStats: {
    totalAlerts: number;
    criticalAlerts: number;
    errorAlerts: number;
    warningAlerts: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    averageEventLoopLag: number;
  };
  recentSnapshots: PerformanceSnapshot[];
  timestamp: Date;
}

export class TestDashboard {
  private server: any;
  private config: DashboardConfig;
  private healthMonitor: TestHealthMonitor;
  private performanceCollector: PerformanceMetricsCollector;
  private logger: Logger;
  private isRunning: boolean = false;
  private updateInterval?: NodeJS.Timeout;

  constructor(
    config: Partial<DashboardConfig> = {},
    healthMonitor?: TestHealthMonitor,
    performanceCollector?: PerformanceMetricsCollector,
    logger?: Logger
  ) {
    this.config = {
      port: 3001,
      host: 'localhost',
      refreshInterval: 5000,
      maxHistoryDays: 7,
      ...config
    };

    this.healthMonitor = healthMonitor || new TestHealthMonitor();
    this.performanceCollector = performanceCollector || new PerformanceMetricsCollector();
    this.logger = logger || createMockLogger();
  }

  /**
   * Start the dashboard server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Dashboard is already running');
      return;
    }

    this.server = createServer(this.handleRequest.bind(this));
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, (error: any) => {
        if (error) {
          reject(error);
        } else {
          this.isRunning = true;
          this.logger.info('Test dashboard started', {
            url: `http://${this.config.host}:${this.config.port}`,
            refreshInterval: this.config.refreshInterval
          });

          // Start periodic updates
          this.startPeriodicUpdates();
          resolve();
        }
      });
    });
  }

  /**
   * Stop the dashboard server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Dashboard is not running');
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        this.stopPeriodicUpdates();
        this.logger.info('Test dashboard stopped');
        resolve();
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      switch (pathname) {
        case '/':
          this.serveDashboard(res);
          break;
        case '/api/health':
          this.serveHealthData(res);
          break;
        case '/api/performance':
          this.servePerformanceData(res);
          break;
        case '/api/flaky-tests':
          this.serveFlakyTestsData(res);
          break;
        case '/api/trends':
          this.serveTrendsData(res);
          break;
        case '/api/alerts':
          this.serveAlertsData(res);
          break;
        default:
          this.serve404(res);
      }
    } catch (error) {
      this.logger.error('Error handling request', { pathname, error });
      this.serve500(res, error);
    }
  }

  /**
   * Serve the main dashboard HTML
   */
  private serveDashboard(res: ServerResponse): void {
    const html = this.generateDashboardHTML();
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  /**
   * Serve health metrics data
   */
  private serveHealthData(res: ServerResponse): void {
    const healthMetrics = this.healthMonitor.getHealthMetrics();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthMetrics, null, 2));
  }

  /**
   * Serve performance data
   */
  private servePerformanceData(res: ServerResponse): void {
    const performanceStats = this.performanceCollector.getPerformanceStats();
    const recentSnapshots = this.performanceCollector.getRecentSnapshots(50);
    
    const data = {
      stats: performanceStats,
      snapshots: recentSnapshots
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Serve flaky tests data
   */
  private serveFlakyTestsData(res: ServerResponse): void {
    const flakyTests = this.healthMonitor.getFlakyTests();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(flakyTests, null, 2));
  }

  /**
   * Serve trends data
   */
  private serveTrendsData(res: ServerResponse): void {
    const trends = this.healthMonitor.getTrends(24); // Last 24 hours
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(trends, null, 2));
  }

  /**
   * Serve alerts data
   */
  private serveAlertsData(res: ServerResponse): void {
    const alerts = this.performanceCollector.getAlerts();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alerts, null, 2));
  }

  /**
   * Serve 404 error
   */
  private serve404(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  /**
   * Serve 500 error
   */
  private serve500(res: ServerResponse, error: any): void {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }, null, 2));
  }

  /**
   * Generate dashboard HTML
   */
  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Health Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .alerts-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .alert {
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            border-left: 4px solid;
        }
        .alert-critical { background: #f8d7da; border-color: #dc3545; }
        .alert-error { background: #f8d7da; border-color: #dc3545; }
        .alert-warning { background: #fff3cd; border-color: #ffc107; }
        .refresh-info {
            text-align: center;
            color: #666;
            font-size: 0.9em;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Health Dashboard</h1>
            <p>Real-time monitoring of test execution health and performance</p>
        </div>

        <div class="metrics-grid" id="metricsGrid">
            <!-- Metrics will be populated by JavaScript -->
        </div>

        <div class="chart-container">
            <h3>Test Trends (Last 24 Hours)</h3>
            <canvas id="trendsChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h3>Performance Metrics</h3>
            <canvas id="performanceChart" width="400" height="200"></canvas>
        </div>

        <div class="alerts-container">
            <h3>Recent Alerts</h3>
            <div id="alertsList">
                <!-- Alerts will be populated by JavaScript -->
            </div>
        </div>

        <div class="refresh-info">
            Last updated: <span id="lastUpdated"></span> | Auto-refresh every 5 seconds
        </div>
    </div>

    <script>
        let trendsChart, performanceChart;
        
        async function fetchData(url) {
            const response = await fetch(url);
            return response.json();
        }
        
        async function updateDashboard() {
            try {
                // Fetch all data
                const [healthData, performanceData, flakyTests, trends, alerts] = await Promise.all([
                    fetchData('/api/health'),
                    fetchData('/api/performance'),
                    fetchData('/api/flaky-tests'),
                    fetchData('/api/trends'),
                    fetchData('/api/alerts')
                ]);
                
                // Update metrics
                updateMetrics(healthData, performanceData);
                
                // Update charts
                updateTrendsChart(trends);
                updatePerformanceChart(performanceData.snapshots);
                
                // Update alerts
                updateAlerts(alerts);
                
                // Update timestamp
                document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
                
            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }
        
        function updateMetrics(healthData, performanceData) {
            const metricsGrid = document.getElementById('metricsGrid');
            const passRate = healthData.totalTests > 0 ? (healthData.passedTests / healthData.totalTests * 100).toFixed(1) : 0;
            
            metricsGrid.innerHTML = \`
                <div class="metric-card">
                    <div class="metric-value status-\${passRate > 90 ? 'good' : passRate > 80 ? 'warning' : 'error'}">\${passRate}%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">\${healthData.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-\${healthData.flakyTests === 0 ? 'good' : 'warning'}">\${healthData.flakyTests}</div>
                    <div class="metric-label">Flaky Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">\${(healthData.averageExecutionTime / 1000).toFixed(1)}s</div>
                    <div class="metric-label">Avg Execution Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-\${performanceData.stats.criticalAlerts === 0 ? 'good' : 'error'}">\${performanceData.stats.criticalAlerts}</div>
                    <div class="metric-label">Critical Alerts</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">\${(performanceData.stats.averageMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                    <div class="metric-label">Avg Memory Usage</div>
                </div>
            \`;
        }
        
        function updateTrendsChart(trends) {
            const ctx = document.getElementById('trendsChart').getContext('2d');
            
            if (trendsChart) {
                trendsChart.destroy();
            }
            
            trendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trends.map(t => new Date(t.period).toLocaleTimeString()),
                    datasets: [{
                        label: 'Pass Rate (%)',
                        data: trends.map(t => t.passRate * 100),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.1
                    }, {
                        label: 'Total Tests',
                        data: trends.map(t => t.totalTests),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.1,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        function updatePerformanceChart(snapshots) {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            
            if (performanceChart) {
                performanceChart.destroy();
            }
            
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: snapshots.map(s => new Date(s.timestamp).toLocaleTimeString()),
                    datasets: [{
                        label: 'Memory Usage (MB)',
                        data: snapshots.map(s => s.memoryUsage.heapUsed / 1024 / 1024),
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.1
                    }, {
                        label: 'Event Loop Lag (ms)',
                        data: snapshots.map(s => s.eventLoopLag),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
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
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        function updateAlerts(alerts) {
            const alertsList = document.getElementById('alertsList');
            
            if (alerts.length === 0) {
                alertsList.innerHTML = '<p>No recent alerts</p>';
                return;
            }
            
            alertsList.innerHTML = alerts.slice(0, 10).map(alert => \`
                <div class="alert alert-\${alert.severity}">
                    <strong>\${alert.testName}</strong>: \${alert.message}
                    <br><small>\${new Date(alert.timestamp).toLocaleString()}</small>
                </div>
            \`).join('');
        }
        
        // Initialize dashboard
        updateDashboard();
        
        // Auto-refresh every 5 seconds
        setInterval(updateDashboard, 5000);
    </script>
</body>
</html>
    `;
  }

  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(() => {
      // This could be used to trigger any periodic updates
      // For now, the dashboard updates itself via JavaScript
    }, this.config.refreshInterval);
  }

  /**
   * Stop periodic updates
   */
  private stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Get dashboard URL
   */
  getUrl(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * Check if dashboard is running
   */
  isDashboardRunning(): boolean {
    return this.isRunning;
  }
}

// Global instance for easy access
let globalDashboard: TestDashboard | null = null;

/**
 * Get or create the global test dashboard
 */
export function getTestDashboard(): TestDashboard {
  if (!globalDashboard) {
    globalDashboard = new TestDashboard();
  }
  return globalDashboard;
}

/**
 * Start the test dashboard
 */
export async function startTestDashboard(config?: Partial<DashboardConfig>): Promise<void> {
  const dashboard = new TestDashboard(config);
  await dashboard.start();
  globalDashboard = dashboard;
}

/**
 * Stop the test dashboard
 */
export async function stopTestDashboard(): Promise<void> {
  if (globalDashboard) {
    await globalDashboard.stop();
    globalDashboard = null;
  }
}
