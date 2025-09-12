/**
 * Unit tests for Server Detection
 * TDD Red Phase - These tests should fail initially
 */

import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Server Detection', () => {
  let serverDetection: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Import the server detection module
    // This will fail initially as the module doesn't exist yet
    const module = await import('@/services/server-detection');
    serverDetection = module;
  });

  describe('Data Center Detection', () => {
    it('should detect Data Center server', async () => {
      const mockResponse = {
        data: {
          version: '8.0.0',
          buildNumber: '8000000',
          buildDate: '2023-01-01T00:00:00Z',
          displayName: 'Bitbucket Data Center',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result).toEqual({
        type: 'datacenter',
        version: '8.0.0',
        buildNumber: '8000000',
        capabilities: expect.objectContaining({
          supportsOAuth: true,
          supportsPersonalTokens: true,
          supportsAppPasswords: true,
          supportsBasicAuth: true,
        }),
      });
    });

    it('should detect Data Center 7.16 with fallback', async () => {
      // Mock first request to fail (old version)
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({
          data: {
            version: '7.16.0',
            buildNumber: '7160000',
            displayName: 'Bitbucket',
          },
          status: 200,
        });

      const result = await serverDetection.detectServerType('https://old-bitbucket.example.com');
      
      expect(result).toEqual({
        type: 'datacenter',
        version: '7.16.0',
        buildNumber: '7160000',
        capabilities: expect.objectContaining({
          supportsOAuth: false,
          supportsPersonalTokens: true,
          supportsAppPasswords: true,
          supportsBasicAuth: true,
        }),
      });
    });

    it('should handle Data Center API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Server error'));

      await expect(
        serverDetection.detectServerType('https://error-bitbucket.example.com')
      ).rejects.toThrow('Failed to detect server type');
    });
  });

  describe('Cloud Detection', () => {
    it('should detect Bitbucket Cloud server', async () => {
      const mockResponse = {
        data: {
          type: 'cloud',
          version: 'cloud',
          displayName: 'Bitbucket Cloud',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://api.bitbucket.org');
      
      expect(result).toEqual({
        type: 'cloud',
        version: 'cloud',
        capabilities: expect.objectContaining({
          supportsOAuth: true,
          supportsPersonalTokens: true,
          supportsAppPasswords: false,
          supportsBasicAuth: false,
        }),
      });
    });

    it('should handle Cloud API rate limiting', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' },
        },
      });

      await expect(
        serverDetection.detectServerType('https://api.bitbucket.org')
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Version Detection', () => {
    it('should extract version from Data Center response', async () => {
      const mockResponse = {
        data: {
          version: '8.5.1',
          buildNumber: '8501000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result.version).toBe('8.5.1');
      expect(result.buildNumber).toBe('8501000');
    });

    it('should handle missing version information', async () => {
      const mockResponse = {
        data: {
          displayName: 'Bitbucket Data Center',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result.version).toBe('unknown');
    });
  });

  describe('Capabilities Detection', () => {
    it('should detect OAuth support for Data Center 8.0+', async () => {
      const mockResponse = {
        data: {
          version: '8.0.0',
          buildNumber: '8000000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result.capabilities.supportsOAuth).toBe(true);
    });

    it('should not detect OAuth support for Data Center 7.x', async () => {
      const mockResponse = {
        data: {
          version: '7.21.0',
          buildNumber: '7210000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result.capabilities.supportsOAuth).toBe(false);
    });

    it('should detect Personal Tokens support for all Data Center versions', async () => {
      const mockResponse = {
        data: {
          version: '7.16.0',
          buildNumber: '7160000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result.capabilities.supportsPersonalTokens).toBe(true);
    });

    it('should detect App Passwords support for Data Center', async () => {
      const mockResponse = {
        data: {
          version: '8.0.0',
          buildNumber: '8000000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result.capabilities.supportsAppPasswords).toBe(true);
    });

    it('should not detect App Passwords support for Cloud', async () => {
      const mockResponse = {
        data: {
          type: 'cloud',
          version: 'cloud',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await serverDetection.detectServerType('https://api.bitbucket.org');
      
      expect(result.capabilities.supportsAppPasswords).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache server detection results', async () => {
      const mockResponse = {
        data: {
          version: '8.0.0',
          buildNumber: '8000000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // First call
      const result1 = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      // Second call should use cache
      const result2 = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result1).toEqual(result2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      const mockResponse = {
        data: {
          version: '8.0.0',
          buildNumber: '8000000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // First call
      await serverDetection.detectServerType('https://bitbucket.example.com');
      
      // Wait for cache to expire
      jest.advanceTimersByTime(300000); // 5 minutes
      
      // Second call should make new request
      await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should clear cache on error', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            version: '8.0.0',
            buildNumber: '8000000',
          },
          status: 200,
        });

      // First call fails
      await expect(
        serverDetection.detectServerType('https://bitbucket.example.com')
      ).rejects.toThrow();

      // Second call should not use cache and succeed
      const result = await serverDetection.detectServerType('https://bitbucket.example.com');
      
      expect(result.version).toBe('8.0.0');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('URL Validation', () => {
    it('should validate URL format', async () => {
      await expect(
        serverDetection.detectServerType('invalid-url')
      ).rejects.toThrow('Invalid URL format');
    });

    it('should validate HTTPS requirement', async () => {
      await expect(
        serverDetection.detectServerType('http://bitbucket.example.com')
      ).rejects.toThrow('HTTPS is required');
    });

    it('should accept valid HTTPS URLs', async () => {
      const mockResponse = {
        data: {
          version: '8.0.0',
          buildNumber: '8000000',
        },
        status: 200,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const validUrls = [
        'https://bitbucket.example.com',
        'https://subdomain.bitbucket.example.com',
        'https://bitbucket.example.com:8443',
      ];

      for (const url of validUrls) {
        await expect(
          serverDetection.detectServerType(url)
        ).resolves.toBeDefined();
      }
    });
  });

  describe('Timeout and Retry Logic', () => {
    it('should handle request timeout', async () => {
      mockedAxios.get.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

      await expect(
        serverDetection.detectServerType('https://slow-bitbucket.example.com')
      ).rejects.toThrow('Request timeout');
    });

    it('should retry failed requests', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            version: '8.0.0',
            buildNumber: '8000000',
          },
          status: 200,
        });

      const result = await serverDetection.detectServerType('https://unstable-bitbucket.example.com');
      
      expect(result.version).toBe('8.0.0');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Persistent network error'));

      await expect(
        serverDetection.detectServerType('https://failing-bitbucket.example.com')
      ).rejects.toThrow('Failed after 3 retries');
    });
  });
});
