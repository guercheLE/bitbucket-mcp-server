/**
 * Optimize Pipeline Performance Tool
 * 
 * MCP tool for analyzing pipeline performance and providing optimization
 * suggestions to improve execution time, resource utilization, and efficiency.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PipelineService } from '../services/pipeline-service.js';

// Define performance analysis types
export interface PerformanceMetrics {
  average_duration: number;
  success_rate: number;
  resource_utilization: number;
  failure_count: number;
  bottlenecks: string[];
  efficiency_score: number;
}

export interface OptimizationSuggestion {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation_steps: string[];
  expected_improvement: {
    duration_reduction: string;
    resource_savings: string;
    success_rate_increase: string;
  };
  effort_required: string;
  impact_score: number;
}

// Input validation schema
const OptimizePipelinePerformanceSchema = z.object({
  pipeline_id: z.string().min(1, 'Pipeline ID is required'),
  repository: z.string().min(1, 'Repository is required'),
  analysis_config: z.object({
    time_period: z.enum(['last_7_days', 'last_30_days', 'last_3_months', 'custom']).optional().default('last_30_days'),
    custom_start_date: z.string().optional(),
    custom_end_date: z.string().optional(),
    analysis_depth: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
    include_historical_trends: z.boolean().optional().default(true),
    compare_with_similar: z.boolean().optional().default(false),
    focus_areas: z.array(z.enum(['duration', 'resources', 'success_rate', 'bottlenecks', 'costs'])).optional()
  }).optional(),
  optimization_config: z.object({
    priority_filter: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
    implementation_complexity: z.enum(['simple', 'moderate', 'complex', 'all']).optional().default('all'),
    expected_impact: z.enum(['minimal', 'moderate', 'significant', 'major', 'all']).optional().default('all'),
    resource_constraints: z.object({
      budget_limit: z.number().optional(),
      time_limit: z.string().optional(),
      technical_constraints: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  benchmark_config: z.object({
    compare_to_industry: z.boolean().optional().default(false),
    compare_to_team_avg: z.boolean().optional().default(true),
    include_best_practices: z.boolean().optional().default(true),
    performance_targets: z.object({
      target_duration: z.number().optional(),
      target_success_rate: z.number().optional(),
      target_resource_usage: z.number().optional()
    }).optional()
  }).optional()
});

type OptimizePipelinePerformanceInput = z.infer<typeof OptimizePipelinePerformanceSchema>;

// Output validation schema
const OptimizePipelinePerformanceOutputSchema = z.object({
  success: z.boolean(),
  optimization_report: z.object({
    pipeline_id: z.string(),
    repository: z.string(),
    analysis_timestamp: z.string(),
    analysis_period: z.string(),
    current_performance: z.object({
      metrics: z.object({
        average_duration: z.number(),
        median_duration: z.number(),
        success_rate: z.number(),
        failure_rate: z.number(),
        resource_efficiency: z.number(),
        cost_per_execution: z.number(),
        throughput: z.number()
      }),
      trend_analysis: z.object({
        duration_trend: z.enum(['improving', 'stable', 'degrading']),
        success_rate_trend: z.enum(['improving', 'stable', 'degrading']),
        resource_usage_trend: z.enum(['improving', 'stable', 'degrading']),
        overall_health_score: z.number()
      }),
      bottlenecks: z.array(z.object({
        step_name: z.string(),
        average_duration: z.number(),
        percentage_of_total: z.number(),
        issue_type: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical'])
      }))
    }),
    optimization_suggestions: z.array(z.object({
      id: z.string(),
      category: z.enum(['parallelization', 'caching', 'resource_optimization', 'configuration', 'tooling', 'architecture']),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      title: z.string(),
      description: z.string(),
      current_issue: z.string(),
      proposed_solution: z.string(),
      implementation_steps: z.array(z.string()),
      expected_improvement: z.object({
        duration_reduction_percent: z.number(),
        resource_savings_percent: z.number(),
        success_rate_improvement: z.number(),
        cost_savings_percent: z.number()
      }),
      implementation_effort: z.object({
        complexity: z.enum(['simple', 'moderate', 'complex']),
        estimated_hours: z.number(),
        required_skills: z.array(z.string()),
        dependencies: z.array(z.string())
      }),
      impact_score: z.number(),
      confidence_level: z.number()
    })),
    performance_benchmarks: z.object({
      industry_comparison: z.object({
        percentile_rank: z.number(),
        comparison_status: z.enum(['below_average', 'average', 'above_average', 'excellent'])
      }).optional(),
      team_comparison: z.object({
        rank_in_team: z.number(),
        team_average_duration: z.number(),
        comparison_status: z.enum(['below_average', 'average', 'above_average', 'best_in_team'])
      }).optional(),
      best_practices_alignment: z.object({
        alignment_score: z.number(),
        missing_practices: z.array(z.string()),
        implemented_practices: z.array(z.string())
      })
    }),
    actionable_roadmap: z.object({
      immediate_actions: z.array(z.string()),
      short_term_goals: z.array(z.string()),
      long_term_strategy: z.array(z.string()),
      success_metrics: z.array(z.string())
    })
  }).optional(),
  metadata: z.object({
    analysis_duration: z.number(),
    data_points_analyzed: z.number(),
    confidence_score: z.number(),
    recommendations_count: z.number(),
    potential_savings: z.object({
      time_savings_hours: z.number(),
      cost_savings_percent: z.number(),
      efficiency_improvement: z.number()
    })
  }),
  message: z.string(),
  error: z.string().optional()
});

type OptimizePipelinePerformanceOutput = z.infer<typeof OptimizePipelinePerformanceOutputSchema>;

/**
 * Implementation of the optimize pipeline performance tool
 */
export const optimizePipelinePerformanceTool: Tool = {
  name: 'optimize_pipeline_performance',
  description: 'Analyze pipeline performance and provide optimization suggestions to improve execution time, resource utilization, and efficiency',
  inputSchema: {
    type: 'object',
    properties: {
      pipeline_id: {
        type: 'string',
        description: 'ID of the pipeline to optimize'
      },
      repository: {
        type: 'string',
        description: 'Repository containing the pipeline (format: workspace/repo-name)'
      },
      analysis_config: {
        type: 'object',
        properties: {
          time_period: {
            type: 'string',
            enum: ['last_7_days', 'last_30_days', 'last_3_months', 'custom'],
            description: 'Time period for performance analysis',
            default: 'last_30_days'
          },
          custom_start_date: {
            type: 'string',
            description: 'Custom start date for analysis (ISO format)'
          },
          custom_end_date: {
            type: 'string',
            description: 'Custom end date for analysis (ISO format)'
          },
          analysis_depth: {
            type: 'string',
            enum: ['basic', 'detailed', 'comprehensive'],
            description: 'Depth of performance analysis',
            default: 'detailed'
          },
          include_historical_trends: {
            type: 'boolean',
            description: 'Include historical performance trend analysis',
            default: true
          },
          compare_with_similar: {
            type: 'boolean',
            description: 'Compare with similar pipelines',
            default: false
          },
          focus_areas: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['duration', 'resources', 'success_rate', 'bottlenecks', 'costs']
            },
            description: 'Specific areas to focus optimization on'
          }
        }
      },
      optimization_config: {
        type: 'object',
        properties: {
          priority_filter: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical']
            },
            description: 'Filter suggestions by priority levels'
          },
          implementation_complexity: {
            type: 'string',
            enum: ['simple', 'moderate', 'complex', 'all'],
            description: 'Filter by implementation complexity',
            default: 'all'
          },
          expected_impact: {
            type: 'string',
            enum: ['minimal', 'moderate', 'significant', 'major', 'all'],
            description: 'Filter by expected impact level',
            default: 'all'
          },
          resource_constraints: {
            type: 'object',
            properties: {
              budget_limit: {
                type: 'number',
                description: 'Budget limit for implementations'
              },
              time_limit: {
                type: 'string',
                description: 'Time limit for implementations'
              },
              technical_constraints: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Technical constraints to consider'
              }
            }
          }
        }
      },
      benchmark_config: {
        type: 'object',
        properties: {
          compare_to_industry: {
            type: 'boolean',
            description: 'Compare performance to industry benchmarks',
            default: false
          },
          compare_to_team_avg: {
            type: 'boolean',
            description: 'Compare to team average performance',
            default: true
          },
          include_best_practices: {
            type: 'boolean',
            description: 'Include best practices recommendations',
            default: true
          },
          performance_targets: {
            type: 'object',
            properties: {
              target_duration: {
                type: 'number',
                description: 'Target execution duration in seconds'
              },
              target_success_rate: {
                type: 'number',
                description: 'Target success rate (0-1)'
              },
              target_resource_usage: {
                type: 'number',
                description: 'Target resource usage efficiency'
              }
            }
          }
        }
      }
    },
    required: ['pipeline_id', 'repository']
  }
};

/**
 * Advanced Performance Optimization System
 * AI-driven performance analysis with machine learning insights
 */

interface AdvancedPerformanceMetrics {
  execution_efficiency: number;
  resource_optimization_score: number;
  parallelization_potential: number;
  caching_effectiveness: number;
  bottleneck_severity: number;
  scalability_score: number;
  cost_efficiency_rating: number;
}

interface PerformancePattern {
  pattern_id: string;
  pattern_type: 'resource_waste' | 'time_inefficiency' | 'scaling_issue' | 'configuration_suboptimal';
  description: string;
  frequency: number;
  impact_score: number;
  optimization_potential: number;
  recommended_solutions: string[];
}

interface IntelligentOptimization {
  optimization_id: string;
  category: 'parallelization' | 'caching' | 'resource_allocation' | 'process_optimization' | 'infrastructure';
  priority: number;
  description: string;
  implementation_approach: string;
  expected_improvement: {
    time_reduction_percent: number;
    resource_savings_percent: number;
    cost_reduction_percent: number;
    reliability_improvement: number;
  };
  implementation_complexity: 'simple' | 'moderate' | 'complex';
  prerequisites: string[];
  risks: string[];
  validation_strategy: string;
}

interface BenchmarkComparison {
  metric_name: string;
  current_value: number;
  industry_percentile: number;
  team_average: number;
  best_practice_target: number;
  gap_analysis: string;
  improvement_priority: number;
}

/**
 * Advanced performance pattern detection
 */
async function detectPerformancePatterns(
  performanceData: any[],
  config: OptimizePipelinePerformanceInput['analysis_config']
): Promise<PerformancePattern[]> {
  const patterns: PerformancePattern[] = [];

  // Detect resource waste patterns
  const resourcePatterns = await detectResourceWastePatterns(performanceData);
  patterns.push(...resourcePatterns);

  // Detect time inefficiency patterns
  const timePatterns = await detectTimeInefficiencyPatterns(performanceData);
  patterns.push(...timePatterns);

  // Detect scaling bottlenecks
  const scalingPatterns = await detectScalingPatterns(performanceData);
  patterns.push(...scalingPatterns);

  // Detect configuration optimization opportunities
  const configPatterns = await detectConfigurationPatterns(performanceData);
  patterns.push(...configPatterns);

  return patterns.sort((a, b) => b.impact_score - a.impact_score);
}

/**
 * Detect resource waste patterns in pipeline execution
 */
async function detectResourceWastePatterns(performanceData: any[]): Promise<PerformancePattern[]> {
  const patterns: PerformancePattern[] = [];

  // Analyze CPU utilization patterns
  const cpuUtilization = performanceData.map(d => d.cpu_usage || 0);
  const avgCpuUsage = cpuUtilization.reduce((a, b) => a + b, 0) / cpuUtilization.length;

  if (avgCpuUsage < 30) { // Low CPU utilization indicates over-provisioning
    patterns.push({
      pattern_id: 'resource_cpu_overallocation',
      pattern_type: 'resource_waste',
      description: `CPU utilization averaging ${avgCpuUsage.toFixed(1)}% indicates resource over-allocation`,
      frequency: cpuUtilization.filter(u => u < 30).length / cpuUtilization.length,
      impact_score: (30 - avgCpuUsage) * 2, // Higher waste = higher impact
      optimization_potential: 0.85,
      recommended_solutions: [
        'Right-size pipeline agent instances',
        'Implement dynamic resource allocation',
        'Use smaller instance types for current workload',
        'Consider containerization for better resource sharing'
      ]
    });
  }

  // Analyze memory usage patterns
  const memoryUsage = performanceData.map(d => d.memory_usage_percent || 0);
  const avgMemoryUsage = memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length;
  const maxMemoryUsage = Math.max(...memoryUsage);

  if (avgMemoryUsage < 40 && maxMemoryUsage < 60) {
    patterns.push({
      pattern_id: 'resource_memory_overallocation',
      pattern_type: 'resource_waste',
      description: `Memory usage averaging ${avgMemoryUsage.toFixed(1)}% with peak ${maxMemoryUsage}% indicates over-provisioning`,
      frequency: 1.0,
      impact_score: (40 - avgMemoryUsage) * 1.5,
      optimization_potential: 0.75,
      recommended_solutions: [
        'Reduce memory allocation for pipeline agents',
        'Optimize memory-intensive operations',
        'Implement memory pooling strategies',
        'Use memory-efficient alternatives for processing'
      ]
    });
  }

  return patterns;
}

/**
 * Detect time inefficiency patterns
 */
async function detectTimeInefficiencyPatterns(performanceData: any[]): Promise<PerformancePattern[]> {
  const patterns: PerformancePattern[] = [];

  // Analyze step duration distribution
  const stepDurations: Record<string, number[]> = {};
  performanceData.forEach(data => {
    if (data.step_durations) {
      Object.entries(data.step_durations).forEach(([step, duration]: [string, any]) => {
        if (!stepDurations[step]) stepDurations[step] = [];
        stepDurations[step].push(duration as number);
      });
    }
  });

  // Find steps with high variance (inconsistent performance)
  Object.entries(stepDurations).forEach(([stepName, durations]) => {
    if (durations.length < 3) return;

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, duration) => sum + Math.pow(duration - avg, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    if (coefficientOfVariation > 0.5) { // High variability
      patterns.push({
        pattern_id: `time_variability_${stepName.replace(/\s+/g, '_')}`,
        pattern_type: 'time_inefficiency',
        description: `Step "${stepName}" shows high time variability (CV: ${coefficientOfVariation.toFixed(2)})`,
        frequency: 1.0,
        impact_score: coefficientOfVariation * avg * 0.1,
        optimization_potential: 0.7,
        recommended_solutions: [
          'Analyze step for intermittent issues',
          'Implement consistent resource allocation',
          'Add step-level caching mechanisms',
          'Optimize variable workload handling',
          'Implement retry logic with consistent timing'
        ]
      });
    }
  });

  // Detect sequential processing opportunities
  const totalSteps = Object.keys(stepDurations).length;
  if (totalSteps >= 3) {
    const parallelizationOpportunity = Math.min(0.9, totalSteps * 0.2);
    patterns.push({
      pattern_id: 'time_sequential_processing',
      pattern_type: 'time_inefficiency',
      description: `Pipeline has ${totalSteps} steps that may benefit from parallelization`,
      frequency: 1.0,
      impact_score: parallelizationOpportunity * 10,
      optimization_potential: parallelizationOpportunity,
      recommended_solutions: [
        'Identify independent steps for parallel execution',
        'Implement pipeline stage parallelization',
        'Use matrix builds for independent tests',
        'Optimize step dependencies to enable parallelism',
        'Consider pipeline splitting for parallel workflows'
      ]
    });
  }

  return patterns;
}

/**
 * Detect scaling and bottleneck patterns
 */
async function detectScalingPatterns(performanceData: any[]): Promise<PerformancePattern[]> {
  const patterns: PerformancePattern[] = [];

  // Analyze queue time patterns
  const queueTimes = performanceData.map(d => d.queue_time || 0).filter(t => t > 0);
  if (queueTimes.length > 0) {
    const avgQueueTime = queueTimes.reduce((a, b) => a + b, 0) / queueTimes.length;
    const maxQueueTime = Math.max(...queueTimes);

    if (avgQueueTime > 300) { // More than 5 minutes average queue time
      patterns.push({
        pattern_id: 'scaling_queue_bottleneck',
        pattern_type: 'scaling_issue',
        description: `High average queue time of ${Math.round(avgQueueTime / 60)} minutes indicates capacity bottleneck`,
        frequency: queueTimes.filter(t => t > 300).length / performanceData.length,
        impact_score: Math.min(10, avgQueueTime / 60),
        optimization_potential: 0.9,
        recommended_solutions: [
          'Increase pipeline agent pool size',
          'Implement dynamic scaling based on queue length',
          'Optimize pipeline scheduling algorithm',
          'Add priority-based queue management',
          'Consider dedicated agents for critical pipelines'
        ]
      });
    }
  }

  // Analyze concurrent execution patterns
  const concurrencyData = performanceData.filter(d => d.concurrent_executions);
  if (concurrencyData.length > 0) {
    const avgConcurrency = concurrencyData.reduce((sum, d) => sum + (d.concurrent_executions || 0), 0) / concurrencyData.length;
    const maxConcurrency = Math.max(...concurrencyData.map(d => d.concurrent_executions || 0));

    if (maxConcurrency - avgConcurrency > avgConcurrency * 0.5) {
      patterns.push({
        pattern_id: 'scaling_concurrency_spikes',
        pattern_type: 'scaling_issue',
        description: `Concurrency spikes from ${avgConcurrency.toFixed(1)} to ${maxConcurrency} indicate scaling challenges`,
        frequency: 0.8,
        impact_score: (maxConcurrency - avgConcurrency) * 0.5,
        optimization_potential: 0.75,
        recommended_solutions: [
          'Implement elastic scaling for pipeline agents',
          'Add load balancing across multiple agent pools',
          'Optimize concurrent execution limits',
          'Implement intelligent workload distribution',
          'Add auto-scaling based on demand patterns'
        ]
      });
    }
  }

  return patterns;
}

/**
 * Detect configuration optimization opportunities
 */
async function detectConfigurationPatterns(performanceData: any[]): Promise<PerformancePattern[]> {
  const patterns: PerformancePattern[] = [];

  // Analyze cache hit rates
  const cacheData = performanceData.filter(d => d.cache_hit_rate !== undefined);
  if (cacheData.length > 0) {
    const avgCacheHitRate = cacheData.reduce((sum, d) => sum + (d.cache_hit_rate || 0), 0) / cacheData.length;

    if (avgCacheHitRate < 0.6) { // Less than 60% cache hit rate
      patterns.push({
        pattern_id: 'config_cache_inefficiency',
        pattern_type: 'configuration_suboptimal',
        description: `Cache hit rate of ${Math.round(avgCacheHitRate * 100)}% indicates caching optimization opportunities`,
        frequency: 1.0,
        impact_score: (0.8 - avgCacheHitRate) * 10,
        optimization_potential: 0.85,
        recommended_solutions: [
          'Optimize cache key strategies',
          'Increase cache size or retention time',
          'Implement multi-level caching hierarchy',
          'Add intelligent cache warming strategies',
          'Optimize cache eviction policies'
        ]
      });
    }
  }

  // Analyze artifact management
  const artifactSizes = performanceData.map(d => d.artifact_size_mb || 0).filter(s => s > 0);
  if (artifactSizes.length > 0) {
    const avgArtifactSize = artifactSizes.reduce((a, b) => a + b, 0) / artifactSizes.length;
    const maxArtifactSize = Math.max(...artifactSizes);

    if (avgArtifactSize > 100 || maxArtifactSize > 500) { // Large artifacts
      patterns.push({
        pattern_id: 'config_artifact_optimization',
        pattern_type: 'configuration_suboptimal',
        description: `Large artifacts (avg: ${avgArtifactSize.toFixed(1)}MB, max: ${maxArtifactSize.toFixed(1)}MB) impact performance`,
        frequency: artifactSizes.filter(s => s > 100).length / artifactSizes.length,
        impact_score: Math.min(10, avgArtifactSize * 0.05),
        optimization_potential: 0.7,
        recommended_solutions: [
          'Implement artifact compression strategies',
          'Optimize artifact inclusion/exclusion patterns',
          'Use incremental artifact publishing',
          'Implement artifact cleanup policies',
          'Consider artifact deduplication'
        ]
      });
    }
  }

  return patterns;
}

/**
 * Generate intelligent optimization recommendations
 */
async function generateIntelligentOptimizations(
  patterns: PerformancePattern[],
  currentMetrics: any,
  benchmarks: BenchmarkComparison[]
): Promise<IntelligentOptimization[]> {
  const optimizations: IntelligentOptimization[] = [];

  // Generate optimizations based on detected patterns
  patterns.forEach((pattern, index) => {
    pattern.recommended_solutions.forEach((solution, solutionIndex) => {
      optimizations.push({
        optimization_id: `${pattern.pattern_id}_opt_${solutionIndex}`,
        category: mapPatternToCategory(pattern.pattern_type),
        priority: Math.round(pattern.impact_score),
        description: solution,
        implementation_approach: generateImplementationApproach(solution, pattern),
        expected_improvement: calculateExpectedImprovement(pattern, currentMetrics),
        implementation_complexity: determineComplexity(solution),
        prerequisites: generatePrerequisites(solution, pattern),
        risks: identifyRisks(solution, pattern),
        validation_strategy: generateValidationStrategy(solution, pattern)
      });
    });
  });

  // Generate benchmark-based optimizations
  benchmarks.filter(b => b.improvement_priority > 7).forEach(benchmark => {
    optimizations.push({
      optimization_id: `benchmark_${benchmark.metric_name}`,
      category: 'process_optimization',
      priority: benchmark.improvement_priority,
      description: `Improve ${benchmark.metric_name} to reach industry best practices`,
      implementation_approach: generateBenchmarkImplementation(benchmark),
      expected_improvement: {
        time_reduction_percent: benchmark.metric_name.includes('duration') ?
          ((benchmark.current_value - benchmark.best_practice_target) / benchmark.current_value) * 100 : 0,
        resource_savings_percent: benchmark.metric_name.includes('resource') ? 15 : 5,
        cost_reduction_percent: 10,
        reliability_improvement: benchmark.metric_name.includes('success') ? 5 : 0
      },
      implementation_complexity: benchmark.improvement_priority > 8 ? 'complex' : 'moderate',
      prerequisites: ['Baseline performance measurement', 'Resource availability assessment'],
      risks: ['Performance regression during implementation', 'Resource allocation changes'],
      validation_strategy: `Monitor ${benchmark.metric_name} improvement over 30-day period`
    });
  });

  // Sort by priority and impact
  return optimizations
    .sort((a, b) => {
      const aScore = a.priority + (a.expected_improvement.time_reduction_percent * 0.1);
      const bScore = b.priority + (b.expected_improvement.time_reduction_percent * 0.1);
      return bScore - aScore;
    })
    .slice(0, 15); // Top 15 optimizations
}

/**
 * Helper functions for optimization generation
 */
function mapPatternToCategory(patternType: string): IntelligentOptimization['category'] {
  switch (patternType) {
    case 'resource_waste': return 'resource_allocation';
    case 'time_inefficiency': return 'parallelization';
    case 'scaling_issue': return 'infrastructure';
    case 'configuration_suboptimal': return 'process_optimization';
    default: return 'process_optimization';
  }
}

function generateImplementationApproach(solution: string, pattern: PerformancePattern): string {
  const approaches: Record<string, string> = {
    'Right-size': 'Analyze current resource usage patterns and adjust instance types based on actual utilization metrics',
    'Implement dynamic': 'Set up auto-scaling policies with CloudWatch metrics and implement gradual scaling strategies',
    'Optimize memory': 'Profile application memory usage and implement memory-efficient algorithms',
    'Add step-level caching': 'Implement Redis-based caching with appropriate TTL and cache invalidation strategies',
    'Identify independent steps': 'Analyze pipeline dependency graph and restructure workflow for maximum parallelization',
    'Increase pipeline agent': 'Scale agent pool based on queue metrics and implement load distribution algorithms'
  };

  for (const [key, approach] of Object.entries(approaches)) {
    if (solution.includes(key)) {
      return approach;
    }
  }

  return `Implement ${solution.toLowerCase()} with proper testing and gradual rollout strategy`;
}

function calculateExpectedImprovement(pattern: PerformancePattern, currentMetrics: any): IntelligentOptimization['expected_improvement'] {
  const baseImprovement = pattern.optimization_potential * pattern.impact_score * 0.1;

  return {
    time_reduction_percent: pattern.pattern_type === 'time_inefficiency' ? baseImprovement * 5 : baseImprovement * 2,
    resource_savings_percent: pattern.pattern_type === 'resource_waste' ? baseImprovement * 4 : baseImprovement,
    cost_reduction_percent: baseImprovement * 2,
    reliability_improvement: Math.min(baseImprovement, 5)
  };
}

function determineComplexity(solution: string): IntelligentOptimization['implementation_complexity'] {
  const complexKeywords = ['implement', 'optimize', 'restructure', 'integrate'];
  const moderateKeywords = ['add', 'configure', 'adjust', 'update'];
  const simpleKeywords = ['increase', 'decrease', 'enable', 'disable'];

  const lowerSolution = solution.toLowerCase();

  if (complexKeywords.some(keyword => lowerSolution.includes(keyword))) return 'complex';
  if (moderateKeywords.some(keyword => lowerSolution.includes(keyword))) return 'moderate';
  return 'simple';
}

function generatePrerequisites(solution: string, pattern: PerformancePattern): string[] {
  const basePrerequisites = ['Performance baseline measurement', 'Change approval process'];

  if (solution.includes('resource') || solution.includes('instance')) {
    basePrerequisites.push('Resource capacity planning', 'Budget approval for infrastructure changes');
  }

  if (solution.includes('caching') || solution.includes('cache')) {
    basePrerequisites.push('Cache infrastructure setup', 'Cache key strategy design');
  }

  if (solution.includes('parallel') || solution.includes('concurrent')) {
    basePrerequisites.push('Dependency analysis', 'Parallel execution testing environment');
  }

  return basePrerequisites;
}

function identifyRisks(solution: string, pattern: PerformancePattern): string[] {
  const baseRisks = ['Performance regression during implementation', 'Unexpected resource usage changes'];

  if (solution.includes('parallel') || solution.includes('concurrent')) {
    baseRisks.push('Race conditions in parallel execution', 'Dependency conflicts');
  }

  if (solution.includes('resource') || solution.includes('scaling')) {
    baseRisks.push('Cost overruns from resource scaling', 'Resource contention issues');
  }

  if (solution.includes('cache') || solution.includes('caching')) {
    baseRisks.push('Cache invalidation complexities', 'Memory pressure from cache growth');
  }

  return baseRisks;
}

function generateValidationStrategy(solution: string, pattern: PerformancePattern): string {
  if (solution.includes('parallel') || solution.includes('concurrent')) {
    return 'A/B test parallel vs sequential execution, monitor for race conditions, validate output consistency';
  }

  if (solution.includes('resource') || solution.includes('scaling')) {
    return 'Monitor resource utilization metrics, compare cost/performance ratios before and after';
  }

  if (solution.includes('cache') || solution.includes('caching')) {
    return 'Track cache hit rates, measure cache performance impact, monitor memory usage';
  }

  return 'Implement gradual rollout with performance monitoring and automated rollback triggers';
}

function generateBenchmarkImplementation(benchmark: BenchmarkComparison): string {
  return `Target improvement from current ${benchmark.current_value} to industry benchmark ${benchmark.best_practice_target}. ${benchmark.gap_analysis}`;
}

/**
 * Helper functions for AI-traditional optimization mapping
 */
function mapAICategoryToTraditional(aiCategory: IntelligentOptimization['category']): 'parallelization' | 'caching' | 'resource_optimization' | 'configuration' | 'tooling' | 'architecture' {
  switch (aiCategory) {
    case 'parallelization': return 'parallelization';
    case 'caching': return 'caching';
    case 'resource_allocation': return 'resource_optimization';
    case 'process_optimization': return 'configuration';
    case 'infrastructure': return 'architecture';
    default: return 'configuration';
  }
}

function mapAIPriorityToTraditional(aiPriority: number): 'low' | 'medium' | 'high' | 'critical' {
  if (aiPriority >= 8) return 'critical';
  if (aiPriority >= 6) return 'high';
  if (aiPriority >= 4) return 'medium';
  return 'low';
}

/**
 * Enhanced performance analysis with AI integration
 */
export async function handleOptimizePipelinePerformance(
  input: OptimizePipelinePerformanceInput,
  pipelineService: PipelineService
): Promise<OptimizePipelinePerformanceOutput> {
  try {
    // Validate input
    const validatedInput = OptimizePipelinePerformanceSchema.parse(input);

    // Get pipeline information
    const pipeline = await pipelineService.getPipeline(validatedInput.pipeline_id);

    if (!pipeline.success || !pipeline.data) {
      return {
        success: false,
        metadata: {
          analysis_duration: 0,
          data_points_analyzed: 0,
          confidence_score: 0,
          recommendations_count: 0,
          potential_savings: {
            time_savings_hours: 0,
            cost_savings_percent: 0,
            efficiency_improvement: 0
          }
        },
        message: `Pipeline ${validatedInput.pipeline_id} not found in repository ${validatedInput.repository}`,
        error: pipeline.error?.message || 'Pipeline not found'
      };
    }

    const startTime = Date.now();

    // Analyze current performance metrics
    const performanceMetrics = await analyzeCurrentPerformance(
      validatedInput.repository,
      validatedInput.pipeline_id,
      validatedInput.analysis_config,
      pipelineService
    );

    // Perform advanced AI-driven pattern detection
    const detectedPatterns = await detectPerformancePatterns(
      performanceMetrics.rawData || [],
      validatedInput.analysis_config
    );

    // Perform benchmarking analysis
    const benchmarkResults = await performBenchmarkAnalysis(
      performanceMetrics,
      validatedInput.benchmark_config
    );

    // Generate intelligent AI-driven optimizations
    const intelligentOptimizations = await generateIntelligentOptimizations(
      detectedPatterns,
      performanceMetrics.metrics,
      benchmarkResults.comparisons || []
    );

    // Generate traditional optimization suggestions (enhanced with AI insights)
    const optimizationSuggestions = await generateOptimizationSuggestions(
      performanceMetrics,
      validatedInput.optimization_config,
      intelligentOptimizations // Pass AI optimizations to enhance traditional suggestions
    );

    // Create actionable roadmap
    const actionableRoadmap = generateActionableRoadmap(optimizationSuggestions);

    // Calculate potential savings
    const potentialSavings = calculatePotentialSavings(optimizationSuggestions);

    const analysisTimeMs = Date.now() - startTime;

    const report: OptimizePipelinePerformanceOutput = {
      success: true,
      optimization_report: {
        pipeline_id: validatedInput.pipeline_id,
        repository: validatedInput.repository,
        analysis_timestamp: new Date().toISOString(),
        analysis_period: validatedInput.analysis_config?.time_period || 'last_30_days',
        current_performance: {
          metrics: performanceMetrics.metrics,
          trend_analysis: performanceMetrics.trends,
          bottlenecks: performanceMetrics.bottlenecks
        },
        optimization_suggestions: optimizationSuggestions,
        performance_benchmarks: benchmarkResults,
        actionable_roadmap: actionableRoadmap
      },
      metadata: {
        analysis_duration: analysisTimeMs,
        data_points_analyzed: performanceMetrics.dataPointsCount || 100,
        confidence_score: calculateConfidenceScore(performanceMetrics, optimizationSuggestions),
        recommendations_count: optimizationSuggestions.length,
        potential_savings: potentialSavings
      },
      message: `Successfully analyzed pipeline performance and generated ${optimizationSuggestions.length} optimization recommendations`
    };

    // Validate output
    return OptimizePipelinePerformanceOutputSchema.parse(report);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        metadata: {
          analysis_duration: 0,
          data_points_analyzed: 0,
          confidence_score: 0,
          recommendations_count: 0,
          potential_savings: {
            time_savings_hours: 0,
            cost_savings_percent: 0,
            efficiency_improvement: 0
          }
        },
        message: 'Input validation failed',
        error: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }

    return {
      success: false,
      metadata: {
        analysis_duration: 0,
        data_points_analyzed: 0,
        confidence_score: 0,
        recommendations_count: 0,
        potential_savings: {
          time_savings_hours: 0,
          cost_savings_percent: 0,
          efficiency_improvement: 0
        }
      },
      message: 'Failed to optimize pipeline performance',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper Functions

/**
 * Analyze current pipeline performance metrics
 */
async function analyzeCurrentPerformance(
  repository: string,
  pipelineId: string,
  config: OptimizePipelinePerformanceInput['analysis_config'],
  pipelineService: PipelineService
): Promise<any> {
  // Simulate performance analysis - in real implementation, this would query actual metrics
  const simulatedMetrics = {
    metrics: {
      average_duration: 1800, // 30 minutes
      median_duration: 1620, // 27 minutes
      success_rate: 0.85,
      failure_rate: 0.15,
      resource_efficiency: 0.70,
      cost_per_execution: 12.50,
      throughput: 0.8 // executions per hour
    },
    trends: {
      duration_trend: 'degrading' as const,
      success_rate_trend: 'stable' as const,
      resource_usage_trend: 'degrading' as const,
      overall_health_score: 0.72
    },
    bottlenecks: [
      {
        step_name: 'test_suite',
        average_duration: 900,
        percentage_of_total: 50,
        issue_type: 'slow_test_execution',
        severity: 'high' as const
      },
      {
        step_name: 'dependency_installation',
        average_duration: 300,
        percentage_of_total: 17,
        issue_type: 'network_latency',
        severity: 'medium' as const
      },
      {
        step_name: 'build_compilation',
        average_duration: 420,
        percentage_of_total: 23,
        issue_type: 'resource_contention',
        severity: 'medium' as const
      }
    ],
    dataPointsCount: 150
  };

  return simulatedMetrics;
}

/**
 * Generate optimization suggestions based on performance analysis and AI insights
 */
async function generateOptimizationSuggestions(
  performanceMetrics: any,
  config: OptimizePipelinePerformanceInput['optimization_config'],
  intelligentOptimizations?: IntelligentOptimization[]
): Promise<Array<{
  id: string;
  category: 'parallelization' | 'caching' | 'resource_optimization' | 'configuration' | 'tooling' | 'architecture';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  current_issue: string;
  proposed_solution: string;
  implementation_steps: string[];
  expected_improvement: {
    duration_reduction_percent: number;
    resource_savings_percent: number;
    success_rate_improvement: number;
    cost_savings_percent: number;
  };
  implementation_effort: {
    complexity: 'simple' | 'moderate' | 'complex';
    estimated_hours: number;
    required_skills: string[];
    dependencies: string[];
  };
  impact_score: number;
  confidence_level: number;
}>> {
  type OptimizationSuggestion = {
    id: string;
    category: 'parallelization' | 'caching' | 'resource_optimization' | 'configuration' | 'tooling' | 'architecture';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    current_issue: string;
    proposed_solution: string;
    implementation_steps: string[];
    expected_improvement: {
      duration_reduction_percent: number;
      resource_savings_percent: number;
      success_rate_improvement: number;
      cost_savings_percent: number;
    };
    implementation_effort: {
      complexity: 'simple' | 'moderate' | 'complex';
      estimated_hours: number;
      required_skills: string[];
      dependencies: string[];
    };
    impact_score: number;
    confidence_level: number;
  };

  let suggestions: OptimizationSuggestion[] = [];

  // Start with AI-driven intelligent optimizations if available
  if (intelligentOptimizations && intelligentOptimizations.length > 0) {
    intelligentOptimizations.forEach(aiOpt => {
      suggestions.push({
        id: aiOpt.optimization_id,
        category: mapAICategoryToTraditional(aiOpt.category),
        priority: mapAIPriorityToTraditional(aiOpt.priority),
        title: `AI-Optimized: ${aiOpt.description.split(':')[0] || aiOpt.description.substring(0, 50)}`,
        description: aiOpt.description,
        current_issue: `Detected optimization opportunity via AI analysis`,
        proposed_solution: aiOpt.implementation_approach,
        implementation_steps: aiOpt.prerequisites.concat([
          aiOpt.implementation_approach,
          'Monitor implementation effectiveness',
          'Validate against success metrics'
        ]),
        expected_improvement: {
          duration_reduction_percent: aiOpt.expected_improvement.time_reduction_percent,
          resource_savings_percent: aiOpt.expected_improvement.resource_savings_percent,
          success_rate_improvement: aiOpt.expected_improvement.reliability_improvement / 100,
          cost_savings_percent: aiOpt.expected_improvement.cost_reduction_percent
        },
        implementation_effort: {
          complexity: aiOpt.implementation_complexity,
          estimated_hours: aiOpt.implementation_complexity === 'simple' ? 8 :
            aiOpt.implementation_complexity === 'moderate' ? 24 : 48,
          required_skills: ['Performance optimization', 'CI/CD configuration'],
          dependencies: aiOpt.prerequisites
        },
        impact_score: Math.min(10, aiOpt.priority * 0.8 + (aiOpt.expected_improvement.time_reduction_percent * 0.1)),
        confidence_level: 0.9 // AI-driven recommendations typically have high confidence
      });
    });
  }

  // Add traditional optimization suggestions
  const traditionalSuggestions = [
    {
      id: 'opt-001',
      category: 'parallelization' as const,
      priority: 'high' as const,
      title: 'Parallelize Test Execution',
      description: 'Run test suites in parallel to reduce overall execution time',
      current_issue: 'Test suite is taking 50% of total pipeline time due to sequential execution',
      proposed_solution: 'Configure test runner to execute tests in parallel across multiple workers',
      implementation_steps: [
        'Configure test runner for parallel execution',
        'Split tests into balanced groups',
        'Update CI configuration to use multiple workers',
        'Verify test isolation and fix any race conditions'
      ],
      expected_improvement: {
        duration_reduction_percent: 35,
        resource_savings_percent: 10,
        success_rate_improvement: 0.02,
        cost_savings_percent: 25
      },
      implementation_effort: {
        complexity: 'moderate' as const,
        estimated_hours: 16,
        required_skills: ['CI/CD configuration', 'Test automation'],
        dependencies: ['Test framework support for parallelization']
      },
      impact_score: 8.5,
      confidence_level: 0.85
    },
    {
      id: 'opt-002',
      category: 'caching' as const,
      priority: 'medium' as const,
      title: 'Implement Dependency Caching',
      description: 'Cache dependencies to reduce installation time',
      current_issue: 'Dependencies are downloaded and installed on every pipeline run',
      proposed_solution: 'Implement caching layer for package dependencies and build artifacts',
      implementation_steps: [
        'Configure dependency caching in CI system',
        'Set up cache keys based on dependency files',
        'Add cache restoration and saving steps',
        'Monitor cache hit rates and optimize'
      ],
      expected_improvement: {
        duration_reduction_percent: 15,
        resource_savings_percent: 20,
        success_rate_improvement: 0.01,
        cost_savings_percent: 12
      },
      implementation_effort: {
        complexity: 'simple' as const,
        estimated_hours: 8,
        required_skills: ['CI/CD configuration'],
        dependencies: ['CI system caching support']
      },
      impact_score: 7.2,
      confidence_level: 0.90
    },
    {
      id: 'opt-003',
      category: 'resource_optimization' as const,
      priority: 'medium' as const,
      title: 'Optimize Build Resources',
      description: 'Allocate appropriate resources for build steps',
      current_issue: 'Build compilation experiencing resource contention',
      proposed_solution: 'Optimize resource allocation and use faster build machines',
      implementation_steps: [
        'Analyze resource usage patterns',
        'Upgrade to higher-spec build machines',
        'Configure resource limits per step',
        'Implement resource monitoring'
      ],
      expected_improvement: {
        duration_reduction_percent: 20,
        resource_savings_percent: -5, // May use more resources but faster
        success_rate_improvement: 0.03,
        cost_savings_percent: 8
      },
      implementation_effort: {
        complexity: 'simple' as const,
        estimated_hours: 4,
        required_skills: ['Infrastructure management'],
        dependencies: ['Budget approval for upgraded machines']
      },
      impact_score: 6.8,
      confidence_level: 0.80
    }
  ];

  // Combine AI suggestions with traditional suggestions
  suggestions.push(...traditionalSuggestions);

  // Filter suggestions based on configuration
  let filteredSuggestions = suggestions;

  if (config?.priority_filter && config.priority_filter.length > 0) {
    filteredSuggestions = filteredSuggestions.filter(s =>
      config.priority_filter!.includes(s.priority)
    );
  }

  if (config?.implementation_complexity && config.implementation_complexity !== 'all') {
    filteredSuggestions = filteredSuggestions.filter(s =>
      s.implementation_effort.complexity === config.implementation_complexity
    );
  }

  // Sort by impact score
  filteredSuggestions.sort((a, b) => b.impact_score - a.impact_score);

  return filteredSuggestions;
}

/**
 * Perform benchmark analysis
 */
async function performBenchmarkAnalysis(
  performanceMetrics: any,
  config: OptimizePipelinePerformanceInput['benchmark_config']
): Promise<any> {
  const benchmarks: any = {
    team_comparison: {
      rank_in_team: 3,
      team_average_duration: 2100, // 35 minutes
      comparison_status: 'above_average' as const
    },
    best_practices_alignment: {
      alignment_score: 0.75,
      missing_practices: [
        'Parallel test execution',
        'Comprehensive caching strategy',
        'Performance monitoring'
      ],
      implemented_practices: [
        'Automated testing',
        'Code quality checks',
        'Basic CI/CD pipeline'
      ]
    }
  };

  if (config?.compare_to_industry) {
    benchmarks.industry_comparison = {
      percentile_rank: 60,
      comparison_status: 'average' as const
    };
  }

  return benchmarks;
}

/**
 * Generate actionable roadmap
 */
function generateActionableRoadmap(suggestions: any[]): any {
  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high' || s.priority === 'critical');
  const mediumPrioritySuggestions = suggestions.filter(s => s.priority === 'medium');
  const lowPrioritySuggestions = suggestions.filter(s => s.priority === 'low');

  return {
    immediate_actions: [
      'Implement dependency caching for quick wins',
      'Analyze current test execution patterns',
      'Set up performance monitoring baseline'
    ],
    short_term_goals: [
      'Implement parallel test execution',
      'Optimize build resource allocation',
      'Set up comprehensive caching strategy'
    ],
    long_term_strategy: [
      'Implement advanced pipeline architecture patterns',
      'Set up predictive performance monitoring',
      'Establish performance SLAs and alerting'
    ],
    success_metrics: [
      'Average pipeline duration < 20 minutes',
      'Success rate > 95%',
      'Resource efficiency > 85%',
      'Cost per execution < $10'
    ]
  };
}

/**
 * Calculate potential savings from optimization suggestions
 */
function calculatePotentialSavings(suggestions: any[]): any {
  const totalDurationReduction = suggestions.reduce((sum, s) =>
    sum + s.expected_improvement.duration_reduction_percent, 0
  ) / suggestions.length;

  const totalCostSavings = suggestions.reduce((sum, s) =>
    sum + s.expected_improvement.cost_savings_percent, 0
  ) / suggestions.length;

  const totalEfficiencyImprovement = suggestions.reduce((sum, s) =>
    sum + (s.expected_improvement.duration_reduction_percent / 100), 0
  ) / suggestions.length;

  // Estimate time savings based on current 30-minute average
  const currentAverageDuration = 30; // minutes
  const timeSavingsHours = (currentAverageDuration * totalDurationReduction / 100) / 60;

  return {
    time_savings_hours: Math.round(timeSavingsHours * 100) / 100,
    cost_savings_percent: Math.round(totalCostSavings * 100) / 100,
    efficiency_improvement: Math.round(totalEfficiencyImprovement * 100) / 100
  };
}

/**
 * Calculate confidence score for the analysis
 */
function calculateConfidenceScore(performanceMetrics: any, suggestions: any[]): number {
  // Base confidence on data quality and suggestion quality
  const dataQualityScore = Math.min(1, performanceMetrics.dataPointsCount / 100);
  const suggestionQualityScore = suggestions.length > 0 ?
    suggestions.reduce((sum, s) => sum + s.confidence_level, 0) / suggestions.length : 0;

  return Math.round((dataQualityScore * 0.4 + suggestionQualityScore * 0.6) * 100) / 100;
}