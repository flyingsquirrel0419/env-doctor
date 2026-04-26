/**
 * JavaScript/TypeScript environment variable extractor.
 * Detects: process.env.VAR, process.env['VAR'], process.env["VAR"]
 */

import type { EnvExtractor, EnvRef } from '../../types.js';

/** Regex for direct property access: process.env.VAR_NAME */
const DIRECT_ACCESS_RE = /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;

/** Regex for bracket access: process.env['VAR_NAME'] or process.env["VAR_NAME"] */
const BRACKET_ACCESS_RE = /process\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g;

/** Regex for dynamic bracket access: process.env[someVariable] */
const DYNAMIC_ACCESS_RE = /process\.env\[([^'"][^\]]*)\]/g;

/**
 * Extract environment variable references from JavaScript/TypeScript code.
 */
export const javascriptExtractor: EnvExtractor = {
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],

  extract(content: string, filePath: string): EnvRef[] {
    const refs: EnvRef[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (!line) continue;
      const lineNum = lineIdx + 1;

      // Direct access: process.env.VAR
      let match: RegExpExecArray | null;
      DIRECT_ACCESS_RE.lastIndex = 0;
      while ((match = DIRECT_ACCESS_RE.exec(line)) !== null) {
        const name = match[1];
        if (name) {
          refs.push({
            name,
            file: filePath,
            line: lineNum,
            column: match.index + 1,
            isDynamic: false,
          });
        }
      }

      // Bracket access: process.env['VAR'] or process.env["VAR"]
      BRACKET_ACCESS_RE.lastIndex = 0;
      while ((match = BRACKET_ACCESS_RE.exec(line)) !== null) {
        const name = match[1];
        if (name) {
          refs.push({
            name,
            file: filePath,
            line: lineNum,
            column: match.index + 1,
            isDynamic: false,
          });
        }
      }

      // Dynamic access: process.env[someVar]
      DYNAMIC_ACCESS_RE.lastIndex = 0;
      while ((match = DYNAMIC_ACCESS_RE.exec(line)) !== null) {
        const expr = match[1];
        if (expr) {
          refs.push({
            name: `<dynamic: ${expr.trim()}>`,
            file: filePath,
            line: lineNum,
            column: match.index + 1,
            isDynamic: true,
          });
        }
      }
    }

    return refs;
  },
};
