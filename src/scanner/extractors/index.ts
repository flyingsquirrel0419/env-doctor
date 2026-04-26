/**
 * Extractor index — maps file extensions to the appropriate language extractor.
 */

import type { EnvExtractor, EnvRef } from '../../types.js';
import { javascriptExtractor } from './javascript.js';
import { pythonExtractor } from './python.js';
import { goExtractor } from './go.js';
import { rubyExtractor } from './ruby.js';

/** All registered extractors */
const extractors: EnvExtractor[] = [
  javascriptExtractor,
  pythonExtractor,
  goExtractor,
  rubyExtractor,
];

/** Map of file extension → extractor */
const extensionMap = new Map<string, EnvExtractor>();
for (const ext of extractors) {
  for (const extStr of ext.extensions) {
    extensionMap.set(extStr, ext);
  }
}

/**
 * Get the appropriate extractor for a file based on its extension.
 */
export function getExtractor(filePath: string): EnvExtractor | undefined {
  const ext = filePath.lastIndexOf('.');
  if (ext === -1) return undefined;
  const extension = filePath.slice(ext);
  return extensionMap.get(extension);
}

/**
 * Extract all env variable references from file content.
 * Automatically selects the right extractor based on file extension.
 */
export function extractEnvRefs(content: string, filePath: string): EnvRef[] {
  const extractor = getExtractor(filePath);
  if (!extractor) return [];
  return extractor.extract(content, filePath);
}

/**
 * Get list of all supported file extensions.
 */
export function getSupportedExtensions(): string[] {
  return [...extensionMap.keys()];
}

export { extractors };
