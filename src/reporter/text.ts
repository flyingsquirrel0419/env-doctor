import chalk from 'chalk';
import path from 'node:path';
import type { AnalysisResult, VarInfo } from '../types.js';

export function formatTextReport(result: AnalysisResult, useColor: boolean): string {
  const c = useColor
    ? chalk
    : {
        red: (s: string) => s,
        yellow: (s: string) => s,
        green: (s: string) => s,
        gray: (s: string) => s,
        bold: {
          red: (s: string) => s,
          yellow: (s: string) => s,
          green: (s: string) => s,
          gray: (s: string) => s,
        },
        dim: (s: string) => s,
      };

  const lines: string[] = [];
  const { summary, meta, dynamicAccessWarnings } = result;

  lines.push(`env-doctor v1.0.0  ·  scanned ${meta.filesScanned} files in ${meta.durationMs}ms`);
  lines.push('');

  const groups: Array<{
    status: VarInfo['status'];
    icon: string;
    label: string;
    color: (s: string) => string;
    description: string;
  }> = [
    {
      status: 'missing',
      icon: '❌',
      label: 'Missing',
      color: c.red,
      description: '← in code, not in .env',
    },
    {
      status: 'undocumented',
      icon: '⚠️',
      label: 'Undocumented',
      color: c.yellow,
      description: '← in .env, not in .env.example',
    },
    {
      status: 'unused',
      icon: '🗑️',
      label: 'Unused',
      color: c.gray,
      description: '← in .env, not in code',
    },
    { status: 'ok', icon: '✅', label: 'OK', color: c.green, description: '' },
  ];

  for (const group of groups) {
    const vars = result.variables.filter((v) => v.status === group.status);
    if (vars.length === 0 && group.status !== 'ok') continue;

    const header = `  ${group.icon}  ${group.label}  (${vars.length})${group.description ? '  ' + group.description : ''}`;
    lines.push(header);

    for (const v of vars) {
      const locations = v.references
        .map((r) => {
          const rel = path.relative(process.cwd(), r.file);
          return `${rel}:${r.line}`;
        })
        .join(', ');

      if (v.status === 'ok') {
        lines.push(`     ${v.name}`);
      } else {
        const loc = locations ? `  ${locations}` : '';
        lines.push(`     ${v.name}${loc}`);
      }
    }

    if (group.status === 'ok' && vars.length > 8) {
      const extra = vars.length - 5;
      lines.length -= extra;
      const names = vars
        .slice(0, 5)
        .map((v) => v.name)
        .join(', ');
      lines[lines.length - 1] = `     ${names}, ... (and ${extra} more)`;
    }

    lines.push('');
  }

  if (dynamicAccessWarnings.length > 0) {
    lines.push(c.yellow('  ⚠  Dynamic access detected (cannot be tracked statically):'));
    for (const w of dynamicAccessWarnings) {
      const rel = path.relative(process.cwd(), w.file);
      lines.push(`     ${w.name}  at ${rel}:${w.line}`);
    }
    lines.push('');
  }

  lines.push('─'.repeat(40));

  if (summary.missing > 0) {
    lines.push(
      c.red(
        `Found ${summary.missing} missing variable(s). Run \`env-doctor generate\` to update .env.example`,
      ),
    );
  } else if (summary.unused > 0 || summary.undocumented > 0) {
    lines.push(
      c.yellow('Some variables need attention. Run `env-doctor generate` to update .env.example'),
    );
  } else {
    lines.push(c.green('All environment variables are in sync! ✨'));
  }

  return lines.join('\n');
}
