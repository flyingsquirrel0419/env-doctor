import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import { javascriptExtractor } from '../../src/scanner/extractors/javascript.js';
import { pythonExtractor } from '../../src/scanner/extractors/python.js';
import { goExtractor } from '../../src/scanner/extractors/go.js';
import { rubyExtractor } from '../../src/scanner/extractors/ruby.js';
import {
  getExtractor,
  extractEnvRefs,
  getSupportedExtensions,
  extractors,
} from '../../src/scanner/extractors/index.js';

const fixturesDir = join(__dirname, '..', 'fixtures');

// ---------------------------------------------------------------------------
// JavaScript / TypeScript extractor
// ---------------------------------------------------------------------------
describe('javascriptExtractor', () => {
  it('extracts direct property access (process.env.VAR)', () => {
    const code = `const port = process.env.PORT;\nconst db = process.env.DATABASE_URL;`;
    const refs = javascriptExtractor.extract(code, 'app.ts');

    expect(refs).toHaveLength(2);

    expect(refs[0]).toEqual({
      name: 'PORT',
      file: 'app.ts',
      line: 1,
      column: 14,
      isDynamic: false,
    });

    expect(refs[1]).toEqual({
      name: 'DATABASE_URL',
      file: 'app.ts',
      line: 2,
      column: 12,
      isDynamic: false,
    });
  });

  it('extracts bracket access with string literal (process.env["VAR"])', () => {
    const code = `const x = process.env['MY_VAR'];\nconst y = process.env["OTHER"];`;
    const refs = javascriptExtractor.extract(code, 'f.js');

    expect(refs).toHaveLength(2);
    expect(refs[0].name).toBe('MY_VAR');
    expect(refs[0].isDynamic).toBe(false);
    expect(refs[1].name).toBe('OTHER');
    expect(refs[1].isDynamic).toBe(false);
  });

  it('detects dynamic bracket access (process.env[key])', () => {
    const code = `const val = process.env[dynamicKey];`;
    const refs = javascriptExtractor.extract(code, 'dynamic.ts');

    expect(refs).toHaveLength(1);
    expect(refs[0]).toEqual({
      name: '<dynamic: dynamicKey>',
      file: 'dynamic.ts',
      line: 1,
      column: 13,
      isDynamic: true,
    });
  });

  it('returns empty array for empty string input', () => {
    const refs = javascriptExtractor.extract('', 'empty.js');
    expect(refs).toEqual([]);
  });

  it('returns empty array when no env references exist', () => {
    const code = `const x = 42;\nconsole.log("hello");`;
    const refs = javascriptExtractor.extract(code, 'clean.ts');
    expect(refs).toEqual([]);
  });

  it('handles multiple references on a single line', () => {
    const code = `const a = process.env.A + process.env.B;`;
    const refs = javascriptExtractor.extract(code, 'multi.js');

    expect(refs).toHaveLength(2);
    expect(refs[0].name).toBe('A');
    expect(refs[1].name).toBe('B');
    expect(refs[0].line).toBe(1);
    expect(refs[1].line).toBe(1);
  });

  it('has correct extensions list', () => {
    expect(javascriptExtractor.extensions).toEqual([
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.mjs',
      '.cjs',
    ]);
  });

  it('parses sample.js fixture correctly', () => {
    const content = readFileSync(join(fixturesDir, 'sample.js'), 'utf-8');
    const refs = javascriptExtractor.extract(content, 'sample.js');

    expect(refs).toHaveLength(10);

    const names = refs.map((r) => r.name);
    expect(names).toContain('PORT');
    expect(names).toContain('DATABASE_URL');
    expect(names).toContain('JWT_SECRET');
    expect(names).toContain('REDIS_URL');
    expect(names).toContain('NODE_ENV');
    expect(names).toContain('API_BASE_URL');
    expect(names).toContain('STRIPE_API_KEY');
    expect(names).toContain('NEW_FEATURE_FLAG');
    expect(names).toContain('BRACKET_VAR');
    expect(names).toContain('<dynamic: dynamicKey>');

    const dynamicRefs = refs.filter((r) => r.isDynamic);
    expect(dynamicRefs).toHaveLength(1);
    expect(dynamicRefs[0].name).toBe('<dynamic: dynamicKey>');
    expect(dynamicRefs[0].line).toBe(14);
  });

  it('reports correct line, column, and file for fixture refs', () => {
    const content = readFileSync(join(fixturesDir, 'sample.js'), 'utf-8');
    const refs = javascriptExtractor.extract(content, 'sample.js');

    const port = refs.find((r) => r.name === 'PORT');
    expect(port).toBeDefined();
    expect(port!.line).toBe(3);
    expect(port!.column).toBe(14);
    expect(port!.file).toBe('sample.js');

    const dbUrl = refs.find((r) => r.name === 'DATABASE_URL');
    expect(dbUrl!.line).toBe(4);
    expect(dbUrl!.column).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// Python extractor
// ---------------------------------------------------------------------------
describe('pythonExtractor', () => {
  it('extracts os.environ.get references', () => {
    const code = `db = os.environ.get('DATABASE_URL')`;
    const refs = pythonExtractor.extract(code, 'app.py');

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('DATABASE_URL');
    expect(refs[0].file).toBe('app.py');
    expect(refs[0].isDynamic).toBe(false);
  });

  it('extracts os.getenv references', () => {
    const code = `key = os.getenv("API_KEY")`;
    const refs = pythonExtractor.extract(code, 'cfg.py');

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('API_KEY');
  });

  it('extracts os.environ["VAR"] bracket references', () => {
    const code = `secret = os.environ['MY_SECRET']`;
    const refs = pythonExtractor.extract(code, 's.py');

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('MY_SECRET');
  });

  it('returns empty array for empty string input', () => {
    const refs = pythonExtractor.extract('', 'empty.py');
    expect(refs).toEqual([]);
  });

  it('returns empty array when no env references exist', () => {
    const code = `x = 42\nprint(x)`;
    const refs = pythonExtractor.extract(code, 'clean.py');
    expect(refs).toEqual([]);
  });

  it('handles multiple references on one line', () => {
    const code = `a = os.getenv('A') + os.getenv('B')`;
    const refs = pythonExtractor.extract(code, 'multi.py');

    expect(refs).toHaveLength(2);
    expect(refs[0].name).toBe('A');
    expect(refs[1].name).toBe('B');
  });

  it('has .py extension', () => {
    expect(pythonExtractor.extensions).toEqual(['.py']);
  });

  it('parses sample.py fixture correctly', () => {
    const content = readFileSync(join(fixturesDir, 'sample.py'), 'utf-8');
    const refs = pythonExtractor.extract(content, 'sample.py');

    expect(refs).toHaveLength(5);

    const names = refs.map((r) => r.name);
    expect(names).toContain('DATABASE_URL');
    expect(names).toContain('STRIPE_API_KEY');
    expect(names).toContain('JWT_SECRET');
    expect(names).toContain('DEBUG_MODE');
    expect(names).toContain('PYTHON_VAR');

    const dbUrl = refs.find((r) => r.name === 'DATABASE_URL');
    expect(dbUrl!.line).toBe(3);
    expect(dbUrl!.column).toBe(10);

    const secret = refs.find((r) => r.name === 'JWT_SECRET');
    expect(secret!.line).toBe(5);

    const pythonVar = refs.find((r) => r.name === 'PYTHON_VAR');
    expect(pythonVar!.line).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Go extractor
// ---------------------------------------------------------------------------
describe('goExtractor', () => {
  it('extracts os.Getenv references', () => {
    const code = `db := os.Getenv("DATABASE_URL")`;
    const refs = goExtractor.extract(code, 'main.go');

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('DATABASE_URL');
    expect(refs[0].file).toBe('main.go');
    expect(refs[0].isDynamic).toBe(false);
  });

  it('returns empty array for empty string input', () => {
    const refs = goExtractor.extract('', 'empty.go');
    expect(refs).toEqual([]);
  });

  it('returns empty array when no env references exist', () => {
    const code = `func main() {\nfmt.Println("hi")\n}`;
    const refs = goExtractor.extract(code, 'clean.go');
    expect(refs).toEqual([]);
  });

  it('handles multiple Getenv calls on one line', () => {
    const code = `a := os.Getenv("A") + os.Getenv("B")`;
    const refs = goExtractor.extract(code, 'multi.go');

    expect(refs).toHaveLength(2);
    expect(refs[0].name).toBe('A');
    expect(refs[1].name).toBe('B');
    expect(refs[0].line).toBe(1);
    expect(refs[1].line).toBe(1);
  });

  it('has .go extension', () => {
    expect(goExtractor.extensions).toEqual(['.go']);
  });

  it('parses sample.go fixture correctly', () => {
    const content = readFileSync(join(fixturesDir, 'sample.go'), 'utf-8');
    const refs = goExtractor.extract(content, 'sample.go');

    expect(refs).toHaveLength(2);

    expect(refs[0]).toEqual({
      name: 'DATABASE_URL',
      file: 'sample.go',
      line: 9,
      column: 14,
      isDynamic: false,
    });

    expect(refs[1]).toEqual({
      name: 'GO_ONLY_VAR',
      file: 'sample.go',
      line: 10,
      column: 18,
      isDynamic: false,
    });
  });
});

// ---------------------------------------------------------------------------
// Ruby extractor
// ---------------------------------------------------------------------------
describe('rubyExtractor', () => {
  it('extracts ENV["VAR"] bracket references', () => {
    const code = `db = ENV['DATABASE_URL']`;
    const refs = rubyExtractor.extract(code, 'app.rb');

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('DATABASE_URL');
    expect(refs[0].file).toBe('app.rb');
    expect(refs[0].isDynamic).toBe(false);
  });

  it('extracts ENV.fetch references', () => {
    const code = `key = ENV.fetch('API_KEY')`;
    const refs = rubyExtractor.extract(code, 'cfg.rb');

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('API_KEY');
  });

  it('returns empty array for empty string input', () => {
    const refs = rubyExtractor.extract('', 'empty.rb');
    expect(refs).toEqual([]);
  });

  it('returns empty array when no env references exist', () => {
    const code = `puts "hello world"`;
    const refs = rubyExtractor.extract(code, 'clean.rb');
    expect(refs).toEqual([]);
  });

  it('handles multiple references on one line', () => {
    const code = `x = ENV['A'] + ENV['B']`;
    const refs = rubyExtractor.extract(code, 'multi.rb');

    expect(refs).toHaveLength(2);
    expect(refs[0].name).toBe('A');
    expect(refs[1].name).toBe('B');
  });

  it('has .rb and .erb extensions', () => {
    expect(rubyExtractor.extensions).toEqual(['.rb', '.erb']);
  });

  it('parses sample.rb fixture correctly', () => {
    const content = readFileSync(join(fixturesDir, 'sample.rb'), 'utf-8');
    const refs = rubyExtractor.extract(content, 'sample.rb');

    expect(refs).toHaveLength(4);

    expect(refs[0]).toEqual({
      name: 'DATABASE_URL',
      file: 'sample.rb',
      line: 1,
      column: 10,
      isDynamic: false,
    });

    expect(refs[1]).toEqual({
      name: 'STRIPE_API_KEY',
      file: 'sample.rb',
      line: 2,
      column: 11,
      isDynamic: false,
    });

    expect(refs[2]).toEqual({
      name: 'RUBY_ONLY_VAR',
      file: 'sample.rb',
      line: 3,
      column: 12,
      isDynamic: false,
    });

    expect(refs[3]).toEqual({
      name: 'DEBUG_MODE',
      file: 'sample.rb',
      line: 4,
      column: 9,
      isDynamic: false,
    });
  });
});

// ---------------------------------------------------------------------------
// Index module — getExtractor / extractEnvRefs / getSupportedExtensions
// ---------------------------------------------------------------------------
describe('extractor index', () => {
  describe('getExtractor', () => {
    it('returns javascriptExtractor for .js files', () => {
      expect(getExtractor('app.js')).toBe(javascriptExtractor);
    });

    it('returns javascriptExtractor for .ts files', () => {
      expect(getExtractor('module.ts')).toBe(javascriptExtractor);
    });

    it('returns javascriptExtractor for .tsx files', () => {
      expect(getExtractor('component.tsx')).toBe(javascriptExtractor);
    });

    it('returns pythonExtractor for .py files', () => {
      expect(getExtractor('script.py')).toBe(pythonExtractor);
    });

    it('returns goExtractor for .go files', () => {
      expect(getExtractor('main.go')).toBe(goExtractor);
    });

    it('returns rubyExtractor for .rb files', () => {
      expect(getExtractor('app.rb')).toBe(rubyExtractor);
    });

    it('returns rubyExtractor for .erb files', () => {
      expect(getExtractor('view.html.erb')).toBe(rubyExtractor);
    });

    it('returns undefined for unsupported extensions', () => {
      expect(getExtractor('style.css')).toBeUndefined();
      expect(getExtractor('readme.md')).toBeUndefined();
    });

    it('returns undefined for files with no extension', () => {
      expect(getExtractor('Makefile')).toBeUndefined();
    });
  });

  describe('extractEnvRefs', () => {
    it('delegates to correct extractor based on extension', () => {
      const jsCode = `const x = process.env.FOO;`;
      const refs = extractEnvRefs(jsCode, 'test.js');
      expect(refs).toHaveLength(1);
      expect(refs[0].name).toBe('FOO');
    });

    it('returns empty array for unsupported file types', () => {
      const refs = extractEnvRefs('some content', 'data.json');
      expect(refs).toEqual([]);
    });

    it('returns empty array for files with no extension', () => {
      const refs = extractEnvRefs('some content', 'Dockerfile');
      expect(refs).toEqual([]);
    });

    it('correctly routes .py files to python extractor', () => {
      const code = `key = os.getenv('SECRET')`;
      const refs = extractEnvRefs(code, 'config.py');
      expect(refs).toHaveLength(1);
      expect(refs[0].name).toBe('SECRET');
    });

    it('correctly routes .go files to go extractor', () => {
      const code = `val := os.Getenv("HOST")`;
      const refs = extractEnvRefs(code, 'main.go');
      expect(refs).toHaveLength(1);
      expect(refs[0].name).toBe('HOST');
    });

    it('correctly routes .rb files to ruby extractor', () => {
      const code = `host = ENV['HOST']`;
      const refs = extractEnvRefs(code, 'app.rb');
      expect(refs).toHaveLength(1);
      expect(refs[0].name).toBe('HOST');
    });
  });

  describe('getSupportedExtensions', () => {
    it('returns all supported extensions', () => {
      const exts = getSupportedExtensions();
      expect(exts).toContain('.js');
      expect(exts).toContain('.jsx');
      expect(exts).toContain('.ts');
      expect(exts).toContain('.tsx');
      expect(exts).toContain('.mjs');
      expect(exts).toContain('.cjs');
      expect(exts).toContain('.py');
      expect(exts).toContain('.go');
      expect(exts).toContain('.rb');
      expect(exts).toContain('.erb');
    });

    it('returns at least 10 extensions', () => {
      const exts = getSupportedExtensions();
      expect(exts.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('extractors list', () => {
    it('exports all four extractors', () => {
      expect(extractors).toHaveLength(4);
      expect(extractors).toContain(javascriptExtractor);
      expect(extractors).toContain(pythonExtractor);
      expect(extractors).toContain(goExtractor);
      expect(extractors).toContain(rubyExtractor);
    });
  });
});
