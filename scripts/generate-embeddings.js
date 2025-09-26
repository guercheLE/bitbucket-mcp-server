#!/usr/bin/env node

require('ts-node/register');

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { generateEmbeddings } = require('../src/scripts/generate-embeddings');

const DEFAULT_SOURCE = path.resolve(__dirname, '..', 'data', 'bitbucket-api.json');
const DEFAULT_OUTPUT = path.resolve(__dirname, '..', 'vector-db.sqlite');
const DEFAULT_LIMIT = 250;

const parseArguments = () => {
  const args = process.argv.slice(2);
  const options = {
    source: DEFAULT_SOURCE,
    output: DEFAULT_OUTPUT,
    limit: DEFAULT_LIMIT,
  };

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    switch (current) {
      case '--source':
        options.source = path.resolve(process.cwd(), args[++index] ?? '');
        break;
      case '--output':
        options.output = path.resolve(process.cwd(), args[++index] ?? '');
        break;
      case '--limit':
        options.limit = Number(args[++index]);
        break;
      case '--all':
        options.limit = Infinity;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${current}`);
        printHelp();
        process.exit(1);
    }
  }

  if (!Number.isFinite(options.limit) && options.limit !== Infinity) {
    throw new Error('--limit must be a finite number or use --all to process every record');
  }

  return options;
};

const printHelp = () => {
  console.info(
    `Usage: node scripts/generate-embeddings.js [options]\n\n` +
    `Options:\n` +
    `  --source <path>   Path to bitbucket-api.json (default: ${DEFAULT_SOURCE})\n` +
    `  --output <path>   Output sqlite database file (default: ${DEFAULT_OUTPUT})\n` +
    `  --limit <number>  Maximum number of records to process (default: ${DEFAULT_LIMIT})\n` +
    `  --all             Process the full dataset\n` +
    `  -h, --help        Show this help message`,
  );
};

/**
 * @param {string} sourcePath
 * @param {number|typeof Infinity} limit
 * @returns {Promise<{path: string, cleanup: () => Promise<void>}>}
 */
const createSubsetFile = async (sourcePath, limit) => {
  if (limit === Infinity) {
    return { path: sourcePath, cleanup: async () => undefined };
  }

  const resolvedSource = path.resolve(sourcePath);
  const raw = await fs.readFile(resolvedSource, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected ${resolvedSource} to contain an array of API operation objects`);
  }

  if (limit >= parsed.length) {
    return { path: resolvedSource, cleanup: async () => undefined };
  }

  const subset = parsed.slice(0, Math.max(0, limit));
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bitbucket-embeddings-'));
  const subsetPath = path.join(tempDir, 'subset.json');
  await fs.writeFile(subsetPath, JSON.stringify(subset, null, 2), 'utf-8');

  return {
    path: subsetPath,
    cleanup: async () => {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    },
  };
};

(async () => {
  try {
    const { source, output, limit } = parseArguments();
    const subset = await createSubsetFile(source, limit);

    const summary = await generateEmbeddings({
      sourcePath: subset.path,
      databasePath: output,
    });

    console.info(
      `Embedding generation complete. Successes: ${summary.successes}/${summary.total}. Database saved to ${summary.databasePath}`,
    );

    await subset.cleanup();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Embedding generation failed: ${message}`);
    process.exitCode = 1;
  }
})();
