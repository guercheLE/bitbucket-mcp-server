// @ts-nocheck
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const SCRIPT_PATH = path.resolve(
  __dirname,
  '../../src/scripts/maintenance/regenerate-embeddings.sh',
);

const writeExecutable = (filePath, content) => {
  fs.writeFileSync(filePath, content, { mode: 0o755 });
};

describe('regenerate-embeddings.sh', () => {
  let tempDir;
  let checksumFile;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'regen-embeddings-'));
    checksumFile = path.join(tempDir, 'checksum.json');

    const curlScript = `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
let outputIndex = args.indexOf('-o');
if (outputIndex === -1) {
  outputIndex = args.indexOf('--output');
}
const outputPath = args[outputIndex + 1];
const content = process.env.CURL_CONTENT || 'original-content';
fs.writeFileSync(outputPath, content, 'utf-8');
process.exit(0);
`;

    const shasumScript = `#!/usr/bin/env node
const fs = require('fs');
const crypto = require('crypto');
const filePath = process.argv[process.argv.length - 1];
const data = fs.readFileSync(filePath);
const hash = crypto.createHash('sha256').update(data).digest('hex');
process.stdout.write(hash + '  ' + filePath + '\\n');
process.exit(0);
`;

    writeExecutable(path.join(tempDir, 'curl'), curlScript);
    writeExecutable(path.join(tempDir, 'shasum'), shasumScript);
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const runScript = (envOverrides = {}) =>
    spawnSync('bash', [SCRIPT_PATH], {
      env: {
        ...process.env,
        PATH: `${tempDir}:${process.env.PATH}`,
        CHECKSUM_FILE: checksumFile,
        API_DOCS_URL: 'https://example.com/docs',
        ...envOverrides,
      },
      encoding: 'utf-8',
    });

  const readChecksum = () => JSON.parse(fs.readFileSync(checksumFile, 'utf-8'));

  test('stores checksum on first run', () => {
    const result = runScript();

    expect(result.status).toBe(0);
    expect(fs.existsSync(checksumFile)).toBe(true);
    const data = readChecksum();
    expect(data.url).toBe('https://example.com/docs');
    expect(data.checksum).toBe(
      crypto.createHash('sha256').update('original-content').digest('hex'),
    );
  });

  test('exits successfully when documentation has not changed', () => {
    runScript();
    const firstData = readChecksum();

    const result = runScript();
    expect(result.status).toBe(0);
    const secondData = readChecksum();
    expect(secondData.checksum).toBe(firstData.checksum);
  });

  test('returns code 2 when documentation has changed and keeps previous checksum', () => {
    runScript();
    const firstData = readChecksum();

    const result = runScript({ CURL_CONTENT: 'updated-content' });
    expect(result.status).toBe(2);
    const secondData = readChecksum();
    expect(secondData.checksum).toBe(firstData.checksum);
  });
});
