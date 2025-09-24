/**
 * Services Index
 * 
 * Centralized export of all service classes and utilities.
 * Provides comprehensive business logic for the MCP server.
 */

export { PipelineService, type PipelineServiceConfig } from './pipeline-service.js';

// Export all services as an array for easy initialization
export const services = [
  PipelineService
];

export default services;
