import { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { AuthenticationService } from '../../src/services/auth';

describe('Authentication service', () => {
  it('detects Bitbucket Cloud instances', () => {
    const service = new AuthenticationService();
    expect(service.detectEnvironment('https://api.bitbucket.org')).toBe('cloud');
  });

  it('detects Bitbucket Data Center instances', () => {
    const service = new AuthenticationService();
    expect(service.detectEnvironment('https://bitbucket.internal.example.com')).toBe('data-center');
  });

  it('builds authenticated axios instances', async () => {
    const service = new AuthenticationService();
    service.configure({
      host: 'https://api.bitbucket.org',
      token: 'demo-token',
    });

    const client = service.createHttpClient();
    const mock = new MockAdapter(client);

    mock.onGet('/2.0/user').reply((config: AxiosRequestConfig) => {
      expect(config.headers?.Authorization).toBe('Bearer demo-token');
      return [200, { uuid: '123', display_name: 'Jane' }];
    });

    const response = await client.get('/2.0/user');
    expect(response.data.display_name).toBe('Jane');
  });

  it('throws when configuration is incomplete', () => {
    const service = new AuthenticationService();
    expect(() => service.createHttpClient()).toThrow('Authentication service is not configured');
  });

  it('normalizes hosts without protocol and trims trailing slashes', () => {
    const service = new AuthenticationService();
    service.configure({
      host: 'bitbucket.internal.example.com/',
      token: 'demo-token',
    });

    expect(service.isConfigured()).toBe(true);

    const client = service.createHttpClient();
    expect(client.defaults.baseURL).toBe('https://bitbucket.internal.example.com');
    expect(service.getAuthHeaders()).toEqual({ Authorization: 'Bearer demo-token' });
  });

  it('rejects configuration without host or token', () => {
    const service = new AuthenticationService();
    expect(() =>
      service.configure({
        host: '',
        token: '',
      }),
    ).toThrow('Both host and token are required to configure authentication');
  });
});
