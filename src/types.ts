/**
 * Shared type definitions for dotenv-scan.
 * All core data structures used across scanner, parser, analyzer, reporter.
 */

/** A reference to an environment variable found in source code */
export interface EnvRef {
  /** The variable name (e.g. "DATABASE_URL") */
  name: string;
  /** File path where the reference was found */
  file: string;
  /** 1-based line number in the file */
  line: number;
  /** Column offset in the line */
  column: number;
  /** Whether this was a dynamic access (e.g. process.env[key]) */
  isDynamic: boolean;
}

/** A variable definition parsed from a .env file */
export interface EnvDef {
  /** The variable name */
  name: string;
  /** The raw value from the .env file (empty string if empty) */
  value: string;
  /** 1-based line number in the .env file */
  line: number;
  /** Whether the line was commented out */
  commented: boolean;
  /** The .env file path this was parsed from */
  source: string;
}

/** Categories of variable status from analysis */
export type VarStatus = 'missing' | 'unused' | 'undocumented' | 'ok';

/** Information about a single variable after analysis */
export interface VarInfo {
  /** The variable name */
  name: string;
  /** The classified status */
  status: VarStatus;
  /** Locations where this variable is used in source code */
  references: EnvRef[];
  /** The .env definition, if any */
  definition?: EnvDef;
  /** Whether the variable is documented in .env.example */
  documented: boolean;
}

/** The complete result of an dotenv-scan analysis */
export interface AnalysisResult {
  /** All variables with their status */
  variables: VarInfo[];
  /** Count summary */
  summary: {
    total: number;
    missing: number;
    unused: number;
    undocumented: number;
    ok: number;
  };
  /** Scan metadata */
  meta: {
    /** Number of source files scanned */
    filesScanned: number;
    /** Time taken in milliseconds */
    durationMs: number;
    /** Directory that was scanned */
    directory: string;
    /** .env file(s) that were parsed */
    envFiles: string[];
  };
  /** Dynamic access warnings */
  dynamicAccessWarnings: EnvRef[];
}

/** CLI options shared across commands */
export interface ScanOptions {
  /** Directory to scan (default: './') */
  dir: string;
  /** Path to .env file (default: '.env') */
  envFile: string;
  /** Additional glob patterns to ignore */
  ignore: string[];
  /** Output format */
  format: 'text' | 'json';
  /** Whether to use color output */
  color: boolean;
  /** Path to .env.example file (default: '.env.example') */
  exampleFile: string;
}

/** An extractor that finds env variable references in source code */
export interface EnvExtractor {
  /** File extensions this extractor handles */
  extensions: string[];
  /** Extract env variable references from file content */
  extract(content: string, filePath: string): EnvRef[];
}

/** Default scan options */
export const DEFAULT_OPTIONS: ScanOptions = {
  dir: './',
  envFile: '.env',
  ignore: [],
  format: 'text',
  color: true,
  exampleFile: '.env.example',
};
