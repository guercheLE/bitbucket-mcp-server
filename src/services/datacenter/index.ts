/**
 * Data Center Services Index
 *
 * Exports all services for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

// Core services
export { AuthenticationService } from './authentication.service.js';
export { ProjectService } from './project.service.js';
export { RepositoryService } from './repository.service.js';
export { PullRequestService } from './pull-request.service.js';
export { RollingUpgradesService } from './rolling-upgrades.service.js';

// Additional services
export { BuildsService } from './builds.service.js';
export { CapabilitiesService } from './capabilities.service.js';
export { DashboardService } from './dashboard.service.js';
export { SearchService } from './search.service.js';
export { SecurityService } from './security.service.js';
export { SystemMaintenanceService } from './system-maintenance.service.js';

// New services
export { JiraIntegrationService } from './jira-integration.service.js';
export { MarkupService } from './markup.service.js';
export { MirroringService } from './mirroring.service.js';
export { PermissionManagementService } from './permission-management.service.js';
export { SamlConfigurationService } from './saml-configuration.service.js';
export { OtherOperationsService } from './other-operations.service.js';
export { DeprecatedService } from './deprecated.service.js';
