// @ts-nocheck
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT_PATH = path.resolve(__dirname, '../../src/scripts/maintenance/update-dependencies.sh');

const writeExecutable = (filePath, content) => {
  fs.writeFileSync(filePath, content, { mode: 0o755 });
};

const createMockBinaries = (dir) => {
  const ncuScript = `#!/usr/bin/env node
const fs = require('fs');
const logFile = process.env.MOCK_LOG_FILE;
const args = process.argv.slice(2).join(' ');
if (logFile) {
    fs.appendFileSync(logFile, 'ncu ' + args + '\\n');
}
if (args.includes('--jsonUpgraded')) {
  const payload = process.env.NCU_HAS_UPDATES === 'true' ? '{"axios":"1.2.3"}' : '{}';
  process.stdout.write(payload);
}
process.exit(0);
`;

  const npmScript = `#!/usr/bin/env node
const fs = require('fs');
const logFile = process.env.MOCK_LOG_FILE;
const args = process.argv.slice(2).join(' ');
if (logFile) {
    fs.appendFileSync(logFile, 'npm ' + args + '\\n');
}
process.exit(0);
`;

  writeExecutable(path.join(dir, 'ncu'), ncuScript);
  writeExecutable(path.join(dir, 'npm'), npmScript);
};

const runScript = (args = [], env = {}) => {
  return spawnSync('bash', [SCRIPT_PATH, ...args], {
    env: { ...process.env, ...env },
    encoding: 'utf-8',
  });
};

describe('update-dependencies.sh', () => {
  let tempDir;
  let logFile;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-deps-'));
    logFile = path.join(tempDir, 'calls.log');
    fs.writeFileSync(logFile, '');
    createMockBinaries(tempDir);
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const getLog = () => fs.readFileSync(logFile, 'utf-8');

  test('exits with code 2 when no updates are available', () => {
    const result = runScript([], {
      PATH: `${tempDir}:${process.env.PATH}`,
      MOCK_LOG_FILE: logFile,
      NCU_HAS_UPDATES: 'false',
    });

    expect(result.status).toBe(2);
    expect(getLog()).toContain('ncu --target minor --jsonUpgraded');
    expect(getLog()).not.toContain('ncu -u');
    expect(getLog()).not.toContain('npm install');
  });

  test('updates dependencies when updates are available', () => {
    const result = runScript([], {
      PATH: `${tempDir}:${process.env.PATH}`,
      MOCK_LOG_FILE: logFile,
      NCU_HAS_UPDATES: 'true',
    });

    expect(result.status).toBe(0);
    const log = getLog();
    expect(log).toContain('ncu --target minor --jsonUpgraded');
    expect(log).toContain('ncu -u --target minor');
    expect(log).toContain('npm install');
  });

  test('performs dry run without installing updates', () => {
    const result = runScript(['--dry-run'], {
      PATH: `${tempDir}:${process.env.PATH}`,
      MOCK_LOG_FILE: logFile,
      NCU_HAS_UPDATES: 'true',
    });

    expect(result.status).toBe(0);
    const log = getLog();
    expect(log).toContain('ncu --target minor --jsonUpgraded');
    expect(log).not.toContain('ncu -u --target minor');
    expect(log).not.toContain('npm install');
  });
});
