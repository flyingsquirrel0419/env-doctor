/**
 * Python environment variable extractor.
 * Detects: os.environ.get('VAR'), os.environ['VAR'], os.getenv('VAR')
 */

import type { EnvExtractor, EnvRef } from '../../types.js';

/** os.environ.get('VAR') or os.environ.get("VAR") */
const ENVIRON_GET_RE = /os\.environ\.get\(\s*['"](\w+)['"]/g;

/** os.environ['VAR'] or os.environ["VAR"] */
const ENVIRON_BRACKET_RE = /os\.environ\[['"](\w+)['"]\]/g;

/** os.getenv('VAR') or os.getenv("VAR") */
const GETENV_RE = /os\.getenv\(\s*['"](\w+)['"]/g;

/**
 * Extract environment variable references from Python code.
 */
export const pythonExtractor: EnvExtractor = {
  extensions: ['.py'],

  extract(content: string, filePath: string): EnvRef[] {
    const refs: EnvRef[] = [];
    const lines = content.split('\n');

    const patterns: [RegExp, boolean][] = [
      [ENVIRON_GET_RE, false],
      [ENVIRON_BRACKET_RE, false],
      [GETENV_RE, false],
    ];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (!line) continue;
      const lineNum = lineIdx + 1;

      for (const [pattern] of patterns) {
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
