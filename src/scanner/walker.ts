/**
 * File tree walker — traverses source directories using fast-glob,
 * respects .gitignore patterns, and enforces file size limits.
 */

import fg from 'fast-glob';
import fs from 'node:fs/promises';
import { DEFAULT_IGNORE_PATTERNS, MAX_FILE_SIZE_BYTES } from './constants.js';

/** Maximum file size to scan (1MB) */
export { MAX_FILE_SIZE_BYTES } from './constants.js';

/** Result of walking a directory */
export interface WalkResult {
  /** Successfully read files with their content */
  files: ReadonlyArray<{ path: string; content: string }>;
  /** Files that were skipped (too large, binary, etc.) */
  skipped: ReadonlyArray<{ path: string; reason: string }>;
  /** Total files matched by glob before filtering */
  totalMatched: number;
}

/**
 * Default glob pattern for source files to scan.
 * Covers JS, TS, Python, Go, Ruby, and common config files.
 */
const DEFAULT_SOURCE_PATTERN = '**/*.{js,jsx,ts,tsx,mjs,cjs,py,go,rb,erb}';

/**
 * Walk a directory and return file contents for analysis.
 * Skips binary files, oversized files, and respects ignore patterns.
 */
export async function walkDirectory(
  directory: string,
  options: { ignore?: string[]; pattern?: string } = {},
): Promise<WalkResult> {
  const ignorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...(options.ignore ?? [])];

  const pattern = options.pattern ?? DEFAULT_SOURCE_PATTERN;

  const entries = await fg(pattern, {
    cwd: directory,
    ignore: ignorePatterns,
    absolute: true,
    onlyFiles: true,
    dot: false,
    followSymbolicLinks: false,
    suppressErrors: true,
  });

  const files: { path: string; content: string }[] = [];
  const skipped: { path: string; reason: string }[] = [];

  for (const entry of entries) {
    try {
      const stat = await fs.stat(entry);

      // Skip files over size limit
      if (stat.size > MAX_FILE_SIZE_BYTES) {
        skipped.push({
          path: entry,
          reason: `File too large (${(stat.size / 1024).toFixed(0)}KB)`,
        });
        continue;
      }

      // Skip binary files by checking for null bytes in first 8KB
      const bytesRead = Math.min(stat.size, 8192);
      if (bytesRead > 0) {
        const buffer = Buffer.alloc(bytesRead);
        const handle = await fs.open(entry, 'r');
        await handle.read(buffer, 0, bytesRead, 0);
        await handle.close();

        if (buffer.includes(0)) {
          skipped.push({ path: entry, reason: 'Binary file detected' });
          continue;
        }
      }

      const content = await fs.readFile(entry, 'utf-8');
      files.push({ path: entry, content });
    } catch {
      skipped.push({ path: entry, reason: 'Failed to read file' });
    }
  }

  return {
    files,
    skipped,
    totalMatched: entries.length,
  };
}
