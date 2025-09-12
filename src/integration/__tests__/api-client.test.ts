import { ApiClient } from '../api-client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    apiClient = new ApiClient({
      baseUrl: 'https://api.bitbucket.org',
      timeout: 30000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.bitbucket.org',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should set up request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { data: { id: '123', name: 'test' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test-endpoint');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make GET request with config', async () => {
      const mockResponse = { data: { id: '123' } };
      const config = { headers: { Authorization: 'Bearer token' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test-endpoint', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint', config);
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on failed request', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(apiClient.get('/test-endpoint')).rejects.toThrow('Network error');
    });
  });

  describe('post', () => {
    it('should make POST request successfully', async () => {
      const mockResponse = { data: { id: '123', created: true } };
      const requestData = { name: 'test' };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiClient.post('/test-endpoint', requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', requestData, undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request with config', async () => {
      const mockResponse = { data: { id: '123' } };
      const requestData = { name: 'test' };
      const config = { headers: { 'Content-Type': 'application/json' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiClient.post('/test-endpoint', requestData, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', requestData, config);
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on failed request', async () => {
      const error = new Error('Validation error');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(apiClient.post('/test-endpoint', {})).rejects.toThrow('Validation error');
    });
  });

  describe('put', () => {
    it('should make PUT request successfully', async () => {
      const mockResponse = { data: { id: '123', updated: true } };
      const requestData = { name: 'updated' };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await apiClient.put('/test-endpoint', requestData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', requestData, undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on failed request', async () => {
      const error = new Error('Update failed');
      mockAxiosInstance.put.mockRejectedValue(error);

      await expect(apiClient.put('/test-endpoint', {})).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should make DELETE request successfully', async () => {
      const mockResponse = { data: { deleted: true } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiClient.delete('/test-endpoint');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make DELETE request with config', async () => {
      const mockResponse = { data: { deleted: true } };
      const config = { params: { force: true } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiClient.delete('/test-endpoint', config);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint', config);
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on failed request', async () => {
      const error = new Error('Delete failed');
      mockAxiosInstance.delete.mockRejectedValue(error);

      await expect(apiClient.delete('/test-endpoint')).rejects.toThrow('Delete failed');
    });
  });

  describe('patch', () => {
    it('should make PATCH request successfully', async () => {
      const mockResponse = { data: { id: '123', patched: true } };
      const requestData = { name: 'patched' };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiClient.patch('/test-endpoint', requestData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/test-endpoint',
        requestData,
        undefined
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on failed request', async () => {
      const error = new Error('Patch failed');
      mockAxiosInstance.patch.mockRejectedValue(error);

      await expect(apiClient.patch('/test-endpoint', {})).rejects.toThrow('Patch failed');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and recreate axios instance', () => {
      const newConfig = {
        baseUrl: 'https://new-api.bitbucket.org',
        timeout: 60000,
      };

      apiClient.updateConfig(newConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://new-api.bitbucket.org',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = apiClient.getConfig();

      expect(config.baseUrl).toBe('https://api.bitbucket.org');
      expect(config.timeouts.read).toBe(2000);
      expect(config.timeouts.connect).toBe(10000);
      expect(config.auth.type).toBe('none');
    });
  });
});
