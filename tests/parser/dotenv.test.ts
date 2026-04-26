import { describe, it, expect } from 'vitest';
import { parseDotenvContent, parseDotenvFile } from '../../src/parser/dotenv.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', 'fixtures');

describe('parseDotenvContent', () => {
  it('parses basic KEY=value pairs', () => {
    const result = parseDotenvContent('PORT=3000\nHOST=localhost\n', '.env');
    expect(result.definitions).toHaveLength(2);
    expect(result.definitions[0]?.name).toBe('PORT');
    expect(result.definitions[0]?.value).toBe('3000');
    expect(result.definitions[1]?.name).toBe('HOST');
    expect(result.definitions[1]?.value).toBe('localhost');
  });

  it('skips comment lines', () => {
    const result = parseDotenvContent('# This is a comment\nPORT=3000\n', '.env');
    expect(result.definitions).toHaveLength(1);
    expect(result.definitions[0]?.name).toBe('PORT');
  });

  it('parses commented-out variables as commented', () => {
    const result = parseDotenvContent('# OLD_KEY=old_value\nPORT=3000\n', '.env');
    expect(result.definitions).toHaveLength(2);
    const old = result.definitions.find((d) => d.name === 'OLD_KEY');
    expect(old).toBeDefined();
    expect(old?.commented).toBe(true);
    expect(old?.value).toBe('old_value');
  });

  it('strips double quotes from values', () => {
    const result = parseDotenvContent('SECRET="my-secret"\n', '.env');
    expect(result.definitions[0]?.value).toBe('my-secret');
  });

  it('strips single quotes from values', () => {
    const result = parseDotenvContent("SECRET='my-secret'\n", '.env');
    expect(result.definitions[0]?.value).toBe('my-secret');
  });

  it('handles empty values', () => {
    const result = parseDotenvContent('EMPTY_VAR=\n', '.env');
    expect(result.definitions[0]?.name).toBe('EMPTY_VAR');
    expect(result.definitions[0]?.value).toBe('');
  });

  it('handles double-quoted empty values', () => {
    const result = parseDotenvContent('QUOTED_EMPTY=""\n', '.env');
    expect(result.definitions[0]?.value).toBe('');
  });

  it('handles single-quoted empty values', () => {
    const result = parseDotenvContent("SINGLE_QUOTED=''\n", '.env');
    expect(result.definitions[0]?.value).toBe('');
  });

  it('handles multiline double-quoted values', () => {
    const content = 'MULTI="line1\nline2\nline3"\n';
    const result = parseDotenvContent(content, '.env');
    expect(result.definitions).toHaveLength(1);
    expect(result.definitions[0]?.name).toBe('MULTI');
    expect(result.definitions[0]?.value).toBe('line1\nline2\nline3');
  });

  it('handles multiline single-quoted values', () => {
    const content = "MULTI='line1\nline2'\n";
    const result = parseDotenvContent(content, '.env');
    expect(result.definitions).toHaveLength(1);
    expect(result.definitions[0]?.value).toBe('line1\nline2');
  });

  it('reports error for unclosed multiline', () => {
    const content = 'MULTI="line1\nline2\n';
    const result = parseDotenvContent(content, '.env');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toContain('Unclosed');
  });

  it('skips empty lines', () => {
    const result = parseDotenvContent('\n\nPORT=3000\n\n\nHOST=localhost\n\n', '.env');
    expect(result.definitions).toHaveLength(2);
  });

  it('reports error for invalid variable names', () => {
    const result = parseDotenvContent('123BAD=value\n', '.env');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('sets source path on definitions', () => {
    const result = parseDotenvContent('PORT=3000\n', '/custom/.env');
    expect(result.definitions[0]?.source).toBe('/custom/.env');
  });

  it('sets line numbers correctly', () => {
    const result = parseDotenvContent('# comment\nPORT=3000\nHOST=localhost\n', '.env');
    expect(result.definitions[0]?.line).toBe(2);
    expect(result.definitions[1]?.line).toBe(3);
  });

  describe('fixture integration', () => {
    it('parses dotenv-sample.env correctly', async () => {
      const result = await parseDotenvFile(path.join(FIXTURES, 'dotenv-sample.env'));
      const names = result.definitions.map((d) => d.name);
      expect(names).toContain('DATABASE_URL');
      expect(names).toContain('JWT_SECRET');
      expect(names).toContain('REDIS_URL');
      expect(names).toContain('EMPTY_VAR');
      expect(names).toContain('QUOTED_EMPTY');
      expect(names).toContain('SINGLE_QUOTED');
      expect(names).toContain('MULTI_LINE');
    });
  });
});

describe('parseDotenvFile', () => {
  it('returns empty definitions for nonexistent file', async () => {
    const result = await parseDotenvFile('/nonexistent/.env');
    expect(result.definitions).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('parses the fixture .env file', async () => {
    const result = await parseDotenvFile(path.join(FIXTURES, '.env'));
    expect(result.definitions.length).toBeGreaterThan(0);
    const names = result.definitions.map((d) => d.name);
    expect(names).toContain('DATABASE_URL');
    expect(names).toContain('JWT_SECRET');
    expect(names).toContain('PORT');
  });
});
