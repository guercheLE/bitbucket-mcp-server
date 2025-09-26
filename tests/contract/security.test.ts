import { createRateLimiter } from "../../src/server/security/rateLimiter";
import { createBitbucketCircuitBreaker } from "../../src/services/bitbucketClient";

describe("security contracts", () => {
    describe("rateLimitContract", () => {
        it("rejects requests that exceed the combined limit", async () => {
            const limiter = createRateLimiter({
                max: 1,
                windowMs: 100,
                handler: (_req, res) => {
                    res.status(429).json({ status: 429 });
                }
            });

            const invokeLimiter = async (ip: string, userId?: string) => {
                const req: any = { ip, method: "GET", path: "/test", headers: {}, body: {}, user: userId ? { id: userId } : undefined };
                const res: any = {
                    statusCode: 200,
                    headers: new Map(),
                    setHeader: jest.fn(),
                    getHeader: jest.fn(),
                    status: jest.fn(),
                    send: jest.fn(),
                    end: jest.fn(),
                    json: jest.fn()
                };
                res.status.mockReturnValue(res);

                await new Promise<void>((resolve, reject) => {
                    const finalize = () => resolve();
                    res.json.mockImplementation((payload: unknown) => {
                        res.send(payload);
                        finalize();
                        return res;
                    });
                    res.send.mockImplementation(() => {
                        finalize();
                        return res;
                    });

                    limiter(req, res, (error?: unknown) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        finalize();
                    });
                });

                return res;
            };

            await invokeLimiter("127.0.0.1", "user-1");
            const res = await invokeLimiter("127.0.0.1", "user-1");

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.send).toHaveBeenCalledWith({ status: 429 });
        });
    });

    describe("circuitBreakerContract", () => {
        it("opens the circuit after repeated failures and fails fast", async () => {
            let shouldFail = true;
            const fn = jest.fn().mockImplementation(async () => {
                if (shouldFail) {
                    throw new Error("Bitbucket unavailable");
                }
                return { ok: true };
            });

            const breaker = createBitbucketCircuitBreaker(fn, {
                timeout: 10,
                errorThresholdPercentage: 50,
                resetTimeout: 50
            });

            await expect(breaker.fire()).rejects.toThrow("Bitbucket unavailable");
            await expect(breaker.fire()).rejects.toThrow("Breaker is open");

            shouldFail = false;
            await new Promise((resolve) => setTimeout(resolve, 60));
            const result = await breaker.fire();

            expect(result).toEqual({ ok: true });
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
});
