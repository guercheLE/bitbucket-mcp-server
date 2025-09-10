/**
 * Base Types for Bitbucket Cloud REST API
 * Common types used across all API modules
 */

// Base Link interface for Cloud API
export interface Link {
  href: string;
  name?: string;
}

// Base pagination response structure for Cloud API
export interface PagedResponse<T> {
  values: T[];
  page: number;
  pagelen: number;
  size: number;
  next?: string;
  previous?: string;
}

// Base pagination parameters
export interface PaginationParams {
  page?: number;
  pagelen?: number;
}

// Base error response
export interface ErrorResponse {
  type: string;
  error: {
    message: string;
    detail?: string;
    fields?: Record<string, string[]>;
  };
}
