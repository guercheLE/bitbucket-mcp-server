/**
 * Jira Integration Types for Bitbucket Data Center REST API
 * Based on official documentation: https://developer.atlassian.com/server/bitbucket/rest/v906/intro/
 */

import { Link, PagedResponse, PaginationParams } from './base.types.js';

// Jira issue
export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  reporter: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  created: string;
  updated: string;
  project: {
    key: string;
    name: string;
  };
  issueType: {
    name: string;
    iconUrl: string;
  };
  links: {
    self: Link[];
  };
}

// Jira project
export interface JiraProject {
  key: string;
  name: string;
  description?: string;
  lead: {
    name: string;
    displayName: string;
    emailAddress: string;
  };
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  properties: Record<string, any>;
  links: {
    self: Link[];
  };
}

// Jira integration settings
export interface JiraIntegrationSettings {
  enabled: boolean;
  serverUrl: string;
  username?: string;
  password?: string;
  oauth?: {
    consumerKey: string;
    consumerSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  projectMappings: Array<{
    bitbucketProject: string;
    jiraProject: string;
  }>;
}

// Jira integration request
export interface JiraIntegrationRequest {
  enabled: boolean;
  serverUrl: string;
  username?: string;
  password?: string;
  oauth?: {
    consumerKey: string;
    consumerSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  projectMappings?: Array<{
    bitbucketProject: string;
    jiraProject: string;
  }>;
}

// Jira issue link
export interface JiraIssueLink {
  id: string;
  issueKey: string;
  issueId: string;
  repository: {
    slug: string;
    project: {
      key: string;
    };
  };
  commit?: {
    id: string;
    displayId: string;
    message: string;
    author: {
      name: string;
      emailAddress: string;
    };
    authorTimestamp: string;
  };
  pullRequest?: {
    id: number;
    title: string;
    state: string;
    author: {
      name: string;
      displayName: string;
    };
    createdDate: string;
  };
  createdDate: string;
  links: {
    self: Link[];
  };
}

// Jira issue link request
export interface JiraIssueLinkRequest {
  issueKey: string;
  repository: {
    slug: string;
    project: {
      key: string;
    };
  };
  commit?: {
    id: string;
  };
  pullRequest?: {
    id: number;
  };
}

// Jira issue link list response
export interface JiraIssueLinkListResponse extends PagedResponse<JiraIssueLink> {}

// Jira integration query parameters
export interface JiraIntegrationQueryParams extends PaginationParams {
  issueKey?: string;
  repository?: string;
  project?: string;
}
