import type { Request } from 'express';
import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';

export interface CombinedRateLimiterOptions extends Partial<Options> {
  userIdExtractor?: (req: Request) => string | null;
}

const defaultUserIdExtractor = (req: Request): string | null => {
  const headerId = req.headers['x-user-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }

  const forwardedUser = req.headers['x-forwarded-user'];
  if (typeof forwardedUser === 'string' && forwardedUser.trim().length > 0) {
    return forwardedUser.trim();
  }

  const user = (req as Request & { user?: { id?: string } }).user;
  if (user?.id) {
    return user.id;
  }

  return null;
};

const defaultKeyGenerator = (
  req: Request,
  extractUserId: (req: Request) => string | null,
): string => {
  const ip =
    req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
  const userId = extractUserId(req) ?? 'anonymous';
  return `${ip}:${userId}`;
};

const defaultHandler: Options['handler'] = (req, res, _next, optionsUsed) => {
  const body = optionsUsed?.message ?? {
    status: 429,
    message: 'Too many requests',
  };
  res.status(429).send(body);
};

export const createRateLimiter = (
  options: CombinedRateLimiterOptions = {},
): RateLimitRequestHandler => {
  const {
    userIdExtractor = defaultUserIdExtractor,
    handler,
    keyGenerator,
    standardHeaders = true,
    legacyHeaders = false,
    windowMs = 15 * 60 * 1000,
    max = 100,
    ...rest
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders,
    legacyHeaders,
    keyGenerator: keyGenerator ?? ((req) => defaultKeyGenerator(req as Request, userIdExtractor)),
    handler: handler ?? defaultHandler,
    ...rest,
  });
};
