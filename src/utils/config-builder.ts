import { BitbucketConfig } from '@/types/config';

/**
 * Constrói uma configuração do Bitbucket a partir dos parâmetros validados
 * @param params Parâmetros validados contendo as credenciais
 * @returns Configuração do Bitbucket
 */
export function buildConfig(params: any): BitbucketConfig {
  return {
    baseUrl: params.serverUrl || params.baseUrl,
    serverType: params.serverType || 'cloud',
    auth: {
      type: params.authType || 'api_token',
      credentials: {
        username: params.username,
        token: params.token || params.password,
        serverUrl: params.serverUrl || params.baseUrl,
        ...(params.clientId && { clientId: params.clientId }),
        ...(params.clientSecret && { clientSecret: params.clientSecret }),
        ...(params.accessToken && { accessToken: params.accessToken }),
        ...(params.refreshToken && { refreshToken: params.refreshToken }),
        ...(params.expiresIn && { expiresIn: params.expiresIn }),
        ...(params.scope && { scope: params.scope }),
      },
    },
    timeouts: {
      read: 30000,
      write: 30000,
      connect: 10000,
    },
    rateLimit: {
      requestsPerMinute: 60,
      burstLimit: 10,
      retryAfter: 1000,
    },
    // logging: {
    //   level: 'info',
    //   enableHttpLogging: true,
    // },
  };
}
