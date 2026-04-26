/**
 * .env file parser.
 * Supports: comments, quoted values, multiline values, empty lines, VAR= syntax.
 * Follows the dotenv spec: https://github.com/motdotla/dotenv
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { EnvDef } from '../types.js';

/** Parse result from a single .env file */
export interface DotenvParseResult {
  /** Parsed variable definitions */
  definitions: EnvDef[];
  /** Any parse errors encountered */
  errors: ReadonlyArray<{ line: number; message: string }>;
}

/**
 * Parse a single .env file content into variable definitions.
 */
export function parseDotenvContent(content: string, sourcePath: string): DotenvParseResult {
  const definitions: EnvDef[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = content.split('\n');

  let inMultiline = false;
  let multilineName = '';
  let multilineValue = '';
  let multilineStartLine = 0;
  let multilineQuote = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const lineNum = i + 1;

    // Handle multiline values
    if (inMultiline) {
      if (rawLine.includes(multilineQuote)) {
        // End of multiline
        const closingIdx = rawLine.indexOf(multilineQuote);
        multilineValue += '\n' + rawLine.slice(0, closingIdx);

        definitions.push({
          name: multilineName,
          value: multilineValue,
          line: multilineStartLine,
          commented: false,
          source: sourcePath,
        });

        inMultiline = false;
        multilineName = '';
        multilineValue = '';
        multilineQuote = '';
      } else {
        multilineValue += '\n' + rawLine;
      }
      continue;
    }

    // Skip empty lines
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) continue;

    if (trimmed.startsWith('#')) {
      const commentedMatch = trimmed.match(/^#\s*([\w]+)\s*=\s*(.*)$/);
      if (commentedMatch) {
        const name = commentedMatch[1];
        const value = commentedMatch[2] ?? '';
        if (name) {
          definitions.push({
            name,
            value: stripQuotes(value),
            line: lineNum,
            commented: true,
            source: sourcePath,
          });
        }
      }
      continue;
    }

    // Parse KEY=VALUE
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      // Variable with no value — treat as empty
      const name = trimmed.trim();
      if (isValidVarName(name)) {
        definitions.push({
          name,
          value: '',
          line: lineNum,
          commented: false,
          source: sourcePath,
        });
      } else {
        errors.push({ line: lineNum, message: `Invalid variable name: "${name}"` });
      }
      continue;
    }

    const name = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1).trim();

    if (!isValidVarName(name)) {
      errors.push({ line: lineNum, message: `Invalid variable name: "${name}"` });
      continue;
    }

    // Check for multiline double-quoted value
    if (rawValue.startsWith('"') && !rawValue.endsWith('"')) {
      multilineName = name;
      multilineValue = rawValue.slice(1); // Remove opening quote
      multilineStartLine = lineNum;
      multilineQuote = '"';
      inMultiline = true;
      continue;
    }

    // Check for multiline single-quoted value
    if (rawValue.startsWith("'") && !rawValue.endsWith("'")) {
      multilineName = name;
      multilineValue = rawValue.slice(1); // Remove opening quote
      multilineStartLine = lineNum;
      multilineQuote = "'";
      inMultiline = true;
      continue;
    }

    // Normal single-line value
    definitions.push({
      name,
      value: stripQuotes(rawValue),
      line: lineNum,
      commented: false,
      source: sourcePath,
    });
  }

  // Handle unclosed multiline
  if (inMultiline) {
    errors.push({
      line: multilineStartLine,
      message: `Unclosed multiline value for "${multilineName}"`,
    });
  }

  return { definitions, errors };
}

/**
 * Read and parse a .env file from disk.
 */
export async function parseDotenvFile(filePath: string): Promise<DotenvParseResult> {
  try {
    const resolved = path.resolve(filePath);
    const content = await fs.readFile(resolved, 'utf-8');
    return parseDotenvContent(content, resolved);
  } catch {
    return { definitions: [], errors: [] };
  }
}

/**
 * Try to parse multiple .env files (e.g. .env, .env.local, .env.production).
 * Later files override earlier ones for the same variable name.
 */
export async function parseDotenvFiles(filePaths: string[]): Promise<DotenvParseResult> {
  const allDefinitions: EnvDef[] = [];
  const allErrors: { line: number; message: string }[] = [];

  for (const fp of filePaths) {
    const result = await parseDotenvFile(fp);
    allDefinitions.push(...result.definitions);
    allErrors.push(...result.errors);
  }

  // Deduplicate: later files override earlier
  const seen = new Map<string, EnvDef>();
  for (const def of allDefinitions) {
    seen.set(def.name, def);
  }

  return {
    definitions: [...seen.values()],
    errors: allErrors,
  };
}

/** Strip surrounding quotes from a value */
function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** Check if a string is a valid environment variable name */
function isValidVarName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}
