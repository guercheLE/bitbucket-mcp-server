/**
 * Dashboard Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse } from './base.types.js';

// Dashboard Types
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  owner: DashboardOwner;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  shared: boolean;
  createdDate: number;
  updatedDate: number;
  links: Link[];
}

export interface DashboardOwner {
  id: number;
  name: string;
  emailAddress: string;
  displayName: string;
  slug: string;
  type: DashboardUserType;
  active: boolean;
  links: Link[];
}

export type DashboardUserType = 'NORMAL' | 'SERVICE';

// Dashboard Widget Types
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  configuration: WidgetConfiguration;
  position: WidgetPosition;
  size: WidgetSize;
  refreshInterval?: number;
  enabled: boolean;
}

export type WidgetType =
  | 'REPOSITORY_LIST'
  | 'PULL_REQUEST_LIST'
  | 'BUILD_STATUS'
  | 'COMMIT_ACTIVITY'
  | 'USER_ACTIVITY'
  | 'PROJECT_SUMMARY'
  | 'CUSTOM_QUERY'
  | 'WEBHOOK_STATUS'
  | 'SYSTEM_HEALTH'
  | 'RECENT_ACTIVITY';

export interface WidgetConfiguration {
  [key: string]: any;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

// Dashboard Layout Types
export interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: number;
  responsive: boolean;
}

// Dashboard Request Types
export interface DashboardCreateRequest {
  name: string;
  description?: string;
  widgets?: DashboardWidget[];
  layout?: DashboardLayout;
  shared?: boolean;
}

export interface DashboardUpdateRequest {
  name?: string;
  description?: string;
  widgets?: DashboardWidget[];
  layout?: DashboardLayout;
  shared?: boolean;
}

export interface DashboardQueryParams {
  start?: number;
  limit?: number;
  owner?: string;
  shared?: boolean;
  name?: string;
}

// Dashboard Response Types
export interface DashboardResponse extends Dashboard {}

export interface DashboardListResponse extends PagedResponse<Dashboard> {}

// Widget Types
export interface Widget {
  id: string;
  type: WidgetType;
  name: string;
  description?: string;
  category: WidgetCategory;
  configurationSchema?: Record<string, any>;
  defaultConfiguration?: WidgetConfiguration;
  defaultSize?: WidgetSize;
  supportedLayouts?: string[];
  links: Link[];
}

export type WidgetCategory =
  | 'REPOSITORY'
  | 'PULL_REQUEST'
  | 'BUILD'
  | 'ACTIVITY'
  | 'SYSTEM'
  | 'CUSTOM';

// Widget Request Types
export interface WidgetCreateRequest {
  type: WidgetType;
  title: string;
  configuration: WidgetConfiguration;
  position: WidgetPosition;
  size: WidgetSize;
  refreshInterval?: number;
}

export interface WidgetUpdateRequest {
  title?: string;
  configuration?: WidgetConfiguration;
  position?: WidgetPosition;
  size?: WidgetSize;
  refreshInterval?: number;
  enabled?: boolean;
}

// Widget Response Types
export interface WidgetResponse extends Widget {}

export interface WidgetListResponse {
  widgets: Widget[];
  total: number;
}

// Dashboard Data Types
export interface DashboardData {
  dashboardId: string;
  widgetId: string;
  data: WidgetData;
  lastUpdated: number;
  nextRefresh?: number;
}

export interface WidgetData {
  type: string;
  content: any;
  metadata?: Record<string, any>;
}

export interface DashboardDataResponse extends DashboardData {}

export interface DashboardDataListResponse {
  data: DashboardData[];
  total: number;
}

// Dashboard Preferences Types
export interface DashboardPreferences {
  userId: number;
  defaultDashboard?: string;
  refreshInterval: number;
  autoRefresh: boolean;
  theme: DashboardTheme;
  layout: UserLayoutPreferences;
}

export type DashboardTheme = 'LIGHT' | 'DARK' | 'AUTO';

export interface UserLayoutPreferences {
  compactMode: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface DashboardPreferencesResponse extends DashboardPreferences {}

// Dashboard Analytics Types
export interface DashboardAnalytics {
  dashboardId: string;
  views: number;
  uniqueViewers: number;
  averageViewTime: number;
  lastViewed: number;
  popularWidgets: WidgetAnalytics[];
}

export interface WidgetAnalytics {
  widgetId: string;
  widgetType: WidgetType;
  views: number;
  interactions: number;
  averageViewTime: number;
}

export interface DashboardAnalyticsResponse extends DashboardAnalytics {}

export interface DashboardAnalyticsListResponse {
  analytics: DashboardAnalytics[];
  total: number;
}

// Dashboard Sharing Types
export interface DashboardShare {
  id: string;
  dashboardId: string;
  sharedWith: ShareTarget;
  permissions: SharePermissions;
  createdDate: number;
  createdBy: DashboardOwner;
}

export interface ShareTarget {
  type: ShareTargetType;
  id: string;
  name: string;
}

export type ShareTargetType = 'USER' | 'GROUP' | 'ROLE';

export interface SharePermissions {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
}

export interface DashboardShareResponse extends DashboardShare {}

export interface DashboardShareListResponse {
  shares: DashboardShare[];
  total: number;
}

export interface DashboardShareRequest {
  sharedWith: ShareTarget;
  permissions: SharePermissions;
}

// Dashboard Template Types
export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  defaultConfiguration?: Record<string, any>;
  createdBy: DashboardOwner;
  createdDate: number;
  updatedDate: number;
  links: Link[];
}

export type TemplateCategory = 'DEFAULT' | 'PROJECT' | 'REPOSITORY' | 'TEAM' | 'CUSTOM';

export interface DashboardTemplateResponse extends DashboardTemplate {}

export interface DashboardTemplateListResponse {
  templates: DashboardTemplate[];
  total: number;
}

export interface DashboardTemplateQueryParams {
  start?: number;
  limit?: number;
  category?: TemplateCategory;
  createdBy?: string;
}
