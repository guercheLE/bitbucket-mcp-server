import path from 'node:path';

const existsSyncMock = jest.fn();
const mkdirSyncMock = jest.fn();

jest.mock('node:fs', () => ({
    __esModule: true,
    default: {
        existsSync: existsSyncMock,
        mkdirSync: mkdirSyncMock,
    },
}));

const dailyRotateFileCtor = jest.fn();

jest.mock('winston-daily-rotate-file', () => ({
    __esModule: true,
    default: dailyRotateFileCtor,
}));

const consoleTransportCtor = jest.fn();

jest.mock('winston', () => ({
    transports: {
        Console: consoleTransportCtor,
    },
}));

const createLoggerMock = jest.fn();

jest.mock('../../../src/utils/logger', () => ({
    createLogger: createLoggerMock,
}));

import fs from 'node:fs';
import { transports as winstonTransports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { createRotatingLogger } from '../../../src/services/logger';
import { createLogger } from '../../../src/utils/logger';

describe('createRotatingLogger', () => {
    const loggerInstance = { log: jest.fn() } as const;

    beforeEach(() => {
        jest.clearAllMocks();

        existsSyncMock.mockReturnValue(false);
        mkdirSyncMock.mockImplementation(() => undefined);

        dailyRotateFileCtor.mockImplementation(() => ({ type: 'rotate' }));
        consoleTransportCtor.mockImplementation(() => ({ type: 'console' }));

        createLoggerMock.mockReturnValue(loggerInstance);
    });

    it('ensures the log directory exists and configures transports', () => {
        const options = {
            level: 'debug',
            directory: '/var/tmp/logs',
            rotation: {
                filename: 'app-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: false,
                maxSize: '10m',
                maxFiles: '30d',
            },
            defaultMeta: { service: 'test' },
        } as const;

        const result = createRotatingLogger(options);

        expect(fs.existsSync).toHaveBeenCalledWith('/var/tmp/logs');
        expect(fs.mkdirSync).toHaveBeenCalledWith('/var/tmp/logs', { recursive: true });

        expect(DailyRotateFile).toHaveBeenCalledWith({
            filename: path.join(options.directory, options.rotation.filename),
            datePattern: options.rotation.datePattern,
            zippedArchive: options.rotation.zippedArchive,
            maxSize: options.rotation.maxSize,
            maxFiles: options.rotation.maxFiles,
        });

        expect(winstonTransports.Console).toHaveBeenCalledTimes(1);

        const [[loggerOptions]] = (createLogger as jest.Mock).mock.calls;

        expect(loggerOptions.level).toBe(options.level);
        expect(loggerOptions.defaultMeta).toEqual(options.defaultMeta);
        expect(loggerOptions.transports).toHaveLength(2);

        const dailyRotateTransport = dailyRotateFileCtor.mock.results[0]?.value;
        const consoleTransport = consoleTransportCtor.mock.results[0]?.value;

        expect(loggerOptions.transports[0]).toBe(dailyRotateTransport);
        expect(loggerOptions.transports[1]).toBe(consoleTransport);

        expect(result).toBe(loggerInstance);
    });

    it('can disable the console transport when requested', () => {
        const options = {
            console: false,
            directory: '/logs',
        } as const;

        createRotatingLogger(options);

        expect(winstonTransports.Console).not.toHaveBeenCalled();

        const [[loggerOptions]] = (createLogger as jest.Mock).mock.calls;
        expect(loggerOptions.transports).toHaveLength(1);

        const dailyRotateTransport = dailyRotateFileCtor.mock.results[0]?.value;
        expect(loggerOptions.transports[0]).toBe(dailyRotateTransport);
    });

    it('validates rotation options', () => {
        existsSyncMock.mockReturnValue(true);

        expect(() =>
            createRotatingLogger({
                rotation: {
                    maxFiles: 10 as unknown as string,
                },
            }),
        ).toThrow();
    });
});
