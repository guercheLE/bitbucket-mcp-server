/**
 * Test Health Alert System
 * 
 * This module provides comprehensive alerting capabilities for test health issues,
 * including email notifications, webhook integrations, and custom alert handlers.
 */

import { Logger } from '../../../src/types/logger';
import { createMockLogger } from '../mocks/logger.mock';
import { TestHealthMetrics, FlakyTestInfo } from './test-health-monitor';
import { PerformanceAlert } from './performance-metrics';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (data: any) => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldownMs: number; // Minimum time between alerts
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  data: any;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'slack' | 'console' | 'file';
  enabled: boolean;
  config: any;
}

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
  to: string[];
  subject: string;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  timeout: number;
}

export interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username: string;
  iconEmoji: string;
}

export interface FileConfig {
  path: string;
  maxSize: number; // bytes
  maxFiles: number;
}

export class AlertSystem {
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private alerts: Alert[] = [];
  private logger: Logger;
  private isRunning: boolean = false;

  constructor(logger?: Logger) {
    this.logger = logger || createMockLogger();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    // Low pass rate rule
    this.addRule({
      id: 'low-pass-rate',
      name: 'Low Test Pass Rate',
      description: 'Test pass rate falls below 90%',
      condition: (data: TestHealthMetrics) => {
        const passRate = data.passedTests / Math.max(data.totalTests, 1);
        return passRate < 0.9;
      },
      severity: 'error',
      enabled: true,
      cooldownMs: 5 * 60 * 1000 // 5 minutes
    });

    // High flakiness rule
    this.addRule({
      id: 'high-flakiness',
      name: 'High Test Flakiness',
      description: 'Number of flaky tests exceeds threshold',
      condition: (data: TestHealthMetrics) => data.flakyTests > 5,
      severity: 'warning',
      enabled: true,
      cooldownMs: 10 * 60 * 1000 // 10 minutes
    });

    // Slow execution rule
    this.addRule({
      id: 'slow-execution',
      name: 'Slow Test Execution',
      description: 'Average test execution time exceeds threshold',
      condition: (data: TestHealthMetrics) => data.averageExecutionTime > 10000, // 10 seconds
      severity: 'warning',
      enabled: true,
      cooldownMs: 15 * 60 * 1000 // 15 minutes
    });

    // High memory usage rule
    this.addRule({
      id: 'high-memory',
      name: 'High Memory Usage',
      description: 'Peak memory usage exceeds threshold',
      condition: (data: TestHealthMetrics) => data.memoryPeak > 500 * 1024 * 1024, // 500MB
      severity: 'error',
      enabled: true,
      cooldownMs: 5 * 60 * 1000 // 5 minutes
    });

    // Critical performance alerts rule
    this.addRule({
      id: 'critical-performance',
      name: 'Critical Performance Issues',
      description: 'Critical performance alerts detected',
      condition: (data: PerformanceAlert[]) => data.some(alert => alert.severity === 'critical'),
      severity: 'critical',
      enabled: true,
      cooldownMs: 2 * 60 * 1000 // 2 minutes
    });
  }

  /**
   * Add an alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info('Added alert rule', { ruleId: rule.id, name: rule.name });
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    if (this.rules.delete(ruleId)) {
      this.logger.info('Removed alert rule', { ruleId });
    }
  }

  /**
   * Add a notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
    this.logger.info('Added notification channel', { channelId: channel.id, type: channel.type });
  }

  /**
   * Remove a notification channel
   */
  removeChannel(channelId: string): void {
    if (this.channels.delete(channelId)) {
      this.logger.info('Removed notification channel', { channelId });
    }
  }

  /**
   * Start the alert system
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Alert system is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Started alert system');
  }

  /**
   * Stop the alert system
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Alert system is not running');
      return;
    }

    this.isRunning = false;
    this.logger.info('Stopped alert system');
  }

  /**
   * Evaluate alert rules against data
   */
  evaluateRules(data: any, dataType: string): void {
    if (!this.isRunning) {
      return;
    }

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) {
        continue;
      }

      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldownMs) {
          continue;
        }
      }

      try {
        if (rule.condition(data)) {
          this.triggerAlert(rule, data, dataType);
          rule.lastTriggered = new Date();
        }
      } catch (error) {
        this.logger.error('Error evaluating alert rule', { ruleId, error });
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, data: any, dataType: string): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, data, dataType),
      timestamp: new Date(),
      data: this.sanitizeData(data),
      resolved: false
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    this.logger.warn('Alert triggered', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: alert.severity,
      title: alert.title
    });

    // Send notifications
    this.sendNotifications(alert);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, data: any, dataType: string): string {
    switch (rule.id) {
      case 'low-pass-rate':
        const passRate = (data.passedTests / Math.max(data.totalTests, 1) * 100).toFixed(1);
        return `Test pass rate is ${passRate}% (${data.passedTests}/${data.totalTests} tests passed). This is below the 90% threshold.`;
      
      case 'high-flakiness':
        return `Found ${data.flakyTests} flaky tests. This exceeds the threshold of 5 flaky tests.`;
      
      case 'slow-execution':
        const avgTime = (data.averageExecutionTime / 1000).toFixed(1);
        return `Average test execution time is ${avgTime}s. This exceeds the threshold of 10s.`;
      
      case 'high-memory':
        const memoryMB = (data.memoryPeak / 1024 / 1024).toFixed(1);
        return `Peak memory usage is ${memoryMB}MB. This exceeds the threshold of 500MB.`;
      
      case 'critical-performance':
        const criticalAlerts = data.filter((alert: PerformanceAlert) => alert.severity === 'critical');
        return `Found ${criticalAlerts.length} critical performance alerts.`;
      
      default:
        return rule.description;
    }
  }

  /**
   * Sanitize data for alert storage
   */
  private sanitizeData(data: any): any {
    // Remove sensitive information and limit size
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove large objects or arrays
    if (Array.isArray(sanitized) && sanitized.length > 100) {
      return sanitized.slice(0, 100);
    }
    
    return sanitized;
  }

  /**
   * Send notifications through all enabled channels
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.channels.values()).filter(channel => channel.enabled);
    
    for (const channel of enabledChannels) {
      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        this.logger.error('Failed to send notification', {
          channelId: channel.id,
          alertId: alert.id,
          error
        });
      }
    }
  }

  /**
   * Send notification through a specific channel
   */
  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'console':
        await this.sendConsoleNotification(alert);
        break;
      case 'file':
        await this.sendFileNotification(channel, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, alert);
        break;
      case 'email':
        await this.sendEmailNotification(channel, alert);
        break;
      default:
        this.logger.warn('Unknown notification channel type', { type: channel.type });
    }
  }

  /**
   * Send console notification
   */
  private async sendConsoleNotification(alert: Alert): Promise<void> {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    };

    console.log(`
${severityEmoji[alert.severity]} ALERT: ${alert.title}
${alert.message}
Time: ${alert.timestamp.toISOString()}
Severity: ${alert.severity.toUpperCase()}
    `);
  }

  /**
   * Send file notification
   */
  private async sendFileNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const config = channel.config as FileConfig;
    const logEntry = {
      timestamp: alert.timestamp.toISOString(),
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      ruleId: alert.ruleId
    };

    try {
      await fs.appendFile(config.path, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      this.logger.error('Failed to write alert to file', { path: config.path, error });
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const config = channel.config as WebhookConfig;
    
    const payload = {
      alert: {
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        ruleId: alert.ruleId
      },
      source: 'test-health-monitor'
    };

    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const config = channel.config as SlackConfig;
    
    const severityColor = {
      info: '#36a64f',
      warning: '#ff9800',
      error: '#f44336',
      critical: '#d32f2f'
    };

    const payload = {
      channel: config.channel,
      username: config.username,
      icon_emoji: config.iconEmoji,
      attachments: [{
        color: severityColor[alert.severity],
        title: alert.title,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Time',
            value: alert.timestamp.toISOString(),
            short: true
          }
        ],
        footer: 'Test Health Monitor',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook request failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const config = channel.config as EmailConfig;
    
    // This is a simplified email implementation
    // In a real implementation, you would use a proper email library like nodemailer
    this.logger.info('Email notification would be sent', {
      to: config.to,
      subject: `${config.subject} - ${alert.title}`,
      severity: alert.severity
    });
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.logger.info('Alert resolved', { alertId, ruleId: alert.ruleId });
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: string): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<string, number>;
  } {
    const total = this.alerts.length;
    const active = this.alerts.filter(a => !a.resolved).length;
    const resolved = this.alerts.filter(a => a.resolved).length;
    
    const bySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, resolved, bySeverity };
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanDays: number = 30): void {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);
    
    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      this.logger.info('Cleared old alerts', { removedCount, olderThanDays });
    }
  }
}

// Global instance for easy access
let globalAlertSystem: AlertSystem | null = null;

/**
 * Get or create the global alert system
 */
export function getAlertSystem(): AlertSystem {
  if (!globalAlertSystem) {
    globalAlertSystem = new AlertSystem();
  }
  return globalAlertSystem;
}

/**
 * Initialize alert system with default configuration
 */
export function initializeAlertSystem(): AlertSystem {
  const alertSystem = getAlertSystem();
  
  // Add default console channel
  alertSystem.addChannel({
    id: 'console',
    name: 'Console Output',
    type: 'console',
    enabled: true,
    config: {}
  });

  // Add default file channel
  alertSystem.addChannel({
    id: 'file',
    name: 'File Log',
    type: 'file',
    enabled: true,
    config: {
      path: './logs/test-alerts.log',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }
  });

  alertSystem.start();
  return alertSystem;
}

/**
 * Evaluate test health data for alerts
 */
export function evaluateTestHealthAlerts(healthMetrics: TestHealthMetrics): void {
  const alertSystem = getAlertSystem();
  alertSystem.evaluateRules(healthMetrics, 'health');
}

/**
 * Evaluate performance alerts
 */
export function evaluatePerformanceAlerts(alerts: PerformanceAlert[]): void {
  const alertSystem = getAlertSystem();
  alertSystem.evaluateRules(alerts, 'performance');
}
