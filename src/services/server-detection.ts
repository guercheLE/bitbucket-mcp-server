/**
 * Server Detection Service
 * Automatically detects Bitbucket server type and capabilities
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';

// Types
export interface ServerCapabilities {
  supportsOAuth: boolean;
  supportsPersonalTokens: boolean;
  supportsAppPasswords: boolean;
  supportsBasicAuth: boolean;
}

export interface ServerInfo {
  type: 'datacenter' | 'cloud';
  version: string;
  buildNumber?: string | undefined;
  capabilities: ServerCapabilities;
}

// Schemas
const DataCenterResponseSchema = z.object({
  version: z.string().optional(),
  buildNumber: z.string().optional(),
  buildDate: z.string().optional(),
  displayName: z.string().optional(),
});

// Cloud response schema (currently unused but available for future use)
// const CloudResponseSchema = z.object({
//   type: z.literal('cloud'),
//   version: z.literal('cloud'),
//   displayName: z.string().optional(),
// });

// Cache for server detection results
const serverCache = new Map<string, { info: ServerInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Detect server type and capabilities
 */
export async function detectServerType(url: string): Promise<ServerInfo> {
  // Validate URL
  validateUrl(url);
  
  // Check cache first
  const cached = serverCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.info;
  }
  
  try {
    // Try Data Center detection first
    const info = await detectDataCenter(url);
    
    // Cache the result
    serverCache.set(url, {
      info,
      timestamp: Date.now(),
    });
    
    return info;
  } catch (error) {
    // Clear cache on error
    serverCache.delete(url);
    throw error;
  }
}

/**
 * Detect Data Center server
 */
async function detectDataCenter(url: string): Promise<ServerInfo> {
  try {
    // Try the main application properties endpoint
    const response = await makeRequest(`${url}/rest/api/1.0/application-properties`);
    const data = DataCenterResponseSchema.parse(response.data);
    
    return {
      type: 'datacenter',
      version: data.version || 'unknown',
      buildNumber: data.buildNumber,
      capabilities: getDataCenterCapabilities(data.version || 'unknown'),
    };
  } catch (error) {
    // Try fallback for older versions (7.16)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return await detectDataCenterFallback(url);
    }
    throw new Error(`Failed to detect Data Center server: ${error}`);
  }
}

/**
 * Fallback detection for older Data Center versions
 */
async function detectDataCenterFallback(url: string): Promise<ServerInfo> {
  try {
    // Try alternative endpoint for older versions
    const response = await makeRequest(`${url}/rest/api/1.0/application-properties/version`);
    const data = DataCenterResponseSchema.parse(response.data);
    
    return {
      type: 'datacenter',
      version: data.version || '7.16.0', // Default to 7.16 if version not found
      buildNumber: data.buildNumber,
      capabilities: getDataCenterCapabilities(data.version || '7.16.0'),
    };
  } catch (error) {
    throw new Error(`Failed to detect server type: ${error}`);
  }
}

/**
 * Get capabilities based on Data Center version
 */
function getDataCenterCapabilities(version: string): ServerCapabilities {
  const versionNumber = parseVersion(version);
  
  return {
    supportsOAuth: versionNumber >= 8.0,
    supportsPersonalTokens: true, // Available in all Data Center versions
    supportsAppPasswords: true, // Available in all Data Center versions
    supportsBasicAuth: true, // Available in all Data Center versions
  };
}

/**
 * Get capabilities for Cloud
 */
// Cloud capabilities function (currently unused but available for future use)
// function getCloudCapabilities(): ServerCapabilities {
//   return {
//     supportsOAuth: true,
//     supportsPersonalTokens: true,
//     supportsAppPasswords: false, // Not available in Cloud
//     supportsBasicAuth: false, // Not available in Cloud
//   };
// }

/**
 * Parse version string to number for comparison
 */
function parseVersion(version: string): number {
  const parts = version.split('.');
  if (parts.length < 2) return 0;
  
  const major = parseInt(parts[0] || '0', 10) || 0;
  const minor = parseInt(parts[1] || '0', 10) || 0;
  
  return major + minor / 10;
}

/**
 * Make HTTP request with timeout and retry logic
 */
async function makeRequest(url: string, retries = 3): Promise<AxiosResponse> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'bitbucket-mcp-server/1.0.0',
        },
      });
      
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Validate URL format and requirements
 */
function validateUrl(url: string): void {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'https:') {
      throw new Error('HTTPS is required');
    }
    
    if (!urlObj.hostname) {
      throw new Error('Invalid hostname');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid URL format');
    }
    throw error;
  }
}

/**
 * Clear server detection cache
 */
export function clearServerCache(): void {
  serverCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: serverCache.size,
    entries: Array.from(serverCache.keys()),
  };
}
