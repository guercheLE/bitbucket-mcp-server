// @ts-nocheck
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT_PATH = path.resolve(__dirname, '../../src/scripts/maintenance/monitor-vulnerabilities.sh');

const writeExecutable = (filePath, content) => {
    fs.writeFileSync(filePath, content, { mode: 0o755 });
};

describe('monitor-vulnerabilities.sh', () => {
    let tempDir;
    let logFile;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'monitor-vuln-'));
        logFile = path.join(tempDir, 'npm.log');
        fs.writeFileSync(logFile, '');

        const npmScript = `#!/usr/bin/env node
const fs = require('fs');
const logFile = process.env.MOCK_LOG_FILE;
const args = process.argv.slice(2).join(' ');
if (logFile) {
    fs.appendFileSync(logFile, args + '\\n');
}
const shouldFail = process.env.NPM_AUDIT_FAIL === 'true';
process.exit(shouldFail ? 1 : 0);
`;

        writeExecutable(path.join(tempDir, 'npm'), npmScript);
    });

    afterEach(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('passes when no vulnerabilities are found', () => {
        const result = spawnSync('bash', [SCRIPT_PATH], {
            env: {
                ...process.env,
                PATH: `${tempDir}:${process.env.PATH}`,
                MOCK_LOG_FILE: logFile,
                NPM_AUDIT_FAIL: 'false',
            },
            encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        expect(fs.readFileSync(logFile, 'utf-8')).toContain('audit --audit-level=critical');
    });

    test('passes along severity level flag', () => {
        const result = spawnSync('bash', [SCRIPT_PATH, '--level=high'], {
            env: {
                ...process.env,
                PATH: `${tempDir}:${process.env.PATH}`,
                MOCK_LOG_FILE: logFile,
                NPM_AUDIT_FAIL: 'false',
            },
            encoding: 'utf-8',
        });

        expect(result.status).toBe(0);
        expect(fs.readFileSync(logFile, 'utf-8')).toContain('audit --audit-level=high');
    });

    test('fails when vulnerabilities are detected', () => {
        const result = spawnSync('bash', [SCRIPT_PATH], {
            env: {
                ...process.env,
                PATH: `${tempDir}:${process.env.PATH}`,
                MOCK_LOG_FILE: logFile,
                NPM_AUDIT_FAIL: 'true',
            },
            encoding: 'utf-8',
        });

        expect(result.status).toBe(1);
    });
});
