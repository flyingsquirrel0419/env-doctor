import { Command } from 'commander';
import { walkDirectory } from './scanner/walker.js';
import { extractEnvRefs } from './scanner/extractors/index.js';
import { parseDotenvFile } from './parser/dotenv.js';
import { analyze, loadDocumentedNames } from './analyzer/index.js';
import { generateExample } from './generator/index.js';
import { formatTextReport } from './reporter/text.js';
import { formatJsonReport } from './reporter/json.js';
import type { EnvRef, ScanOptions } from './types.js';
import { DEFAULT_OPTIONS } from './types.js';
import { performance } from 'node:perf_hooks';
import path from 'node:path';

const VERSION = '1.0.0';

async function runScan(
  options: ScanOptions,
): Promise<{ result: import('./types.js').AnalysisResult; refs: EnvRef[] }> {
  const start = performance.now();

  const walkResult = await walkDirectory(options.dir, { ignore: options.ignore });

  const allRefs: EnvRef[] = [];
  for (const file of walkResult.files) {
    const refs = extractEnvRefs(file.content, file.path);
    allRefs.push(...refs);
  }

  const dotenvResult = await parseDotenvFile(path.resolve(options.dir, options.envFile));
  const documentedNames = await loadDocumentedNames(path.resolve(options.dir, options.exampleFile));

  const durationMs = Math.round(performance.now() - start);

  const result = await analyze({
    references: allRefs,
    definitions: dotenvResult.definitions,
    documentedNames,
    directory: options.dir,
    envFiles: [options.envFile],
    filesScanned: walkResult.files.length,
    durationMs,
  });

  return { result, refs: allRefs };
}

const program = new Command();

program
  .name('env-doc')
  .description('Scan, analyze, and fix .env variable issues')
  .version(`env-doc v${VERSION}`);

program
  .command('scan')
  .description('Scan project for env variable issues (always exits 0)')
  .option('-d, --dir <path>', 'directory to scan', DEFAULT_OPTIONS.dir)
  .option('-e, --dotenv <path>', 'path to .env file', DEFAULT_OPTIONS.envFile)
  .option('-x, --example <path>', 'path to .env.example file', DEFAULT_OPTIONS.exampleFile)
  .option('-i, --ignore <patterns...>', 'additional glob patterns to ignore', [])
  .option('-f, --format <type>', 'output format: text or json', 'text')
  .option('--no-color', 'disable colored output')
  .action(async (opts) => {
    const scanOptions: ScanOptions = {
      dir: opts.dir ?? DEFAULT_OPTIONS.dir,
      envFile: opts.dotenv ?? DEFAULT_OPTIONS.envFile,
      ignore: opts.ignore ?? [],
      format: opts.format === 'json' ? 'json' : 'text',
      color: opts.color !== false,
      exampleFile: opts.example ?? DEFAULT_OPTIONS.exampleFile,
    };

    const { result } = await runScan(scanOptions);

    if (scanOptions.format === 'json') {
      console.log(formatJsonReport(result));
    } else {
      console.log(formatTextReport(result, scanOptions.color));
    }
  });

program
  .command('check')
  .description('Check for missing env variables (exits 1 if any missing, for CI)')
  .option('-d, --dir <path>', 'directory to scan', DEFAULT_OPTIONS.dir)
  .option('-e, --dotenv <path>', 'path to .env file', DEFAULT_OPTIONS.envFile)
  .option('-x, --example <path>', 'path to .env.example file', DEFAULT_OPTIONS.exampleFile)
  .option('-i, --ignore <patterns...>', 'additional glob patterns to ignore', [])
  .option('-f, --format <type>', 'output format: text or json', 'text')
  .option('--no-color', 'disable colored output')
  .option('--strict', 'also fail on unused and undocumented variables')
  .action(async (opts) => {
    const scanOptions: ScanOptions = {
      dir: opts.dir ?? DEFAULT_OPTIONS.dir,
      envFile: opts.dotenv ?? DEFAULT_OPTIONS.envFile,
      ignore: opts.ignore ?? [],
      format: opts.format === 'json' ? 'json' : 'text',
      color: opts.color !== false,
      exampleFile: opts.example ?? DEFAULT_OPTIONS.exampleFile,
    };

    const { result } = await runScan(scanOptions);

    if (scanOptions.format === 'json') {
      console.log(formatJsonReport(result));
    } else {
      console.log(formatTextReport(result, scanOptions.color));
    }

    const shouldFail = opts.strict
      ? result.summary.missing > 0 || result.summary.unused > 0 || result.summary.undocumented > 0
      : result.summary.missing > 0;

    if (shouldFail) {
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate or update .env.example from scan results')
  .option('-d, --dir <path>', 'directory to scan', DEFAULT_OPTIONS.dir)
  .option('-e, --dotenv <path>', 'path to .env file', DEFAULT_OPTIONS.envFile)
  .option('-x, --example <path>', 'path to .env.example output file', DEFAULT_OPTIONS.exampleFile)
  .option('-i, --ignore <patterns...>', 'additional glob patterns to ignore', [])
  .option('--no-color', 'disable colored output')
  .action(async (opts) => {
    const scanOptions: ScanOptions = {
      dir: opts.dir ?? DEFAULT_OPTIONS.dir,
      envFile: opts.dotenv ?? DEFAULT_OPTIONS.envFile,
      ignore: opts.ignore ?? [],
      format: 'text',
      color: opts.color !== false,
      exampleFile: opts.example ?? DEFAULT_OPTIONS.exampleFile,
    };

    const { result } = await runScan(scanOptions);

    await generateExample({
      examplePath: path.resolve(scanOptions.dir, scanOptions.exampleFile),
      result,
    });

    console.log(`✅ Updated ${scanOptions.exampleFile}`);
    console.log(
      `   ${result.summary.missing} missing, ${result.summary.unused} unused, ${result.summary.undocumented} undocumented`,
    );
  });

program.parse();
