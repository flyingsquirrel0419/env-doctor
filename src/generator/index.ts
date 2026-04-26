import fs from 'node:fs/promises';
import path from 'node:path';
import type { AnalysisResult } from '../types.js';

interface GenerateOptions {
  examplePath: string;
  result: AnalysisResult;
}

export async function generateExample(options: GenerateOptions): Promise<void> {
  const { examplePath, result } = options;
  const resolved = path.resolve(examplePath);

  const existingEntries = new Map<string, string>();

  try {
    const existingContent = await fs.readFile(resolved, 'utf-8');
    const lines = existingContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.length === 0) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const name = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (name) {
        existingEntries.set(name, value || '');
      }
    }
  } catch {
    // No existing file — will create new
  }

  const allVarNames = new Set<string>();
  for (const v of result.variables) {
    if (v.status !== 'unused') {
      allVarNames.add(v.name);
    }
  }

  const sections: string[] = [];
  const missing = result.variables.filter((v) => v.status === 'missing');
  const undocumented = result.variables.filter((v) => v.status === 'undocumented');
  const ok = result.variables.filter((v) => v.status === 'ok');

  if (missing.length > 0) {
    sections.push('# ⚠ Missing — defined in code but not in .env');
    for (const v of missing) {
      const value = existingEntries.get(v.name) ?? '';
      const locations = v.references.map((r) => `${path.basename(r.file)}:${r.line}`).join(', ');
      sections.push(`${v.name}=${value}  # used in ${locations}`);
    }
    sections.push('');
  }

  if (undocumented.length > 0) {
    sections.push('# Undocumented — in .env but missing from .env.example');
    for (const v of undocumented) {
      const value = existingEntries.get(v.name) ?? '';
      sections.push(`${v.name}=${value}`);
    }
    sections.push('');
  }

  if (ok.length > 0) {
    sections.push('# OK — defined and used');
    for (const v of ok) {
      const value = existingEntries.get(v.name) ?? '';
      sections.push(`${v.name}=${value}`);
    }
    sections.push('');
  }

  const newContent = sections.join('\n') + '\n';

  await fs.writeFile(resolved, newContent, 'utf-8');
}
