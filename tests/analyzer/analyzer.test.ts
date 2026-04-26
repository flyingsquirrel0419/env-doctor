import { describe, it, expect } from 'vitest';
import { analyze, loadDocumentedNames } from '../../src/analyzer/index.js';
import type { EnvRef, EnvDef } from '../../src/types.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', 'fixtures');

function makeRef(name: string, overrides: Partial<EnvRef> = {}): EnvRef {
  return {
    name,
    file: '/src/app.ts',
    line: 1,
    column: 1,
    isDynamic: false,
    ...overrides,
  };
}

function makeDef(name: string, overrides: Partial<EnvDef> = {}): EnvDef {
  return {
    name,
    value: 'value',
    line: 1,
    commented: false,
    source: '.env',
    ...overrides,
  };
}

describe('analyze', () => {
  it('classifies missing variables (used but not defined)', async () => {
    const result = await analyze({
      references: [makeRef('MISSING_VAR')],
      definitions: [],
      documentedNames: new Set(),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 1,
      durationMs: 10,
    });

    expect(result.variables).toHaveLength(1);
    expect(result.variables[0]?.status).toBe('missing');
    expect(result.summary.missing).toBe(1);
  });

  it('classifies unused variables (defined but not used)', async () => {
    const result = await analyze({
      references: [],
      definitions: [makeDef('UNUSED_VAR')],
      documentedNames: new Set(['UNUSED_VAR']),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 1,
      durationMs: 10,
    });

    expect(result.variables).toHaveLength(1);
    expect(result.variables[0]?.status).toBe('unused');
    expect(result.summary.unused).toBe(1);
  });

  it('classifies undocumented variables (defined but not in .env.example)', async () => {
    const result = await analyze({
      references: [makeRef('MY_VAR')],
      definitions: [makeDef('MY_VAR')],
      documentedNames: new Set(),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 1,
      durationMs: 10,
    });

    expect(result.variables).toHaveLength(1);
    expect(result.variables[0]?.status).toBe('undocumented');
    expect(result.summary.undocumented).toBe(1);
  });

  it('classifies OK variables (used, defined, documented)', async () => {
    const result = await analyze({
      references: [makeRef('PORT')],
      definitions: [makeDef('PORT')],
      documentedNames: new Set(['PORT']),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 1,
      durationMs: 10,
    });

    expect(result.variables).toHaveLength(1);
    expect(result.variables[0]?.status).toBe('ok');
    expect(result.summary.ok).toBe(1);
  });

  it('collects dynamic access warnings separately', async () => {
    const dynamicRef = makeRef('<dynamic: key>', { isDynamic: true });
    const result = await analyze({
      references: [dynamicRef, makeRef('PORT')],
      definitions: [makeDef('PORT')],
      documentedNames: new Set(['PORT']),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 1,
      durationMs: 10,
    });

    expect(result.dynamicAccessWarnings).toHaveLength(1);
    expect(result.dynamicAccessWarnings[0]?.isDynamic).toBe(true);
    expect(result.summary.ok).toBe(1);
  });

  it('calculates correct summary counts', async () => {
    const result = await analyze({
      references: [
        makeRef('MISSING1'),
        makeRef('MISSING2'),
        makeRef('OK_VAR'),
        makeRef('UNDOC_VAR'),
      ],
      definitions: [
        makeDef('OK_VAR'),
        makeDef('UNDOC_VAR'),
        makeDef('UNUSED_VAR'),
      ],
      documentedNames: new Set(['OK_VAR', 'MISSING1']),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 5,
      durationMs: 100,
    });

    expect(result.summary.missing).toBe(2);
    expect(result.summary.unused).toBe(1);
    expect(result.summary.undocumented).toBe(1);
    expect(result.summary.ok).toBe(1);
    expect(result.summary.total).toBe(5);
  });

  it('sorts variables by status priority (missing > undocumented > unused > ok)', async () => {
    const result = await analyze({
      references: [
        makeRef('OK_VAR'),
        makeRef('MISSING_VAR'),
        makeRef('UNDOC_VAR'),
      ],
      definitions: [
        makeDef('OK_VAR'),
        makeDef('UNDOC_VAR'),
        makeDef('UNUSED_VAR'),
      ],
      documentedNames: new Set(['OK_VAR', 'MISSING_VAR']),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 1,
      durationMs: 10,
    });

    const statuses = result.variables.map((v) => v.status);
    expect(statuses).toEqual(['missing', 'undocumented', 'unused', 'ok']);
  });

  it('preserves metadata in result', async () => {
    const result = await analyze({
      references: [],
      definitions: [],
      documentedNames: new Set(),
      directory: '/my/project',
      envFiles: ['.env', '.env.local'],
      filesScanned: 42,
      durationMs: 250,
    });

    expect(result.meta.directory).toBe('/my/project');
    expect(result.meta.envFiles).toEqual(['.env', '.env.local']);
    expect(result.meta.filesScanned).toBe(42);
    expect(result.meta.durationMs).toBe(250);
  });

  it('handles empty inputs', async () => {
    const result = await analyze({
      references: [],
      definitions: [],
      documentedNames: new Set(),
      directory: '.',
      envFiles: [],
      filesScanned: 0,
      durationMs: 0,
    });

    expect(result.variables).toHaveLength(0);
    expect(result.summary.total).toBe(0);
    expect(result.summary.missing).toBe(0);
    expect(result.summary.unused).toBe(0);
    expect(result.summary.undocumented).toBe(0);
    expect(result.summary.ok).toBe(0);
  });

  it('stores references on variable info', async () => {
    const ref1 = makeRef('PORT', { file: '/src/a.ts', line: 1 });
    const ref2 = makeRef('PORT', { file: '/src/b.ts', line: 5 });
    const result = await analyze({
      references: [ref1, ref2],
      definitions: [makeDef('PORT')],
      documentedNames: new Set(['PORT']),
      directory: '.',
      envFiles: ['.env'],
      filesScanned: 2,
      durationMs: 10,
    });

    const port = result.variables.find((v) => v.name === 'PORT');
    expect(port?.references).toHaveLength(2);
    expect(port?.definition).toBeDefined();
    expect(port?.documented).toBe(true);
  });
});

describe('loadDocumentedNames', () => {
  it('loads names from .env.example fixture', async () => {
    const names = await loadDocumentedNames(path.join(FIXTURES, '.env.example'));
    expect(names.has('DATABASE_URL')).toBe(true);
    expect(names.has('JWT_SECRET')).toBe(true);
    expect(names.has('PORT')).toBe(true);
  });

  it('returns empty set for nonexistent file', async () => {
    const names = await loadDocumentedNames('/nonexistent/.env.example');
    expect(names.size).toBe(0);
  });
});
