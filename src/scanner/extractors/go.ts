/**
 * Go environment variable extractor.
 * Detects: os.Getenv("VAR")
 */

import type { EnvExtractor, EnvRef } from '../../types.js';

/** os.Getenv("VAR") */
const GETENV_RE = /os\.Getenv\(\s*"([\w]+)"/g;

/**
 * Extract environment variable references from Go code.
 */
export const goExtractor: EnvExtractor = {
  extensions: ['.go'],

  extract(content: string, filePath: string): EnvRef[] {
    const refs: EnvRef[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (!line) continue;
      const lineNum = lineIdx + 1;

      GETENV_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = GETENV_RE.exec(line)) !== null) {
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
    }

    return refs;
  },
};
