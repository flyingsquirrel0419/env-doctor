import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const FIXTURE_DIR = path.join(PROJECT_ROOT, 'tests', 'fixtures');
const CLI_PATH = path.join(PROJECT_ROOT, 'dist', 'cli.js');

describe('CLI Integration', () => {
  describe('scan command', () => {
    it('outputs text report by default', () => {
      const result = execSync(
        `node ${CLI_PATH} scan --dir ${FIXTURE_DIR} --dotenv .env --example .env.example`,
        { encoding: 'utf-8', timeout: 10000 },
      );

      expect(result).toContain('doc-env');
      expect(result).toContain('scanned');
    });

    it('outputs JSON report with --format json', () => {
      const result = execSync(
        `node ${CLI_PATH} scan --dir ${FIXTURE_DIR} --dotenv .env --example .env.example --format json`,
        { encoding: 'utf-8', timeout: 10000 },
      );

      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('variables');
      expect(parsed.summary).toHaveProperty('missing');
      expect(parsed.summary).toHaveProperty('unused');
    });

    it('always exits with code 0', () => {
      expect(() => {
        execSync(
          `node ${CLI_PATH} scan --dir ${FIXTURE_DIR} --dotenv .env --example .env.example`,
          { encoding: 'utf-8', timeout: 10000 },
        );
      }).not.toThrow();
    });
  });

  describe('check command', () => {
    it('exits with code 1 when missing variables exist', () => {
      let exitCode = 0;
      try {
        execSync(
          `node ${CLI_PATH} check --dir ${FIXTURE_DIR} --dotenv .env --example .env.example`,
          { encoding: 'utf-8', timeout: 10000, stdio: 'pipe' },
        );
      } catch (e: unknown) {
        const err = e as { status?: number };
        exitCode = err.status ?? 0;
      }
      expect(exitCode).toBe(1);
    });
  });

  describe('check with clean project', () => {
    const tempDir = path.join(PROJECT_ROOT, 'tests', 'temp-check-clean');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app.js'),
        `const x = process.env.PORT;\nconsole.log(x);`,
      );
      await fs.writeFile(path.join(tempDir, '.env'), 'PORT=3000\n');
      await fs.writeFile(path.join(tempDir, '.env.example'), 'PORT=\n');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('exits 0 when all variables are defined', () => {
      expect(() => {
        execSync(`node ${CLI_PATH} check --dir ${tempDir} --dotenv .env --example .env.example`, {
          encoding: 'utf-8',
          timeout: 10000,
        });
      }).not.toThrow();
    });
  });

  describe('generate command', () => {
    const tempDir = path.join(PROJECT_ROOT, 'tests', 'temp-generate');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app.js'),
        `const port = process.env.PORT;\nconst db = process.env.DATABASE_URL;`,
      );
      await fs.writeFile(
        path.join(tempDir, '.env'),
        'PORT=3000\nDATABASE_URL=postgres://localhost/db\n',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('creates .env.example file', async () => {
      execSync(`node ${CLI_PATH} generate --dir ${tempDir} --dotenv .env --example .env.example`, {
        encoding: 'utf-8',
        timeout: 10000,
      });

      const content = await fs.readFile(path.join(tempDir, '.env.example'), 'utf-8');
      expect(content).toContain('PORT');
      expect(content).toContain('DATABASE_URL');
    });

    it('preserves existing .env.example entries on re-run', async () => {
      await fs.writeFile(path.join(tempDir, '.env.example'), 'PORT=3000\n');

      execSync(`node ${CLI_PATH} generate --dir ${tempDir} --dotenv .env --example .env.example`, {
        encoding: 'utf-8',
        timeout: 10000,
      });

      const content = await fs.readFile(path.join(tempDir, '.env.example'), 'utf-8');
      expect(content).toContain('PORT');
      expect(content).toContain('DATABASE_URL');
    });
  });

  describe('edge cases', () => {
    const tempDir = path.join(PROJECT_ROOT, 'tests', 'temp-empty');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('handles empty directory', () => {
      const result = execSync(
        `node ${CLI_PATH} scan --dir ${tempDir} --dotenv .env --example .env.example`,
        { encoding: 'utf-8', timeout: 10000 },
      );
      expect(result).toContain('scanned');
    });
  });

  describe('version flag', () => {
    it('outputs version', () => {
      const result = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf-8' });
      expect(result).toContain('1.0.0');
    });
  });

  describe('help flag', () => {
    it('outputs help text', () => {
      const result = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf-8' });
      expect(result).toContain('scan');
      expect(result).toContain('check');
      expect(result).toContain('generate');
    });
  });
});
