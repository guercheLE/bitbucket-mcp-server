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
export declare const PolicyExpressionSchema: z.ZodType<PolicyExpression>;
/**
 * Policy Statement Schema
 */
export declare const PolicyStatementSchema: z.ZodObject<{
    /** Unique statement identifier */
    id: z.ZodString;
    /** Statement description */
    description: z.ZodOptional<z.ZodString>;
    /** Statement effect */
    effect: z.ZodEnum<["allow", "deny"]>;
    /** Statement priority (higher numbers take precedence) */
    priority: z.ZodDefault<z.ZodNumber>;
    /** Resources this statement applies to */
    resources: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Actions this statement applies to */
    actions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Principals (users/roles) this statement applies to */
    principals: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Condition expression for statement evaluation */
    condition: z.ZodOptional<z.ZodType<PolicyExpression, z.ZodTypeDef, PolicyExpression>>;
    /** Statement metadata */
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: Record<string, any>;
    resources: string[];
    actions: string[];
    effect: "allow" | "deny";
    priority: number;
    principals: string[];
    description?: string | undefined;
    condition?: PolicyExpression | undefined;
}, {
    id: string;
    effect: "allow" | "deny";
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    resources?: string[] | undefined;
    actions?: string[] | undefined;
    priority?: number | undefined;
    condition?: PolicyExpression | undefined;
    principals?: string[] | undefined;
}>;
export type PolicyStatement = z.infer<typeof PolicyStatementSchema>;
/**
 * Policy Document Schema
 */
export declare const PolicyDocumentSchema: z.ZodObject<{
    /** Unique policy identifier */
    id: z.ZodString;
    /** Policy name */
    name: z.ZodString;
    /** Policy description */
    description: z.ZodOptional<z.ZodString>;
    /** Policy version */
    version: z.ZodDefault<z.ZodString>;
    /** Policy statements */
    statements: z.ZodArray<z.ZodObject<{
        /** Unique statement identifier */
        id: z.ZodString;
        /** Statement description */
        description: z.ZodOptional<z.ZodString>;
        /** Statement effect */
        effect: z.ZodEnum<["allow", "deny"]>;
        /** Statement priority (higher numbers take precedence) */
        priority: z.ZodDefault<z.ZodNumber>;
        /** Resources this statement applies to */
        resources: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        /** Actions this statement applies to */
        actions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        /** Principals (users/roles) this statement applies to */
        principals: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        /** Condition expression for statement evaluation */
        condition: z.ZodOptional<z.ZodType<PolicyExpression, z.ZodTypeDef, PolicyExpression>>;
        /** Statement metadata */
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        metadata: Record<string, any>;
        resources: string[];
        actions: string[];
        effect: "allow" | "deny";
        priority: number;
        principals: string[];
        description?: string | undefined;
        condition?: PolicyExpression | undefined;
    }, {
        id: string;
        effect: "allow" | "deny";
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
        resources?: string[] | undefined;
        actions?: string[] | undefined;
        priority?: number | undefined;
        condition?: PolicyExpression | undefined;
        principals?: string[] | undefined;
    }>, "many">;
    /** Policy variables for dynamic evaluation */
    variables: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /** Policy functions for custom logic */
    functions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    /** Policy tags for organization */
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Whether this policy is active */
    isActive: z.ZodDefault<z.ZodBoolean>;
    /** Policy creation timestamp */
    createdAt: z.ZodDefault<z.ZodDate>;
    /** Policy last modification timestamp */
    updatedAt: z.ZodDefault<z.ZodDate>;
    /** Policy metadata */
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    version: string;
    id: string;
    metadata: Record<string, any>;
    name: string;
    createdAt: Date;
    isActive: boolean;
    updatedAt: Date;
    statements: {
        id: string;
        metadata: Record<string, any>;
        resources: string[];
        actions: string[];
        effect: "allow" | "deny";
        priority: number;
        principals: string[];
        description?: string | undefined;
        condition?: PolicyExpression | undefined;
    }[];
    variables: Record<string, any>;
    functions: Record<string, string>;
    tags: string[];
    description?: string | undefined;
}, {
    id: string;
    name: string;
    statements: {
        id: string;
        effect: "allow" | "deny";
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
        resources?: string[] | undefined;
        actions?: string[] | undefined;
        priority?: number | undefined;
        condition?: PolicyExpression | undefined;
        principals?: string[] | undefined;
    }[];
    version?: string | undefined;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    createdAt?: Date | undefined;
    isActive?: boolean | undefined;
    updatedAt?: Date | undefined;
    variables?: Record<string, any> | undefined;
    functions?: Record<string, string> | undefined;
    tags?: string[] | undefined;
}>;
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;
/**
 * Policy Evaluation Context Schema
 */
export declare const PolicyEvaluationContextSchema: z.ZodObject<{
    /** Principal (user) making the request */
    principal: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodString>;
        roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: string;
        attributes: Record<string, any>;
        roles: string[];
    }, {
        id: string;
        type?: string | undefined;
        attributes?: Record<string, any> | undefined;
        roles?: string[] | undefined;
    }>;
    /** Resource being accessed */
    resource: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: string;
        attributes: Record<string, any>;
    }, {
        id: string;
        type: string;
        attributes?: Record<string, any> | undefined;
    }>;
    /** Action being performed */
    action: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: string;
        attributes: Record<string, any>;
    }, {
        id: string;
        type: string;
        attributes?: Record<string, any> | undefined;
    }>;
    /** Environment context */
    environment: z.ZodDefault<z.ZodObject<{
        timestamp: z.ZodDefault<z.ZodDate>;
        ipAddress: z.ZodOptional<z.ZodString>;
        userAgent: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
        workspaceId: z.ZodOptional<z.ZodString>;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        timestamp: Date;
        attributes: Record<string, any>;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
    }, {
        timestamp?: Date | undefined;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
        attributes?: Record<string, any> | undefined;
    }>>;
    /** Request context */
    request: z.ZodDefault<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        method: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodAny>;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        headers: Record<string, string>;
        attributes: Record<string, any>;
        id?: string | undefined;
        method?: string | undefined;
        path?: string | undefined;
        body?: any;
    }, {
        id?: string | undefined;
        method?: string | undefined;
        headers?: Record<string, string> | undefined;
        path?: string | undefined;
        attributes?: Record<string, any> | undefined;
        body?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    action: {
        id: string;
        type: string;
        attributes: Record<string, any>;
    };
    resource: {
        id: string;
        type: string;
        attributes: Record<string, any>;
    };
    request: {
        headers: Record<string, string>;
        attributes: Record<string, any>;
        id?: string | undefined;
        method?: string | undefined;
        path?: string | undefined;
        body?: any;
    };
    principal: {
        id: string;
        type: string;
        attributes: Record<string, any>;
        roles: string[];
    };
    environment: {
        timestamp: Date;
        attributes: Record<string, any>;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
    };
}, {
    action: {
        id: string;
        type: string;
        attributes?: Record<string, any> | undefined;
    };
    resource: {
        id: string;
        type: string;
        attributes?: Record<string, any> | undefined;
    };
    principal: {
        id: string;
        type?: string | undefined;
        attributes?: Record<string, any> | undefined;
        roles?: string[] | undefined;
    };
    request?: {
        id?: string | undefined;
        method?: string | undefined;
        headers?: Record<string, string> | undefined;
        path?: string | undefined;
        attributes?: Record<string, any> | undefined;
        body?: any;
    } | undefined;
    environment?: {
        timestamp?: Date | undefined;
        sessionId?: string | undefined;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
        workspaceId?: string | undefined;
        attributes?: Record<string, any> | undefined;
    } | undefined;
}>;
export type PolicyEvaluationContext = z.infer<typeof PolicyEvaluationContextSchema>;
/**
 * Policy Decision Schema
 */
export declare const PolicyDecisionSchema: z.ZodObject<{
    /** Decision result */
    decision: z.ZodEnum<["allow", "deny", "indeterminate"]>;
    /** Decision reason */
    reason: z.ZodString;
    /** Applied policy statements */
    appliedStatements: z.ZodArray<z.ZodObject<{
        policyId: z.ZodString;
        statementId: z.ZodString;
        effect: z.ZodEnum<["allow", "deny"]>;
        priority: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        effect: "allow" | "deny";
        priority: number;
        policyId: string;
        statementId: string;
    }, {
        effect: "allow" | "deny";
        priority: number;
        policyId: string;
        statementId: string;
    }>, "many">;
    /** Evaluation metadata */
    evaluationMetadata: z.ZodDefault<z.ZodObject<{
        /** Total policies evaluated */
        policiesEvaluated: z.ZodDefault<z.ZodNumber>;
        /** Total statements evaluated */
        statementsEvaluated: z.ZodDefault<z.ZodNumber>;
        /** Evaluation time in milliseconds */
        evaluationTime: z.ZodDefault<z.ZodNumber>;
        /** Whether result was cached */
        fromCache: z.ZodDefault<z.ZodBoolean>;
        /** Evaluation errors */
        errors: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        errors: string[];
        policiesEvaluated: number;
        statementsEvaluated: number;
        evaluationTime: number;
        fromCache: boolean;
    }, {
        errors?: string[] | undefined;
        policiesEvaluated?: number | undefined;
        statementsEvaluated?: number | undefined;
        evaluationTime?: number | undefined;
        fromCache?: boolean | undefined;
    }>>;
    /** Decision timestamp */
    timestamp: z.ZodDefault<z.ZodDate>;
    /** Decision metadata */
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    metadata: Record<string, any>;
    reason: string;
    decision: "allow" | "deny" | "indeterminate";
    appliedStatements: {
        effect: "allow" | "deny";
        priority: number;
        policyId: string;
        statementId: string;
    }[];
    evaluationMetadata: {
        errors: string[];
        policiesEvaluated: number;
        statementsEvaluated: number;
        evaluationTime: number;
        fromCache: boolean;
    };
}, {
    reason: string;
    decision: "allow" | "deny" | "indeterminate";
    appliedStatements: {
        effect: "allow" | "deny";
        priority: number;
        policyId: string;
        statementId: string;
    }[];
    timestamp?: Date | undefined;
    metadata?: Record<string, any> | undefined;
    evaluationMetadata?: {
        errors?: string[] | undefined;
        policiesEvaluated?: number | undefined;
        statementsEvaluated?: number | undefined;
        evaluationTime?: number | undefined;
        fromCache?: boolean | undefined;
    } | undefined;
}>;
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
 * Policy Engine Class
 */
export declare class PolicyEngine extends EventEmitter {
    private readonly config;
    private readonly auditLogger;
    private policies;
    private decisionCache;
    private builtInFunctions;
    constructor(config?: Partial<PolicyEngineConfig>);
    /**
     * Policy Management
     */
    createPolicy(policy: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyDocument>;
    updatePolicy(policyId: string, updates: Partial<PolicyDocument>): Promise<PolicyDocument>;
    deletePolicy(policyId: string): Promise<void>;
    getPolicy(policyId: string): PolicyDocument | undefined;
    listPolicies(filters?: {
        isActive?: boolean;
        tags?: string[];
        version?: string;
    }): PolicyDocument[];
    /**
     * Policy Evaluation
     */
    evaluatePolicy(context: PolicyEvaluationContext): Promise<PolicyDecision>;
    /**
     * Private helper methods
     */
    private validatePolicy;
    private validateExpression;
    private findApplicablePolicies;
    private isStatementApplicable;
    private evaluatePolicies;
    private evaluateStatement;
    private evaluateExpression;
    private resolveVariable;
    private evaluateFunction;
    private evaluateOperator;
    private resolveConflicts;
    private resolveFirstApplicable;
    private resolveDenyOverrides;
    private resolveAllowOverrides;
    private resolveHighestPriority;
    private generateCacheKey;
    private clearDecisionCache;
    private generatePolicyId;
    /**
     * Initialize built-in functions
     */
    private initializeBuiltInFunctions;
    /**
     * Initialize default policies
     */
    private initializeDefaultPolicies;
    /**
     * Get policy engine statistics
     */
    getPolicyStats(): {
        policies: {
            total: number;
            active: number;
            byVersion: Record<string, number>;
        };
        cache: {
            size: number;
            hitRate?: number;
        };
        performance: {
            avgEvaluationTime?: number;
        };
    };
}
export default PolicyEngine;
//# sourceMappingURL=policy-engine.d.ts.map