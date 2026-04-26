import type { AnalysisResult } from '../types.js';
import path from 'node:path';

export interface JsonReport {
  version: string;
  summary: AnalysisResult['summary'];
  meta: AnalysisResult['meta'];
  variables: Array<{
    name: string;
    status: string;
    references: Array<{ file: string; line: number }>;
    documented: boolean;
  }>;
  dynamicAccessWarnings: Array<{ expression: string; file: string; line: number }>;
}

export function formatJsonReport(result: AnalysisResult): string {
  const report: JsonReport = {
    version: '1.0.0',
    summary: result.summary,
    meta: {
      ...result.meta,
      directory: path.resolve(result.meta.directory),
      envFiles: result.meta.envFiles.map((f) => path.resolve(f)),
    },
    variables: result.variables.map((v) => ({
      name: v.name,
      status: v.status,
      references: v.references.map((r) => ({
        file: path.relative(process.cwd(), r.file),
        line: r.line,
      })),
      documented: v.documented,
    })),
    dynamicAccessWarnings: result.dynamicAccessWarnings.map((w) => ({
      expression: w.name,
      file: path.relative(process.cwd(), w.file),
      line: w.line,
    })),
  };

  return JSON.stringify(report, null, 2);
}
