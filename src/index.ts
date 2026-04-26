export { analyze, loadDocumentedNames } from './analyzer/index.js';
export type { AnalyzeInput } from './analyzer/index.js';
export { walkDirectory } from './scanner/walker.js';
export { extractEnvRefs, getExtractor, getSupportedExtensions } from './scanner/extractors/index.js';
export { parseDotenvContent, parseDotenvFile, parseDotenvFiles } from './parser/dotenv.js';
export type { DotenvParseResult } from './parser/dotenv.js';
export { generateExample } from './generator/index.js';
export { formatTextReport } from './reporter/text.js';
export { formatJsonReport } from './reporter/json.js';
export type { JsonReport } from './reporter/json.js';
export type {
  EnvRef,
  EnvDef,
  VarStatus,
  VarInfo,
  AnalysisResult,
  ScanOptions,
  EnvExtractor,
} from './types.js';
export { DEFAULT_OPTIONS } from './types.js';
