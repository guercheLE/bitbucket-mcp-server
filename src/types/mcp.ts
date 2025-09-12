import { z } from 'zod';
import { ServerTypeSchema } from './config';

// MCP Tool Handler type
export type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult>;

// MCP Tool Result
export const ToolResultSchema = z.object({
  content: z.array(
    z.object({
      type: z.enum(['text', 'image', 'resource']),
      text: z.string().optional(),
      data: z.string().optional(),
      mimeType: z.string().optional(),
    })
  ),
  isError: z.boolean().default(false),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

// MCP Tool Schema
export const MCPToolSchema = z.object({
  name: z
    .string()
    .regex(
      /^mcp_bitbucket_[a-z_]+$/,
      'Tool name must follow pattern: mcp_bitbucket_[category]_[operation]'
    ),
  description: z.string().min(1, 'Tool description is required'),
  inputSchema: z.any(), // Zod schema (can be object, union, etc.)
  handler: z.function().returns(z.promise(ToolResultSchema)),
  serverType: z.array(ServerTypeSchema).min(1, 'At least one server type must be supported'),
  category: z.string().min(1, 'Tool category is required'),
  operation: z.string().min(1, 'Tool operation is required'),
});

export type MCPTool = z.infer<typeof MCPToolSchema>;

// MCP Server Info
export const ServerInfoSchema = z.object({
  name: z.string().default('Bitbucket MCP Server'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning'),
  serverType: ServerTypeSchema,
  baseUrl: z.string().url('Base URL must be valid'),
  toolsLoaded: z.number().int().min(0, 'Tools loaded must be non-negative'),
  uptime: z.number().min(0, 'Uptime must be non-negative'),
});

export type ServerInfo = z.infer<typeof ServerInfoSchema>;

// Tool Categories
export const ToolCategorySchema = z.enum([
  'auth',
  'repository',
  'pull-request',
  'project',
  'issue',
  'pipeline',
  'webhook',
  'snippet',
  'keys',
  'security',
  'permissions',
  'oauth',
  'search',
  'dashboard',
]);

export type ToolCategory = z.infer<typeof ToolCategorySchema>;

// Tool Operations
export const ToolOperationSchema = z.enum([
  'create',
  'read',
  'get',
  'update',
  'delete',
  'list',
  'search',
  'merge',
  'decline',
  'approve',
  'authenticate',
  'refresh',
  'revoke',
  'upload',
  'download',
]);

export type ToolOperation = z.infer<typeof ToolOperationSchema>;

// Tool Registration Info
export const ToolRegistrationSchema = z.object({
  name: z.string(),
  category: ToolCategorySchema,
  operation: ToolOperationSchema,
  serverType: z.array(ServerTypeSchema),
  description: z.string(),
  inputSchema: z.record(z.unknown()),
});

export type ToolRegistration = z.infer<typeof ToolRegistrationSchema>;

// Command Option Schema
export const CommandOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
  description: z.string().min(1, 'Option description is required'),
  type: z.enum(['string', 'number', 'boolean', 'array']),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  choices: z.array(z.string()).optional(),
});

export type CommandOption = z.infer<typeof CommandOptionSchema>;

// Command Argument Schema
export const CommandArgumentSchema = z.object({
  name: z.string().min(1, 'Argument name is required'),
  description: z.string().min(1, 'Argument description is required'),
  type: z.enum(['string', 'number', 'boolean', 'array']),
  required: z.boolean().default(true),
});

export type CommandArgument = z.infer<typeof CommandArgumentSchema>;

// Command Handler type
export type CommandHandler = (options: Record<string, unknown>, args: string[]) => Promise<void>;

// CLI Command Schema
export const CLICommandSchema = z.object({
  name: z.string().min(1, 'Command name is required'),
  description: z.string().min(1, 'Command description is required'),
  category: ToolCategorySchema,
  options: z.array(CommandOptionSchema).default([]),
  arguments: z.array(CommandArgumentSchema).default([]),
  handler: z.function().returns(z.promise(z.void())),
  serverType: z.array(ServerTypeSchema).min(1, 'At least one server type must be supported'),
});

export type CLICommand = z.infer<typeof CLICommandSchema>;

// MCP Error Schema
export const MCPErrorSchema = z.object({
  code: z.string().min(1, 'Error code is required'),
  message: z.string().min(1, 'Error message is required'),
  details: z.record(z.unknown()).optional(),
  timestamp: z.union([z.string(), z.date()]).optional(),
});

export type MCPError = z.infer<typeof MCPErrorSchema>;

// Tool Loading Result
export const ToolLoadingResultSchema = z.object({
  loaded: z.array(z.string()),
  failed: z.array(
    z.object({
      name: z.string(),
      error: z.string(),
    })
  ),
  total: z.number().int().min(0),
});

export type ToolLoadingResult = z.infer<typeof ToolLoadingResultSchema>;

// Server State Schema
export const ServerStateSchema = z.object({
  status: z.enum(['starting', 'running', 'stopping', 'stopped', 'error']),
  startTime: z.date(),
  config: z.record(z.unknown()),
  toolsLoaded: z.number().int().min(0),
  lastActivity: z.date().optional(),
});

export type ServerState = z.infer<typeof ServerStateSchema>;

// Validation helpers
export const validateMCPTool = (tool: unknown): MCPTool => {
  return MCPToolSchema.parse(tool);
};

export const validateServerInfo = (info: unknown): ServerInfo => {
  return ServerInfoSchema.parse(info);
};

export const validateCLICommand = (command: unknown): CLICommand => {
  return CLICommandSchema.parse(command);
};

export const validateToolResult = (result: unknown): ToolResult => {
  return ToolResultSchema.parse(result);
};

export const validateMCPError = (error: unknown): MCPError => {
  return MCPErrorSchema.parse(error);
};

// Tool name generator utility
export const generateToolName = (category: ToolCategory, operation: ToolOperation): string => {
  return `mcp_bitbucket_${category}_${operation}`;
};

// Tool validation utility
export const isValidToolName = (name: string): boolean => {
  return /^mcp_bitbucket_[a-z_]+$/.test(name);
};

// Server type compatibility check
export const isToolCompatible = (tool: MCPTool, serverType: string): boolean => {
  return tool.serverType.includes(serverType as any);
};
