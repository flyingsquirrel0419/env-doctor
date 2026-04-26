/**
 * Default constants used across the scanner.
 */

/** Maximum file size to scan: 1MB */
export const MAX_FILE_SIZE_BYTES = 1_000_000;

/** Default ignore patterns — directories and files to always skip */
export const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/__pycache__/**',
  '**/*.min.js',
  '**/*.min.mjs',
  '**/*.map',
  '**/vendor/**',
  '**/*.lock',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/Gemfile.lock',
  '**/go.sum',
];
