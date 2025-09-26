import {
  AuthService,
  type AuthCredentials,
  type AuthMethod,
  type AuthStrategy,
} from '../../src/services/authService';
import type { Logger } from '../../src/utils/logger';

type LoggerStub = Logger & {
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
};

const createLoggerStub = (): LoggerStub => {
  const stub: Partial<LoggerStub> = {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    child: jest.fn(),
  };
  (stub.child as jest.Mock).mockReturnValue(stub as Logger);
  return stub as LoggerStub;
};

const createStrategy = <TInput = AuthCredentials>(
  name: AuthMethod,
  implementation: {
    authenticate?: jest.Mock<
      Promise<{ authenticated: boolean; user?: { id: string; name: string } }>,
      [TInput]
    >;
    canHandle?: jest.Mock<boolean, [AuthCredentials]>;
  } = {},
): AuthStrategy<TInput> & { authenticate: jest.Mock; canHandle?: jest.Mock } => {
  const authenticate =
    implementation.authenticate ?? jest.fn().mockResolvedValue({ authenticated: true });
  const canHandle = implementation.canHandle;
  return {
    name,
    authenticate,
    ...(canHandle ? { canHandle } : {}),
  } as AuthStrategy<TInput> & { authenticate: jest.Mock; canHandle?: jest.Mock };
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers strategies and reports availability', () => {
    const logger = createLoggerStub();
    const service = new AuthService({ logger });

    expect(service.hasStrategies()).toBe(false);
    expect(service.hasStrategy('oauth2')).toBe(false);

    const strategy = createStrategy('oauth2');
    service.registerStrategy(strategy);

    expect(service.hasStrategies()).toBe(true);
    expect(service.hasStrategy('oauth2')).toBe(true);
    expect(service.getRegisteredStrategies()).toContain('oauth2');
  });

  it('returns false when OAuth2 strategy is missing', async () => {
    const logger = createLoggerStub();
    const service = new AuthService({ logger });

    const result = await service.authenticateOAuth2({ accessToken: 'token' });

    expect(logger.warn).toHaveBeenCalledWith('OAuth2 strategy not configured');
    expect(result).toEqual({ authenticated: false });
  });

  it('handles OAuth2 strategy failures gracefully', async () => {
    const logger = createLoggerStub();
    const failingStrategy = createStrategy('oauth2', {
      authenticate: jest.fn().mockRejectedValue(new Error('boom')),
    });
    const service = new AuthService({ logger, strategies: { oauth2: failingStrategy } });

    const result = await service.authenticateOAuth2({ accessToken: 'token' });

    expect(failingStrategy.authenticate).toHaveBeenCalledWith({ accessToken: 'token' });
    expect(logger.error).toHaveBeenCalledWith('OAuth2 authentication failed', { error: 'boom' });
    expect(result).toEqual({ authenticated: false });
  });

  it('tries fallback strategies according to priority and credentials', async () => {
    const logger = createLoggerStub();
    const oauthStrategy = createStrategy('oauth2');
    const bearerStrategy = createStrategy('bearer', {
      authenticate: jest
        .fn()
        .mockResolvedValue({ authenticated: true, user: { id: 'b-1', name: 'Bearer User' } }),
    });

    const service = new AuthService({
      logger,
      config: { priority: ['oauth2', 'bearer'] },
      strategies: {
        oauth2: oauthStrategy,
        bearer: bearerStrategy,
      },
    });

    const credentials: AuthCredentials = {
      bearer: { token: 'bearer-token' },
    };

    const result = await service.authenticateWithFallback(credentials);

    expect(oauthStrategy.authenticate).not.toHaveBeenCalled();
    expect(bearerStrategy.authenticate).toHaveBeenCalledWith({ token: 'bearer-token' });
    expect(result).toEqual({
      authenticated: true,
      user: { id: 'b-1', name: 'Bearer User' },
      methodUsed: 'bearer',
    });
  });

  it('skips strategies when canHandle returns false or credentials missing', async () => {
    const logger = createLoggerStub();
    const apiKeyStrategy = createStrategy('apiKey', {
      authenticate: jest.fn().mockResolvedValue({ authenticated: true }),
      canHandle: jest.fn().mockReturnValue(false),
    });
    const basicStrategy = createStrategy('basic', {
      authenticate: jest
        .fn()
        .mockResolvedValue({ authenticated: true, user: { id: 'ok', name: 'Basic' } }),
    });

    const service = new AuthService({
      logger,
      config: { priority: ['apiKey', 'oauth2', 'basic'] },
      strategies: {
        apiKey: apiKeyStrategy,
        basic: basicStrategy,
      },
    });

    const credentials: AuthCredentials = {
      basic: { username: 'user', password: 'pass' },
    };

    const result = await service.authenticateWithFallback(credentials);

    expect(apiKeyStrategy.canHandle).toHaveBeenCalledWith(credentials);
    expect(apiKeyStrategy.authenticate).not.toHaveBeenCalled();
    expect(basicStrategy.authenticate).toHaveBeenCalledWith({ username: 'user', password: 'pass' });
    expect(result).toEqual({
      authenticated: true,
      user: { id: 'ok', name: 'Basic' },
      methodUsed: 'basic',
    });
  });

  it('returns unauthenticated result when all strategies fail', async () => {
    const logger = createLoggerStub();
    const failingStrategy = createStrategy('oauth2', {
      authenticate: jest.fn().mockRejectedValue(new Error('nope')),
    });

    const service = new AuthService({
      logger,
      config: { priority: ['oauth2'] },
      strategies: { oauth2: failingStrategy },
    });

    const result = await service.authenticateWithFallback({ oauth2: { accessToken: 'bad' } });

    expect(logger.warn).toHaveBeenCalledWith('Authentication strategy failed', {
      method: 'oauth2',
      error: 'nope',
    });
    expect(result).toEqual({ authenticated: false, methodUsed: null });
  });
});
