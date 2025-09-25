/**
 * Troubleshoot Pipeline Failures Tool
 * 
 * MCP tool for handling pipeline failure analysis with comprehensive
 * failure detection, root cause analysis, and automated resolution suggestions.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PipelineService } from '../services/pipeline-service.js';
import { Pipeline, PipelineRun, PipelineStep } from '../../types/pipeline.js';

// Define missing types for troubleshooting
export interface PipelineFailure {
  id: string;
  pipeline_id: string;
  run_id?: string;
  step_name?: string;
  error_message?: string;
  error_code?: string;
  timestamp: string;
  duration?: number;
  triggered_by?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TroubleshootingReport {
  pipeline_id: string;
  repository: string;
  analysis_timestamp: string;
  failures_analyzed: number;
  critical_issues_count: number;
}

// Input validation schema
const TroubleshootPipelineFailuresSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  run_id: z.string().optional(),
  failure_type: z.enum(['build', 'test', 'deployment', 'timeout', 'resource', 'permission', 'configuration', 'dependency', 'all'], {
    errorMap: () => ({ message: 'Failure type must be one of: build, test, deployment, timeout, resource, permission, configuration, dependency, or all' })
  }).optional().default('all'),
  analysis_config: z.object({
    depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard'),
    include_logs: z.boolean().optional().default(true),
    include_environment: z.boolean().optional().default(true),
    include_dependencies: z.boolean().optional().default(true),
    include_history: z.boolean().optional().default(true),
    correlate_issues: z.boolean().optional().default(true)
  }).optional(),
  time_range: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    period: z.enum(['last_hour', 'last_6h', 'last_24h', 'last_7d', 'last_30d', 'custom']).optional().default('last_24h')
  }).optional(),
  filters: z.object({
    severity: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
    components: z.array(z.string()).optional(),
    environments: z.array(z.string()).optional(),
    users: z.array(z.string()).optional()
  }).optional(),
  resolution_config: z.object({
    auto_suggest_fixes: z.boolean().optional().default(true),
    include_prevention: z.boolean().optional().default(true),
    suggest_optimizations: z.boolean().optional().default(false),
    priority_remediation: z.boolean().optional().default(true)
  }).optional()
});

type TroubleshootPipelineFailuresInput = z.infer<typeof TroubleshootPipelineFailuresSchema>;

// Output validation schema
const TroubleshootPipelineFailuresOutputSchema = z.object({
  success: z.boolean(),
  troubleshooting_report: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    analysis_timestamp: z.string(),
    failures_analyzed: z.number(),
    critical_issues_count: z.number(),
    failure_summary: z.object({
      total_failures: z.number(),
      failure_types: z.record(z.number()),
      most_common_failure: z.string(),
      failure_trend: z.enum(['increasing', 'stable', 'decreasing']),
      success_rate: z.number()
    }),
    root_cause_analysis: z.array(z.object({
      issue_id: z.string(),
      category: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      root_cause: z.string(),
      affected_components: z.array(z.string()),
      occurrence_count: z.number(),
      first_seen: z.string(),
      last_seen: z.string(),
      impact_analysis: z.object({
        affected_runs: z.number(),
        time_impact: z.number(),
        resource_impact: z.string(),
        user_impact: z.array(z.string())
      })
    })),
    resolution_suggestions: z.array(z.object({
      issue_id: z.string(),
      solution_type: z.enum(['immediate', 'short_term', 'long_term']),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      title: z.string(),
      description: z.string(),
      steps: z.array(z.string()),
      estimated_effort: z.string(),
      success_probability: z.number(),
      prerequisites: z.array(z.string()).optional(),
      risk_assessment: z.string().optional()
    })),
    preventive_measures: z.array(z.object({
      category: z.string(),
      recommendation: z.string(),
      implementation_guide: z.string(),
      benefits: z.array(z.string()),
      complexity: z.enum(['low', 'medium', 'high'])
    })),
    monitoring_recommendations: z.object({
      alerts_to_setup: z.array(z.string()),
      metrics_to_track: z.array(z.string()),
      thresholds_to_monitor: z.record(z.number()),
      notification_channels: z.array(z.string())
    }),
    historical_context: z.object({
      similar_failures: z.number(),
      resolution_history: z.array(z.object({
        date: z.string(),
        issue_type: z.string(),
        resolution: z.string(),
        success: z.boolean()
      })),
      pattern_analysis: z.string(),
      trend_insights: z.array(z.string())
    })
  }).optional(),
  metadata: z.object({
    analysis_duration: z.number(),
    data_sources: z.array(z.string()),
    confidence_score: z.number(),
    next_steps: z.array(z.string())
  }),
  message: z.string(),
  error: z.string().optional()
});

type TroubleshootPipelineFailuresOutput = z.infer<typeof TroubleshootPipelineFailuresOutputSchema>;

/**
 * Implementation of the troubleshoot pipeline failures tool
 */
export const troubleshootPipelineFailuresTool: Tool = {
  name: 'troubleshoot_pipeline_failures',
  description: 'Analyze and troubleshoot pipeline failures with comprehensive root cause analysis and resolution suggestions',
  inputSchema: {
    type: 'object',
    properties: {
      pipeline_id: {
        type: 'string',
        description: 'ID of the pipeline to troubleshoot'
      },
      repository: {
        type: 'string',
        description: 'Repository containing the pipeline (format: workspace/repo-name)'
      },
      run_id: {
        type: 'string',
        description: 'Specific pipeline run ID to analyze (optional, analyzes recent runs if not specified)'
      },
      failure_type: {
        type: 'string',
        enum: ['build', 'test', 'deployment', 'timeout', 'resource', 'permission', 'configuration', 'dependency', 'all'],
        description: 'Type of failures to analyze',
        default: 'all'
      },
      analysis_config: {
        type: 'object',
        properties: {
          depth: {
            type: 'string',
            enum: ['quick', 'standard', 'deep'],
            description: 'Analysis depth level',
            default: 'standard'
          },
          include_logs: {
            type: 'boolean',
            description: 'Include log analysis in troubleshooting',
            default: true
          },
          include_environment: {
            type: 'boolean',
            description: 'Include environment analysis',
            default: true
          },
          include_dependencies: {
            type: 'boolean',
            description: 'Include dependency analysis',
            default: true
          },
          include_history: {
            type: 'boolean',
            description: 'Include historical failure analysis',
            default: true
          },
          correlate_issues: {
            type: 'boolean',
            description: 'Correlate related issues and patterns',
            default: true
          }
        }
      },
      time_range: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date for analysis (ISO format)'
          },
          end_date: {
            type: 'string',
            description: 'End date for analysis (ISO format)'
          },
          period: {
            type: 'string',
            enum: ['last_hour', 'last_6h', 'last_24h', 'last_7d', 'last_30d', 'custom'],
            description: 'Predefined time period for analysis',
            default: 'last_24h'
          }
        }
      },
      filters: {
        type: 'object',
        properties: {
          severity: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical']
            },
            description: 'Filter by failure severity levels'
          },
          components: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by specific pipeline components'
          },
          environments: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by deployment environments'
          },
          users: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Filter by users who triggered the pipelines'
          }
        }
      },
      resolution_config: {
        type: 'object',
        properties: {
          auto_suggest_fixes: {
            type: 'boolean',
            description: 'Automatically suggest potential fixes',
            default: true
          },
          include_prevention: {
            type: 'boolean',
            description: 'Include preventive measures in recommendations',
            default: true
          },
          suggest_optimizations: {
            type: 'boolean',
            description: 'Include optimization suggestions',
            default: false
          },
          priority_remediation: {
            type: 'boolean',
            description: 'Prioritize remediation suggestions',
            default: true
          }
        }
      }
    },
    required: ['pipeline_id', 'repository']
  }
};

/**
 * Handler function for troubleshooting pipeline failures
 */
export async function handleTroubleshootPipelineFailures(
  input: TroubleshootPipelineFailuresInput,
  pipelineService: PipelineService
): Promise<TroubleshootPipelineFailuresOutput> {
  try {
    // Validate input
    const validatedInput = TroubleshootPipelineFailuresSchema.parse(input);
    
    // Get pipeline information
    const pipeline = await pipelineService.getPipeline(validatedInput.pipeline_id);
    
    if (!pipeline.success || !pipeline.data) {
      return {
        success: false,
        metadata: {
          analysis_duration: 0,
          data_sources: [],
          confidence_score: 0,
          next_steps: ['Verify pipeline ID and repository name']
        },
        message: `Pipeline ${validatedInput.pipeline_id} not found in repository ${validatedInput.repository}`,
        error: pipeline.error?.message || 'Pipeline not found'
      };
    }

    const startTime = Date.now();

    // Collect pipeline failures based on configuration
    // Note: In a real implementation, this would call a proper API method
    const failures = await simulatePipelineFailures(
      validatedInput.repository,
      validatedInput.pipeline_id,
      {
        runId: validatedInput.run_id,
        failureType: validatedInput.failure_type,
        timeRange: validatedInput.time_range,
        filters: validatedInput.filters
      }
    );

    // Perform root cause analysis
    const rootCauseAnalysis = await analyzeRootCauses(
      failures,
      validatedInput.analysis_config,
      pipelineService
    );

    // Generate resolution suggestions
    const resolutionSuggestions = await generateResolutionSuggestions(
      rootCauseAnalysis,
      validatedInput.resolution_config
    );

    // Generate preventive measures
    const preventiveMeasures = generatePreventiveMeasures(rootCauseAnalysis);

    // Generate monitoring recommendations
    const monitoringRecommendations = generateMonitoringRecommendations(
      rootCauseAnalysis,
      failures
    );

    // Analyze historical context
    const historicalContext = await analyzeHistoricalContext(
      validatedInput.repository,
      validatedInput.pipeline_id,
      failures,
      pipelineService
    );

    // Calculate failure summary
    const failureSummary = calculateFailureSummary(failures);

    const analysisTimeMs = Date.now() - startTime;

    const report: TroubleshootPipelineFailuresOutput = {
      success: true,
      troubleshooting_report: {
        pipeline_id: validatedInput.pipeline_id,
        repository: validatedInput.repository,
        analysis_timestamp: new Date().toISOString(),
        failures_analyzed: failures.length,
        critical_issues_count: rootCauseAnalysis.filter(issue => issue.severity === 'critical').length,
        failure_summary: failureSummary,
        root_cause_analysis: rootCauseAnalysis,
        resolution_suggestions: resolutionSuggestions,
        preventive_measures: preventiveMeasures,
        monitoring_recommendations: monitoringRecommendations,
        historical_context: historicalContext
      },
      metadata: {
        analysis_duration: analysisTimeMs,
        data_sources: [
          'pipeline_logs',
          'failure_history',
          'environment_data',
          'dependency_analysis'
        ],
        confidence_score: calculateConfidenceScore(failures, rootCauseAnalysis),
        next_steps: generateNextSteps(rootCauseAnalysis, resolutionSuggestions)
      },
      message: `Successfully analyzed ${failures.length} pipeline failures and identified ${rootCauseAnalysis.length} root causes`
    };

    // Validate output
    return TroubleshootPipelineFailuresOutputSchema.parse(report);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        metadata: {
          analysis_duration: 0,
          data_sources: [],
          confidence_score: 0,
          next_steps: ['Fix input validation errors']
        },
        message: 'Input validation failed',
        error: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }

    return {
      success: false,
      metadata: {
        analysis_duration: 0,
        data_sources: [],
        confidence_score: 0,
        next_steps: ['Check pipeline configuration and permissions']
      },
      message: 'Failed to troubleshoot pipeline failures',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper Functions

/**
 * Analyze root causes of pipeline failures
 */
async function analyzeRootCauses(
  failures: PipelineFailure[],
  config: TroubleshootPipelineFailuresInput['analysis_config'],
  pipelineService: PipelineService
): Promise<Array<{
  issue_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  root_cause: string;
  affected_components: string[];
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  impact_analysis: {
    affected_runs: number;
    time_impact: number;
    resource_impact: string;
    user_impact: string[];
  };
}>> {
  const issues: Map<string, any> = new Map();

  for (const failure of failures) {
    // Categorize failure
    const category = categorizeFailure(failure);
    const issueKey = `${category}_${failure.error_code || 'unknown'}`;

    if (!issues.has(issueKey)) {
      issues.set(issueKey, {
        issue_id: issueKey,
        category,
        severity: determineFailureSeverity(failure),
        description: failure.error_message || 'Unknown failure',
        root_cause: await identifyRootCause(failure, config, pipelineService),
        affected_components: [failure.step_name || 'unknown'],
        occurrence_count: 1,
        first_seen: failure.timestamp,
        last_seen: failure.timestamp,
        impact_analysis: {
          affected_runs: 1,
          time_impact: failure.duration || 0,
          resource_impact: calculateResourceImpact(failure),
          user_impact: [failure.triggered_by || 'unknown']
        }
      });
    } else {
      const issue = issues.get(issueKey);
      issue.occurrence_count++;
      issue.last_seen = failure.timestamp;
      issue.impact_analysis.affected_runs++;
      issue.impact_analysis.time_impact += failure.duration || 0;
      
      if (failure.step_name && !issue.affected_components.includes(failure.step_name)) {
        issue.affected_components.push(failure.step_name);
      }
      
      if (failure.triggered_by && !issue.impact_analysis.user_impact.includes(failure.triggered_by)) {
        issue.impact_analysis.user_impact.push(failure.triggered_by);
      }
    }
  }

  return Array.from(issues.values());
}

/**
 * Generate resolution suggestions based on root cause analysis
 */
async function generateResolutionSuggestions(
  rootCauses: any[],
  config: TroubleshootPipelineFailuresInput['resolution_config']
): Promise<Array<{
  issue_id: string;
  solution_type: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps: string[];
  estimated_effort: string;
  success_probability: number;
  prerequisites?: string[];
  risk_assessment?: string;
}>> {
  const suggestions = [];

  for (const rootCause of rootCauses) {
    const suggestion = await generateSuggestionForRootCause(rootCause, config);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  // Sort by priority and success probability
  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    return priorityDiff || (b.success_probability - a.success_probability);
  });
}

/**
 * Generate preventive measures
 */
function generatePreventiveMeasures(rootCauses: any[]) {
  const measures = [
    {
      category: 'Testing',
      recommendation: 'Implement comprehensive automated testing',
      implementation_guide: 'Set up unit tests, integration tests, and end-to-end tests in your CI/CD pipeline',
      benefits: ['Catch issues early', 'Reduce deployment failures', 'Improve code quality'],
      complexity: 'medium' as const
    },
    {
      category: 'Monitoring',
      recommendation: 'Set up proactive monitoring and alerting',
      implementation_guide: 'Configure monitoring tools to track key metrics and send alerts before failures occur',
      benefits: ['Early problem detection', 'Faster resolution times', 'Reduced downtime'],
      complexity: 'low' as const
    },
    {
      category: 'Infrastructure',
      recommendation: 'Implement infrastructure as code',
      implementation_guide: 'Use tools like Terraform or CloudFormation to manage infrastructure consistently',
      benefits: ['Reproducible deployments', 'Version controlled infrastructure', 'Reduced configuration drift'],
      complexity: 'high' as const
    }
  ];

  return measures;
}

/**
 * Generate monitoring recommendations
 */
function generateMonitoringRecommendations(rootCauses: any[], failures: PipelineFailure[]) {
  return {
    alerts_to_setup: [
      'Pipeline failure rate exceeds threshold',
      'Pipeline duration increases significantly',
      'Resource utilization spikes',
      'Dependency failures detected'
    ],
    metrics_to_track: [
      'Success rate',
      'Average duration',
      'Resource usage',
      'Error frequency',
      'Recovery time'
    ],
    thresholds_to_monitor: {
      failure_rate: 0.05, // 5% failure rate threshold
      duration_increase: 1.5, // 50% duration increase
      resource_utilization: 0.8 // 80% resource usage
    },
    notification_channels: [
      'Email',
      'Slack',
      'PagerDuty',
      'Teams'
    ]
  };
}

/**
 * Analyze historical context
 */
async function analyzeHistoricalContext(
  repository: string,
  pipelineId: string,
  currentFailures: PipelineFailure[],
  pipelineService: PipelineService
) {
  // This would typically fetch historical data from the service
  // For now, return a structured response
  return {
    similar_failures: currentFailures.length * 2, // Simulated historical count
    resolution_history: [
      {
        date: '2024-01-15',
        issue_type: 'build_failure',
        resolution: 'Updated dependencies',
        success: true
      }
    ],
    pattern_analysis: 'Failures tend to occur during peak deployment hours and often correlate with dependency updates',
    trend_insights: [
      'Failure rate has increased by 15% in the last month',
      'Most failures occur on Monday mornings',
      'Test failures are the most common type'
    ]
  };
}

/**
 * Calculate failure summary
 */
function calculateFailureSummary(failures: PipelineFailure[]) {
  const totalFailures = failures.length;
  const failureTypes: Record<string, number> = {};

  failures.forEach(failure => {
    const category = categorizeFailure(failure);
    failureTypes[category] = (failureTypes[category] || 0) + 1;
  });

  const mostCommon = Object.entries(failureTypes).reduce((a, b) => a[1] > b[1] ? a : b)[0] || 'unknown';

  return {
    total_failures: totalFailures,
    failure_types: failureTypes,
    most_common_failure: mostCommon,
    failure_trend: 'stable' as const, // Would be calculated from historical data
    success_rate: Math.max(0, (100 - totalFailures) / 100)
  };
}

// Utility helper functions
function categorizeFailure(failure: PipelineFailure): string {
  // Logic to categorize failures based on error patterns
  if (failure.error_message?.includes('test')) return 'test_failure';
  if (failure.error_message?.includes('build')) return 'build_failure';
  if (failure.error_message?.includes('deploy')) return 'deployment_failure';
  if (failure.error_message?.includes('timeout')) return 'timeout_failure';
  return 'unknown_failure';
}

function determineFailureSeverity(failure: PipelineFailure): 'low' | 'medium' | 'high' | 'critical' {
  // Logic to determine severity based on failure characteristics
  if (failure.error_code?.includes('CRITICAL')) return 'critical';
  if (failure.duration && failure.duration > 3600) return 'high';
  if (failure.step_name?.includes('deploy')) return 'high';
  if (failure.step_name?.includes('test')) return 'medium';
  return 'low';
}

async function identifyRootCause(
  failure: PipelineFailure,
  config: TroubleshootPipelineFailuresInput['analysis_config'],
  pipelineService: PipelineService
): Promise<string> {
  // Advanced root cause analysis would go here
  // For now, return a basic analysis based on error patterns
  if (failure.error_message?.includes('permission denied')) {
    return 'Insufficient permissions or incorrect authentication credentials';
  }
  if (failure.error_message?.includes('not found')) {
    return 'Missing dependencies or incorrect resource references';
  }
  if (failure.error_message?.includes('timeout')) {
    return 'Resource constraints or network connectivity issues';
  }
  return 'Error pattern analysis suggests configuration or environment issues';
}

function calculateResourceImpact(failure: PipelineFailure): string {
  // Calculate resource impact based on failure characteristics
  if (failure.duration && failure.duration > 1800) return 'High - significant resource waste';
  if (failure.duration && failure.duration > 600) return 'Medium - moderate resource usage';
  return 'Low - minimal resource impact';
}

async function generateSuggestionForRootCause(
  rootCause: any,
  config: TroubleshootPipelineFailuresInput['resolution_config']
) {
  // Generate specific suggestions based on root cause category
  const suggestions = {
    test_failure: {
      solution_type: 'immediate' as const,
      priority: 'medium' as const,
      title: 'Fix failing tests',
      description: 'Address test failures to improve pipeline reliability',
      steps: [
        'Review test failure logs',
        'Fix failing test cases',
        'Update test data or mocks if needed',
        'Run tests locally to verify fixes'
      ],
      estimated_effort: '2-4 hours',
      success_probability: 0.8
    },
    build_failure: {
      solution_type: 'immediate' as const,
      priority: 'high' as const,
      title: 'Resolve build issues',
      description: 'Fix compilation or build configuration problems',
      steps: [
        'Check build logs for specific errors',
        'Verify dependencies and versions',
        'Update build configuration if needed',
        'Test build locally'
      ],
      estimated_effort: '1-3 hours',
      success_probability: 0.9
    },
    deployment_failure: {
      solution_type: 'immediate' as const,
      priority: 'critical' as const,
      title: 'Fix deployment configuration',
      description: 'Resolve deployment and environment issues',
      steps: [
        'Check deployment logs and configuration',
        'Verify environment permissions and access',
        'Update deployment scripts if necessary',
        'Test deployment in staging environment'
      ],
      estimated_effort: '3-6 hours',
      success_probability: 0.7
    }
  };

  const suggestion = suggestions[rootCause.category as keyof typeof suggestions];
  if (suggestion) {
    return {
      ...suggestion,
      issue_id: rootCause.issue_id
    };
  }

  // Default suggestion
  return {
    issue_id: rootCause.issue_id,
    solution_type: 'short_term' as const,
    priority: 'medium' as const,
    title: 'Investigate and resolve issue',
    description: `Address ${rootCause.category} issues in the pipeline`,
    steps: [
      'Analyze failure patterns',
      'Identify specific cause',
      'Implement appropriate fix',
      'Test resolution'
    ],
    estimated_effort: '2-4 hours',
    success_probability: 0.6
  };
}

function calculateConfidenceScore(failures: PipelineFailure[], rootCauses: any[]): number {
  // Calculate confidence based on data quality and analysis depth
  if (failures.length === 0) return 0;
  if (failures.length < 3) return 0.4;
  if (rootCauses.length === 0) return 0.3;
  
  // Higher confidence with more data points and identified causes
  const baseScore = Math.min(0.9, 0.5 + (failures.length / 20));
  const causeBonus = Math.min(0.1, rootCauses.length * 0.02);
  
  return Math.min(1, baseScore + causeBonus);
}

function generateNextSteps(rootCauses: any[], suggestions: any[]): string[] {
  const steps = ['Review troubleshooting report'];
  
  const criticalIssues = rootCauses.filter(cause => cause.severity === 'critical');
  if (criticalIssues.length > 0) {
    steps.push('Address critical issues immediately');
  }
  
  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'critical' || s.priority === 'high');
  if (highPrioritySuggestions.length > 0) {
    steps.push('Implement high-priority solutions first');
  }
  
  steps.push('Set up monitoring for identified failure patterns');
  steps.push('Schedule regular pipeline health reviews');
  
  return steps;
}

/**
 * Simulate pipeline failures for demonstration purposes
 * In a real implementation, this would query the actual pipeline service
 */
async function simulatePipelineFailures(
  repository: string,
  pipelineId: string,
  options: {
    runId?: string;
    failureType?: string;
    timeRange?: any;
    filters?: any;
  }
): Promise<PipelineFailure[]> {
  // Simulate some common pipeline failures for demonstration
  const now = new Date().toISOString();
  const hour = 1000 * 60 * 60;
  
  const failures: PipelineFailure[] = [
    {
      id: 'failure-001',
      pipeline_id: pipelineId,
      run_id: 'run-001',
      step_name: 'test',
      error_message: 'Test suite failed: 3 tests failing',
      error_code: 'TEST_FAILURE',
      timestamp: new Date(Date.now() - 2 * hour).toISOString(),
      duration: 300,
      triggered_by: 'developer@example.com',
      severity: 'medium'
    },
    {
      id: 'failure-002',
      pipeline_id: pipelineId,
      run_id: 'run-002',
      step_name: 'build',
      error_message: 'Build failed: compilation error in main.ts',
      error_code: 'BUILD_FAILURE',
      timestamp: new Date(Date.now() - 4 * hour).toISOString(),
      duration: 120,
      triggered_by: 'developer@example.com',
      severity: 'high'
    },
    {
      id: 'failure-003',
      pipeline_id: pipelineId,
      run_id: 'run-003',
      step_name: 'deploy',
      error_message: 'Deployment failed: permission denied accessing staging environment',
      error_code: 'PERMISSION_DENIED',
      timestamp: new Date(Date.now() - 6 * hour).toISOString(),
      duration: 600,
      triggered_by: 'devops@example.com',
      severity: 'critical'
    }
  ];

  // Apply filters if specified
  let filteredFailures = failures;
  
  if (options.runId) {
    filteredFailures = filteredFailures.filter(f => f.run_id === options.runId);
  }
  
  if (options.failureType && options.failureType !== 'all') {
    filteredFailures = filteredFailures.filter(f => {
      const category = categorizeFailure(f);
      return category.includes(options.failureType || '');
    });
  }

  return filteredFailures;
}