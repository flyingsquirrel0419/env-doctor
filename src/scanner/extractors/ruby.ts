/**
 * Ruby environment variable extractor.
 * Detects: ENV['VAR'], ENV.fetch('VAR')
 */

import type { EnvExtractor, EnvRef } from '../../types.js';

/** ENV['VAR'] or ENV["VAR"] */
const ENV_BRACKET_RE = /ENV\[['"](\w+)['"]\]/g;

/** ENV.fetch('VAR') or ENV.fetch("VAR") */
const ENV_FETCH_RE = /ENV\.fetch\(\s*['"](\w+)['"]/g;

/**
 * Extract environment variable references from Ruby code.
 */
export const rubyExtractor: EnvExtractor = {
  extensions: ['.rb', '.erb'],

  extract(content: string, filePath: string): EnvRef[] {
    const refs: EnvRef[] = [];
    const lines = content.split('\n');

    const patterns: RegExp[] = [ENV_BRACKET_RE, ENV_FETCH_RE];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (!line) continue;
      const lineNum = lineIdx + 1;

      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
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
    }

    return refs;
  },
};
