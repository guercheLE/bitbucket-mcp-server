/**
 * Policy Engine
 * 
 * Advanced policy evaluation engine for dynamic access control decisions.
 * Provides policy parsing, rule evaluation, conflict resolution, and real-time policy updates.
 * 
 * Features:
 * - Dynamic policy evaluation with complex expressions
 * - Policy conflict resolution and priority handling
 * - Context-aware policy decisions
 * - Policy composition and inheritance
 * - Real-time policy updates and validation
 * - Comprehensive audit logging for policy decisions
 * - Performance-optimized evaluation with caching
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import SecurityAuditLogger, { EventCategory, EventSeverity, SecurityEventType } from './audit-logger.js';

/**
 * Policy Expression Type Definition
 */
export interface PolicyExpression {
    /** Expression type */
    type: 'literal' | 'variable' | 'function' | 'operator' | 'condition';

    /** Expression value */
    value?: any;

    /** Variable name for variable expressions */
    variable?: string;

    /** Function name for function expressions */
    function?: string;

    /** Operator type for operator expressions */
    operator?: 'and' | 'or' | 'not' | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'matches' | 'exists';

    /** Arguments/operands for functions and operators */
    arguments?: PolicyExpression[];

    /** Metadata for expression */
    metadata: Record<string, any>;
}

/**
 * Policy Expression Schema
 */
export const PolicyExpressionSchema: z.ZodLazy<z.ZodObject<{
    type: z.ZodEnum<['literal', 'variable', 'function', 'operator', 'condition']>;
    value: z.ZodOptional<z.ZodAny>;
    variable: z.ZodOptional<z.ZodString>;
    function: z.ZodOptional<z.ZodString>;
    operator: z.ZodOptional<z.ZodEnum<['and', 'or', 'not', 'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'matches', 'exists']>>;
    arguments: z.ZodOptional<z.ZodArray<z.ZodLazy<any>, "many">>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
}>> = z.lazy(() => z.object({
    type: z.enum(['literal', 'variable', 'function', 'operator', 'condition']),
    value: z.any().optional(),
    variable: z.string().optional(),
    function: z.string().optional(),
    operator: z.enum(['and', 'or', 'not', 'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'matches', 'exists']).optional(),
    arguments: z.array(z.lazy(() => PolicyExpressionSchema)).optional(),
    metadata: z.record(z.any())
}));

/**
 * Policy Statement Schema
 */
export const PolicyStatementSchema = z.object({
    /** Unique statement identifier */
    id: z.string().min(1),

    /** Statement description */
    description: z.string().optional(),

    /** Statement effect */
    effect: z.enum(['allow', 'deny']),

    /** Statement priority (higher numbers take precedence) */
    priority: z.number().int().default(0),

    /** Resources this statement applies to */
    resources: z.array(z.string()).default(['*']),

    /** Actions this statement applies to */
    actions: z.array(z.string()).default(['*']),

    /** Principals (users/roles) this statement applies to */
    principals: z.array(z.string()).default(['*']),

    /** Condition expression for statement evaluation */
    condition: PolicyExpressionSchema.optional(),

    /** Statement metadata */
    metadata: z.record(z.any()).default({})
});

export type PolicyStatement = z.infer<typeof PolicyStatementSchema>;

/**
 * Policy Document Schema
 */
export const PolicyDocumentSchema = z.object({
    /** Unique policy identifier */
    id: z.string().min(1),

    /** Policy name */
    name: z.string().min(1),

    /** Policy description */
    description: z.string().optional(),

    /** Policy version */
    version: z.string().default('1.0'),

    /** Policy statements */
    statements: z.array(PolicyStatementSchema).min(1),

    /** Policy variables for dynamic evaluation */
    variables: z.record(z.any()).default({}),

    /** Policy functions for custom logic */
    functions: z.record(z.string()).default({}),

    /** Policy tags for organization */
    tags: z.array(z.string()).default([]),

    /** Whether this policy is active */
    isActive: z.boolean().default(true),

    /** Policy creation timestamp */
    createdAt: z.date().default(() => new Date()),

    /** Policy last modification timestamp */
    updatedAt: z.date().default(() => new Date()),

    /** Policy metadata */
    metadata: z.record(z.any()).default({})
});

export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

/**
 * Policy Evaluation Context Schema
 */
export const PolicyEvaluationContextSchema = z.object({
    /** Principal (user) making the request */
    principal: z.object({
        id: z.string(),
        type: z.string().default('user'),
        roles: z.array(z.string()).default([]),
        attributes: z.record(z.any()).default({})
    }),

    /** Resource being accessed */
    resource: z.object({
        id: z.string(),
        type: z.string(),
        attributes: z.record(z.any()).default({})
    }),

    /** Action being performed */
    action: z.object({
        id: z.string(),
        type: z.string(),
        attributes: z.record(z.any()).default({})
    }),

    /** Environment context */
    environment: z.object({
        timestamp: z.date().default(() => new Date()),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        sessionId: z.string().optional(),
        workspaceId: z.string().optional(),
        attributes: z.record(z.any()).default({})
    }).default({}),

    /** Request context */
    request: z.object({
        id: z.string().optional(),
        method: z.string().optional(),
        path: z.string().optional(),
        headers: z.record(z.string()).default({}),
        body: z.any().optional(),
        attributes: z.record(z.any()).default({})
    }).default({})
});

export type PolicyEvaluationContext = z.infer<typeof PolicyEvaluationContextSchema>;

/**
 * Policy Decision Schema
 */
export const PolicyDecisionSchema = z.object({
    /** Decision result */
    decision: z.enum(['allow', 'deny', 'indeterminate']),

    /** Decision reason */
    reason: z.string(),

    /** Applied policy statements */
    appliedStatements: z.array(z.object({
        policyId: z.string(),
        statementId: z.string(),
        effect: z.enum(['allow', 'deny']),
        priority: z.number()
    })),

    /** Evaluation metadata */
    evaluationMetadata: z.object({
        /** Total policies evaluated */
        policiesEvaluated: z.number().default(0),

        /** Total statements evaluated */
        statementsEvaluated: z.number().default(0),

        /** Evaluation time in milliseconds */
        evaluationTime: z.number().default(0),

        /** Whether result was cached */
        fromCache: z.boolean().default(false),

        /** Evaluation errors */
        errors: z.array(z.string()).default([])
    }).default({}),

    /** Decision timestamp */
    timestamp: z.date().default(() => new Date()),

    /** Decision metadata */
    metadata: z.record(z.any()).default({})
});

export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

/**
 * Policy Engine Configuration
 */
export interface PolicyEngineConfig {
    /** Enable policy caching */
    enableCaching: boolean;

    /** Cache TTL in milliseconds */
    cacheTimeToLive: number;

    /** Enable comprehensive audit logging */
    enableAuditLogging: boolean;

    /** Log all policy decisions */
    logAllDecisions: boolean;

    /** Log only denied decisions */
    logDeniedOnly: boolean;

    /** Default decision when no policies match */
    defaultDecision: 'allow' | 'deny' | 'indeterminate';

    /** Maximum evaluation depth for complex expressions */
    maxEvaluationDepth: number;

    /** Maximum evaluation time in milliseconds */
    maxEvaluationTime: number;

    /** Enable real-time policy notifications */
    enableRealTimeNotifications: boolean;

    /** Policy conflict resolution strategy */
    conflictResolution: 'first-applicable' | 'deny-overrides' | 'allow-overrides' | 'highest-priority';
}

/**
 * Default Configuration
 */
const DEFAULT_CONFIG: PolicyEngineConfig = {
    enableCaching: true,
    cacheTimeToLive: 5 * 60 * 1000, // 5 minutes
    enableAuditLogging: true,
    logAllDecisions: false,
    logDeniedOnly: true,
    defaultDecision: 'deny',
    maxEvaluationDepth: 20,
    maxEvaluationTime: 5000, // 5 seconds
    enableRealTimeNotifications: true,
    conflictResolution: 'deny-overrides'
};

/**
 * Policy Engine Class
 */
export class PolicyEngine extends EventEmitter {
    private readonly config: PolicyEngineConfig;
    private readonly auditLogger: SecurityAuditLogger;

    // Storage maps (in production, these would be backed by a database)
    private policies: Map<string, PolicyDocument> = new Map();

    // Decision cache for performance
    private decisionCache: Map<string, { decision: PolicyDecision; expiresAt: number }> = new Map();

    // Built-in functions registry
    private builtInFunctions: Map<string, Function> = new Map();

    constructor(config: Partial<PolicyEngineConfig> = {}) {
        super();

        this.config = { ...DEFAULT_CONFIG, ...config };

        this.auditLogger = new SecurityAuditLogger({
            maxMemoryEvents: 10000,
            batchSize: 100,
            flushInterval: 30000,
            enableCorrelation: true,
            defaultRetention: {
                standard: 30,
                security: 365 * 2,
                compliance: 365 * 7,
                legal: 365 * 7
            },
            enableDeduplication: true,
            deduplicationWindow: 60000
        });

        // Initialize built-in functions
        this.initializeBuiltInFunctions();

        // Initialize default policies
        this.initializeDefaultPolicies();
    }

    /**
     * Policy Management
     */

    async createPolicy(policy: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyDocument> {
        const policyId = this.generatePolicyId(policy.name, policy.version);

        const newPolicy: PolicyDocument = {
            ...policy,
            id: policyId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Validate policy
        const validatedPolicy = await this.validatePolicy(newPolicy);

        // Check if policy already exists
        if (this.policies.has(validatedPolicy.id)) {
            throw new Error(`Policy '${validatedPolicy.id}' already exists`);
        }

        // Store policy
        this.policies.set(validatedPolicy.id, validatedPolicy);

        // Clear decision cache
        this.clearDecisionCache();

        // Log policy creation
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'policy',
                action: 'create',
                result: 'success',
                details: {
                    context: {
                        policy: {
                            id: validatedPolicy.id,
                            name: validatedPolicy.name,
                            version: validatedPolicy.version,
                            statementCount: validatedPolicy.statements.length
                        }
                    }
                }
            });
        }

        this.emit('policy:created', { policy: validatedPolicy });

        return validatedPolicy;
    }

    async updatePolicy(policyId: string, updates: Partial<PolicyDocument>): Promise<PolicyDocument> {
        const existingPolicy = this.policies.get(policyId);
        if (!existingPolicy) {
            throw new Error(`Policy '${policyId}' not found`);
        }

        const updatedPolicy: PolicyDocument = {
            ...existingPolicy,
            ...updates,
            id: policyId, // Ensure ID cannot be changed
            updatedAt: new Date()
        };

        // Validate updated policy
        const validatedPolicy = await this.validatePolicy(updatedPolicy);

        // Store updated policy
        this.policies.set(policyId, validatedPolicy);

        // Clear decision cache
        this.clearDecisionCache();

        // Log policy update
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.LOW,
                userId: 'system',
                resourceType: 'policy',
                action: 'update',
                result: 'success',
                details: {
                    context: {
                        policy: {
                            id: policyId,
                            changes: updates
                        }
                    }
                }
            });
        }

        this.emit('policy:updated', {
            policy: validatedPolicy,
            changes: updates
        });

        return validatedPolicy;
    }

    async deletePolicy(policyId: string): Promise<void> {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error(`Policy '${policyId}' not found`);
        }

        // Delete policy
        this.policies.delete(policyId);

        // Clear decision cache
        this.clearDecisionCache();

        // Log policy deletion
        if (this.config.enableAuditLogging) {
            await this.auditLogger.logEvent({
                eventType: SecurityEventType.SYSTEM_CONFIG_CHANGED,
                category: EventCategory.AUTHORIZATION,
                severity: EventSeverity.MEDIUM,
                userId: 'system',
                resourceType: 'policy',
                action: 'delete',
                result: 'success',
                details: {
                    context: {
                        policy: {
                            id: policyId,
                            name: policy.name,
                            version: policy.version
                        }
                    }
                }
            });
        }

        this.emit('policy:deleted', { policyId, policy });
    }

    getPolicy(policyId: string): PolicyDocument | undefined {
        return this.policies.get(policyId);
    }

    listPolicies(filters?: {
        isActive?: boolean;
        tags?: string[];
        version?: string;
    }): PolicyDocument[] {
        let policies = Array.from(this.policies.values());

        if (filters) {
            if (filters.isActive !== undefined) {
                policies = policies.filter(p => p.isActive === filters.isActive);
            }
            if (filters.tags && filters.tags.length > 0) {
                policies = policies.filter(p =>
                    filters.tags!.some(tag => p.tags.includes(tag))
                );
            }
            if (filters.version) {
                policies = policies.filter(p => p.version === filters.version);
            }
        }

        return policies.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Policy Evaluation
     */

    async evaluatePolicy(context: PolicyEvaluationContext): Promise<PolicyDecision> {
        const startTime = Date.now();

        // Validate context
        const validatedContext = PolicyEvaluationContextSchema.parse(context);

        // Check cache first
        if (this.config.enableCaching) {
            const cacheKey = this.generateCacheKey(validatedContext);
            const cached = this.decisionCache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                cached.decision.evaluationMetadata.fromCache = true;
                return cached.decision;
            }
        }

        // Get applicable policies
        const applicablePolicies = this.findApplicablePolicies(validatedContext);

        // Evaluate policies
        const evaluationResults = await this.evaluatePolicies(applicablePolicies, validatedContext);

        // Resolve conflicts and make final decision
        const finalDecision = this.resolveConflicts(evaluationResults, validatedContext);

        // Add evaluation metadata
        finalDecision.evaluationMetadata = {
            policiesEvaluated: applicablePolicies.length,
            statementsEvaluated: evaluationResults.reduce((acc, result) => acc + result.statementsEvaluated, 0),
            evaluationTime: Date.now() - startTime,
            fromCache: false,
            errors: evaluationResults.flatMap(result => result.errors)
        };

        // Cache decision
        if (this.config.enableCaching) {
            const cacheKey = this.generateCacheKey(validatedContext);
            this.decisionCache.set(cacheKey, {
                decision: finalDecision,
                expiresAt: Date.now() + this.config.cacheTimeToLive
            });
        }

        // Log decision if required
        if (this.config.enableAuditLogging) {
            const shouldLog = this.config.logAllDecisions ||
                (this.config.logDeniedOnly && finalDecision.decision === 'deny');

            if (shouldLog) {
                await this.auditLogger.logEvent({
                    eventType: finalDecision.decision === 'allow' ? SecurityEventType.ACCESS_GRANTED : SecurityEventType.ACCESS_DENIED,
                    category: EventCategory.AUTHORIZATION,
                    severity: finalDecision.decision === 'allow' ? EventSeverity.LOW : EventSeverity.MEDIUM,
                    userId: validatedContext.principal.id,
                    sessionId: validatedContext.environment.sessionId,
                    resourceType: 'policy_evaluation',
                    resourceId: validatedContext.resource.id,
                    action: validatedContext.action.id,
                    result: finalDecision.decision === 'allow' ? 'success' : 'denied',
                    ipAddress: validatedContext.environment.ipAddress,
                    userAgent: validatedContext.environment.userAgent,
                    details: {
                        context: {
                            decision: finalDecision,
                            evaluationContext: {
                                principal: validatedContext.principal,
                                resource: validatedContext.resource,
                                action: validatedContext.action
                            }
                        }
                    }
                });
            }
        }

        // Emit real-time notification
        if (this.config.enableRealTimeNotifications) {
            this.emit('policy:evaluated', {
                context: validatedContext,
                decision: finalDecision
            });

            if (finalDecision.decision === 'deny') {
                this.emit('policy:denied', {
                    context: validatedContext,
                    decision: finalDecision
                });
            }
        }

        return finalDecision;
    }

    /**
     * Private helper methods
     */

    private async validatePolicy(policy: PolicyDocument): Promise<PolicyDocument> {
        // Validate policy structure
        const validatedPolicy = PolicyDocumentSchema.parse(policy);

        // Validate statements
        for (const statement of validatedPolicy.statements) {
            if (statement.condition) {
                // Type assertion since Zod validation ensures required properties
                await this.validateExpression(statement.condition as PolicyExpression, validatedPolicy);
            }
        }

        // Validate functions
        for (const [name, code] of Object.entries(validatedPolicy.functions)) {
            try {
                new Function('context', 'variables', code);
            } catch (error) {
                throw new Error(`Invalid function '${name}': ${error}`);
            }
        }

        return validatedPolicy;
    }

    private async validateExpression(expression: PolicyExpression, policy: PolicyDocument): Promise<void> {
        const validatedExpression = PolicyExpressionSchema.parse(expression);

        switch (validatedExpression.type) {
            case 'function':
                if (validatedExpression.function &&
                    !this.builtInFunctions.has(validatedExpression.function) &&
                    !policy.functions[validatedExpression.function]) {
                    throw new Error(`Unknown function: ${validatedExpression.function}`);
                }
                break;

            case 'operator':
                if (validatedExpression.arguments) {
                    for (const arg of validatedExpression.arguments) {
                        await this.validateExpression(arg, policy);
                    }
                }
                break;
        }
    }

    private findApplicablePolicies(context: PolicyEvaluationContext): PolicyDocument[] {
        const applicablePolicies: PolicyDocument[] = [];

        for (const policy of Array.from(this.policies.values())) {
            if (!policy.isActive) continue;

            // Check if any statement in the policy applies to this context
            const hasApplicableStatement = policy.statements.some(statement =>
                this.isStatementApplicable(statement, context)
            );

            if (hasApplicableStatement) {
                applicablePolicies.push(policy);
            }
        }

        return applicablePolicies;
    }

    private isStatementApplicable(statement: PolicyStatement, context: PolicyEvaluationContext): boolean {
        // Check resource match
        const resourceMatch = statement.resources.includes('*') ||
            statement.resources.includes(context.resource.id) ||
            statement.resources.includes(context.resource.type);

        if (!resourceMatch) return false;

        // Check action match
        const actionMatch = statement.actions.includes('*') ||
            statement.actions.includes(context.action.id) ||
            statement.actions.includes(context.action.type);

        if (!actionMatch) return false;

        // Check principal match
        const principalMatch = statement.principals.includes('*') ||
            statement.principals.includes(context.principal.id) ||
            statement.principals.some(principal => context.principal.roles.includes(principal));

        if (!principalMatch) return false;

        return true;
    }

    private async evaluatePolicies(
        policies: PolicyDocument[],
        context: PolicyEvaluationContext
    ): Promise<Array<{
        policy: PolicyDocument;
        results: Array<{
            statement: PolicyStatement;
            effect: 'allow' | 'deny';
            applies: boolean;
        }>;
        statementsEvaluated: number;
        errors: string[];
    }>> {
        const results = [];

        for (const policy of policies) {
            const policyResult = {
                policy,
                results: [] as Array<{
                    statement: PolicyStatement;
                    effect: 'allow' | 'deny';
                    applies: boolean;
                }>,
                statementsEvaluated: 0,
                errors: [] as string[]
            };

            for (const statement of policy.statements) {
                try {
                    const applies = await this.evaluateStatement(statement, context, policy);

                    policyResult.results.push({
                        statement,
                        effect: statement.effect,
                        applies
                    });

                    policyResult.statementsEvaluated++;
                } catch (error) {
                    policyResult.errors.push(`Statement ${statement.id}: ${error}`);
                }
            }

            results.push(policyResult);
        }

        return results;
    }

    private async evaluateStatement(
        statement: PolicyStatement,
        context: PolicyEvaluationContext,
        policy: PolicyDocument
    ): Promise<boolean> {
        // Check basic applicability first
        if (!this.isStatementApplicable(statement, context)) {
            return false;
        }

        // Evaluate condition if present
        if (statement.condition) {
            const conditionResult = await this.evaluateExpression(
                statement.condition as PolicyExpression,
                context,
                policy
            );
            return Boolean(conditionResult);
        }

        return true;
    }

    private async evaluateExpression(
        expression: PolicyExpression,
        context: PolicyEvaluationContext,
        policy: PolicyDocument,
        depth: number = 0
    ): Promise<any> {
        if (depth > this.config.maxEvaluationDepth) {
            throw new Error('Maximum evaluation depth exceeded');
        }

        switch (expression.type) {
            case 'literal':
                return expression.value;

            case 'variable':
                return this.resolveVariable(expression.variable!, context, policy);

            case 'function':
                return this.evaluateFunction(
                    expression.function!,
                    expression.arguments || [],
                    context,
                    policy,
                    depth
                );

            case 'operator':
                return this.evaluateOperator(
                    expression.operator!,
                    expression.arguments || [],
                    context,
                    policy,
                    depth
                );

            default:
                throw new Error(`Unknown expression type: ${expression.type}`);
        }
    }

    private resolveVariable(name: string, context: PolicyEvaluationContext, policy: PolicyDocument): any {
        // Check policy variables first
        if (policy.variables[name] !== undefined) {
            return policy.variables[name];
        }

        // Resolve context variables
        const parts = name.split('.');
        let current: any = {
            principal: context.principal,
            resource: context.resource,
            action: context.action,
            environment: context.environment,
            request: context.request
        };

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current;
    }

    private async evaluateFunction(
        functionName: string,
        args: PolicyExpression[],
        context: PolicyEvaluationContext,
        policy: PolicyDocument,
        depth: number
    ): Promise<any> {
        // Evaluate arguments
        const evaluatedArgs = [];
        for (const arg of args) {
            evaluatedArgs.push(await this.evaluateExpression(arg, context, policy, depth + 1));
        }

        // Check built-in functions
        if (this.builtInFunctions.has(functionName)) {
            const func = this.builtInFunctions.get(functionName)!;
            return func(...evaluatedArgs, context);
        }

        // Check policy functions
        if (policy.functions[functionName]) {
            const func = new Function('context', 'variables', ...evaluatedArgs.map((_, i) => `arg${i}`), policy.functions[functionName]);
            return func(context, policy.variables, ...evaluatedArgs);
        }

        throw new Error(`Unknown function: ${functionName}`);
    }

    private async evaluateOperator(
        operator: string,
        args: PolicyExpression[],
        context: PolicyEvaluationContext,
        policy: PolicyDocument,
        depth: number
    ): Promise<any> {
        switch (operator) {
            case 'and':
                for (const arg of args) {
                    const result = await this.evaluateExpression(arg, context, policy, depth + 1);
                    if (!result) return false;
                }
                return true;

            case 'or':
                for (const arg of args) {
                    const result = await this.evaluateExpression(arg, context, policy, depth + 1);
                    if (result) return true;
                }
                return false;

            case 'not':
                if (args.length !== 1) throw new Error('NOT operator requires exactly one argument');
                const notResult = await this.evaluateExpression(args[0], context, policy, depth + 1);
                return !notResult;

            case 'eq':
                if (args.length !== 2) throw new Error('EQ operator requires exactly two arguments');
                const left = await this.evaluateExpression(args[0], context, policy, depth + 1);
                const right = await this.evaluateExpression(args[1], context, policy, depth + 1);
                return left === right;

            case 'ne':
                if (args.length !== 2) throw new Error('NE operator requires exactly two arguments');
                const neLeft = await this.evaluateExpression(args[0], context, policy, depth + 1);
                const neRight = await this.evaluateExpression(args[1], context, policy, depth + 1);
                return neLeft !== neRight;

            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
                if (args.length !== 2) throw new Error(`${operator.toUpperCase()} operator requires exactly two arguments`);
                const compLeft = await this.evaluateExpression(args[0], context, policy, depth + 1);
                const compRight = await this.evaluateExpression(args[1], context, policy, depth + 1);

                switch (operator) {
                    case 'gt': return compLeft > compRight;
                    case 'gte': return compLeft >= compRight;
                    case 'lt': return compLeft < compRight;
                    case 'lte': return compLeft <= compRight;
                    default: return false;
                }

            case 'in':
                if (args.length !== 2) throw new Error('IN operator requires exactly two arguments');
                const inValue = await this.evaluateExpression(args[0], context, policy, depth + 1);
                const inArray = await this.evaluateExpression(args[1], context, policy, depth + 1);
                return Array.isArray(inArray) && inArray.includes(inValue);

            case 'nin':
                if (args.length !== 2) throw new Error('NIN operator requires exactly two arguments');
                const ninValue = await this.evaluateExpression(args[0], context, policy, depth + 1);
                const ninArray = await this.evaluateExpression(args[1], context, policy, depth + 1);
                return Array.isArray(ninArray) && !ninArray.includes(ninValue);

            case 'contains':
                if (args.length !== 2) throw new Error('CONTAINS operator requires exactly two arguments');
                const containsContainer = await this.evaluateExpression(args[0], context, policy, depth + 1);
                const containsValue = await this.evaluateExpression(args[1], context, policy, depth + 1);

                if (typeof containsContainer === 'string') {
                    return containsContainer.includes(containsValue);
                } else if (Array.isArray(containsContainer)) {
                    return containsContainer.includes(containsValue);
                }
                return false;

            case 'matches':
                if (args.length !== 2) throw new Error('MATCHES operator requires exactly two arguments');
                const matchValue = await this.evaluateExpression(args[0], context, policy, depth + 1);
                const matchPattern = await this.evaluateExpression(args[1], context, policy, depth + 1);

                if (typeof matchValue === 'string' && typeof matchPattern === 'string') {
                    return new RegExp(matchPattern).test(matchValue);
                }
                return false;

            case 'exists':
                if (args.length !== 1) throw new Error('EXISTS operator requires exactly one argument');
                const existsValue = await this.evaluateExpression(args[0], context, policy, depth + 1);
                return existsValue !== undefined && existsValue !== null;

            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

    private resolveConflicts(
        evaluationResults: Array<{
            policy: PolicyDocument;
            results: Array<{
                statement: PolicyStatement;
                effect: 'allow' | 'deny';
                applies: boolean;
            }>;
            statementsEvaluated: number;
            errors: string[];
        }>,
        context: PolicyEvaluationContext
    ): PolicyDecision {
        const applicableStatements: PolicyDecision['appliedStatements'] = [];

        // Collect all applicable statements
        for (const policyResult of evaluationResults) {
            for (const statementResult of policyResult.results) {
                if (statementResult.applies) {
                    applicableStatements.push({
                        policyId: policyResult.policy.id,
                        statementId: statementResult.statement.id,
                        effect: statementResult.effect,
                        priority: statementResult.statement.priority
                    });
                }
            }
        }

        // If no statements apply, use default decision
        if (applicableStatements.length === 0) {
            return {
                decision: this.config.defaultDecision,
                reason: `No applicable policy statements found, using default decision: ${this.config.defaultDecision}`,
                appliedStatements: [],
                evaluationMetadata: {
                    policiesEvaluated: 0,
                    statementsEvaluated: 0,
                    evaluationTime: 0,
                    fromCache: false,
                    errors: []
                },
                timestamp: new Date(),
                metadata: { defaultDecisionUsed: true }
            };
        }

        // Apply conflict resolution strategy
        switch (this.config.conflictResolution) {
            case 'first-applicable':
                return this.resolveFirstApplicable(applicableStatements);

            case 'deny-overrides':
                return this.resolveDenyOverrides(applicableStatements);

            case 'allow-overrides':
                return this.resolveAllowOverrides(applicableStatements);

            case 'highest-priority':
                return this.resolveHighestPriority(applicableStatements);

            default:
                throw new Error(`Unknown conflict resolution strategy: ${this.config.conflictResolution}`);
        }
    }

    private resolveFirstApplicable(statements: PolicyDecision['appliedStatements']): PolicyDecision {
        const firstStatement = statements[0];

        return {
            decision: firstStatement.effect,
            reason: `First applicable statement: ${firstStatement.statementId} (${firstStatement.effect})`,
            appliedStatements: statements,
            evaluationMetadata: {
                policiesEvaluated: 0,
                statementsEvaluated: 0,
                evaluationTime: 0,
                fromCache: false,
                errors: []
            },
            timestamp: new Date(),
            metadata: { resolutionStrategy: 'first-applicable' }
        };
    }

    private resolveDenyOverrides(statements: PolicyDecision['appliedStatements']): PolicyDecision {
        const denyStatements = statements.filter(s => s.effect === 'deny');

        if (denyStatements.length > 0) {
            const highestPriorityDeny = denyStatements.reduce((prev, current) =>
                current.priority > prev.priority ? current : prev
            );

            return {
                decision: 'deny',
                reason: `Deny overrides: ${highestPriorityDeny.statementId}`,
                appliedStatements: statements,
                evaluationMetadata: {
                    policiesEvaluated: 0,
                    statementsEvaluated: 0,
                    evaluationTime: 0,
                    fromCache: false,
                    errors: []
                },
                timestamp: new Date(),
                metadata: { resolutionStrategy: 'deny-overrides' }
            };
        }

        const allowStatements = statements.filter(s => s.effect === 'allow');
        if (allowStatements.length > 0) {
            const highestPriorityAllow = allowStatements.reduce((prev, current) =>
                current.priority > prev.priority ? current : prev
            );

            return {
                decision: 'allow',
                reason: `Allow (no denies): ${highestPriorityAllow.statementId}`,
                appliedStatements: statements,
                evaluationMetadata: {
                    policiesEvaluated: 0,
                    statementsEvaluated: 0,
                    evaluationTime: 0,
                    fromCache: false,
                    errors: []
                },
                timestamp: new Date(),
                metadata: { resolutionStrategy: 'deny-overrides' }
            };
        }

        return {
            decision: this.config.defaultDecision,
            reason: `No applicable statements, using default: ${this.config.defaultDecision}`,
            appliedStatements: statements,
            evaluationMetadata: {
                policiesEvaluated: 0,
                statementsEvaluated: 0,
                evaluationTime: 0,
                fromCache: false,
                errors: []
            },
            timestamp: new Date(),
            metadata: { resolutionStrategy: 'deny-overrides', defaultUsed: true }
        };
    }

    private resolveAllowOverrides(statements: PolicyDecision['appliedStatements']): PolicyDecision {
        const allowStatements = statements.filter(s => s.effect === 'allow');

        if (allowStatements.length > 0) {
            const highestPriorityAllow = allowStatements.reduce((prev, current) =>
                current.priority > prev.priority ? current : prev
            );

            return {
                decision: 'allow',
                reason: `Allow overrides: ${highestPriorityAllow.statementId}`,
                appliedStatements: statements,
                evaluationMetadata: {
                    policiesEvaluated: 0,
                    statementsEvaluated: 0,
                    evaluationTime: 0,
                    fromCache: false,
                    errors: []
                },
                timestamp: new Date(),
                metadata: { resolutionStrategy: 'allow-overrides' }
            };
        }

        const denyStatements = statements.filter(s => s.effect === 'deny');
        if (denyStatements.length > 0) {
            const highestPriorityDeny = denyStatements.reduce((prev, current) =>
                current.priority > prev.priority ? current : prev
            );

            return {
                decision: 'deny',
                reason: `Deny (no allows): ${highestPriorityDeny.statementId}`,
                appliedStatements: statements,
                evaluationMetadata: {
                    policiesEvaluated: 0,
                    statementsEvaluated: 0,
                    evaluationTime: 0,
                    fromCache: false,
                    errors: []
                },
                timestamp: new Date(),
                metadata: { resolutionStrategy: 'allow-overrides' }
            };
        }

        return {
            decision: this.config.defaultDecision,
            reason: `No applicable statements, using default: ${this.config.defaultDecision}`,
            appliedStatements: statements,
            evaluationMetadata: {
                policiesEvaluated: 0,
                statementsEvaluated: 0,
                evaluationTime: 0,
                fromCache: false,
                errors: []
            },
            timestamp: new Date(),
            metadata: { resolutionStrategy: 'allow-overrides', defaultUsed: true }
        };
    }

    private resolveHighestPriority(statements: PolicyDecision['appliedStatements']): PolicyDecision {
        const highestPriorityStatement = statements.reduce((prev, current) =>
            current.priority > prev.priority ? current : prev
        );

        return {
            decision: highestPriorityStatement.effect,
            reason: `Highest priority statement: ${highestPriorityStatement.statementId} (priority: ${highestPriorityStatement.priority})`,
            appliedStatements: statements,
            evaluationMetadata: {
                policiesEvaluated: 0,
                statementsEvaluated: 0,
                evaluationTime: 0,
                fromCache: false,
                errors: []
            },
            timestamp: new Date(),
            metadata: { resolutionStrategy: 'highest-priority' }
        };
    }

    private generateCacheKey(context: PolicyEvaluationContext): string {
        const key = `${context.principal.id}:${context.resource.id}:${context.action.id}:${context.principal.roles.join(',')}`;
        return Buffer.from(key).toString('base64');
    }

    private clearDecisionCache(): void {
        this.decisionCache.clear();
    }

    private generatePolicyId(name: string, version: string): string {
        return `${name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_v${version}`;
    }

    /**
     * Initialize built-in functions
     */
    private initializeBuiltInFunctions(): void {
        // Date/Time functions
        this.builtInFunctions.set('now', () => new Date());
        this.builtInFunctions.set('dateAdd', (date: Date, amount: number, unit: string) => {
            const result = new Date(date);
            switch (unit) {
                case 'seconds': result.setSeconds(result.getSeconds() + amount); break;
                case 'minutes': result.setMinutes(result.getMinutes() + amount); break;
                case 'hours': result.setHours(result.getHours() + amount); break;
                case 'days': result.setDate(result.getDate() + amount); break;
                default: throw new Error(`Unknown time unit: ${unit}`);
            }
            return result;
        });

        // String functions
        this.builtInFunctions.set('toLowerCase', (str: string) => str.toLowerCase());
        this.builtInFunctions.set('toUpperCase', (str: string) => str.toUpperCase());
        this.builtInFunctions.set('substring', (str: string, start: number, end?: number) =>
            str.substring(start, end));
        this.builtInFunctions.set('length', (str: string) => str.length);

        // Array functions
        this.builtInFunctions.set('size', (arr: any[]) => arr.length);
        this.builtInFunctions.set('isEmpty', (arr: any[]) => arr.length === 0);
        this.builtInFunctions.set('first', (arr: any[]) => arr[0]);
        this.builtInFunctions.set('last', (arr: any[]) => arr[arr.length - 1]);

        // IP address functions
        this.builtInFunctions.set('ipInRange', (ip: string, cidr: string) => {
            // Simple CIDR check implementation
            // In production, use a proper IP library
            const [network, bits] = cidr.split('/');
            return ip.startsWith(network.split('.').slice(0, Math.floor(parseInt(bits) / 8)).join('.'));
        });

        // Utility functions
        this.builtInFunctions.set('hasRole', (roles: string[], targetRole: string, context: PolicyEvaluationContext) => {
            return context.principal.roles.includes(targetRole);
        });

        this.builtInFunctions.set('hasAttribute', (attributePath: string, context: PolicyEvaluationContext) => {
            const parts = attributePath.split('.');
            let current: any = context;

            for (const part of parts) {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                } else {
                    return false;
                }
            }

            return current !== undefined && current !== null;
        });
    }

    /**
     * Initialize default policies
     */
    private async initializeDefaultPolicies(): Promise<void> {
        const defaultPolicies: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
                name: 'System Administrator Policy',
                description: 'Full access for system administrators',
                version: '1.0',
                isActive: true,
                variables: {},
                functions: {},
                statements: [
                    {
                        id: 'admin-full-access',
                        description: 'System admins have full access',
                        effect: 'allow',
                        priority: 1000,
                        resources: ['*'],
                        actions: ['*'],
                        principals: ['admin', 'system_admin'],
                        metadata: {}
                    }
                ],
                tags: ['system', 'admin'],
                metadata: { system: true }
            },
            {
                name: 'Default Deny Policy',
                description: 'Default deny for sensitive operations',
                version: '1.0',
                isActive: true,
                variables: {},
                functions: {},
                statements: [
                    {
                        id: 'deny-high-risk-default',
                        description: 'Deny high-risk operations by default',
                        effect: 'deny',
                        priority: 100,
                        resources: ['security', 'user'],
                        actions: ['delete', 'admin'],
                        principals: ['*'],
                        condition: {
                            type: 'operator',
                            operator: 'not',
                            arguments: [
                                {
                                    type: 'function',
                                    function: 'hasAttribute',
                                    arguments: [
                                        {
                                            type: 'literal',
                                            value: 'principal.attributes.confirmed',
                                            metadata: {}
                                        }
                                    ],
                                    metadata: {}
                                }
                            ],
                            metadata: {}
                        },
                        metadata: {}
                    }
                ],
                tags: ['security', 'default'],
                metadata: { system: true }
            }
        ];

        // Create default policies
        for (const policy of defaultPolicies) {
            try {
                await this.createPolicy(policy);
            } catch (error) {
                // Policy might already exist, continue
                console.debug(`Policy creation skipped: ${error}`);
            }
        }
    }

    /**
     * Get policy engine statistics
     */
    getPolicyStats(): {
        policies: { total: number; active: number; byVersion: Record<string, number> };
        cache: { size: number; hitRate?: number };
        performance: { avgEvaluationTime?: number };
    } {
        const policies = Array.from(this.policies.values());

        const policyStats = {
            total: policies.length,
            active: policies.filter(p => p.isActive).length,
            byVersion: policies.reduce((acc, p) => {
                acc[p.version] = (acc[p.version] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        const cacheStats = {
            size: this.decisionCache.size
        };

        const performanceStats = {};

        return {
            policies: policyStats,
            cache: cacheStats,
            performance: performanceStats
        };
    }
}

export default PolicyEngine;