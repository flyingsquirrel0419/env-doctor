import type { EnvRef, EnvDef, VarInfo, VarStatus, AnalysisResult } from '../types.js';
import { parseDotenvFile } from '../parser/dotenv.js';

export interface AnalyzeInput {
  references: EnvRef[];
  definitions: EnvDef[];
  documentedNames: Set<string>;
  directory: string;
  envFiles: string[];
  filesScanned: number;
  durationMs: number;
}

export async function analyze(input: AnalyzeInput): Promise<AnalysisResult> {
  const { references, definitions, documentedNames, directory, envFiles, filesScanned, durationMs } = input;

  const usedNames = new Map<string, EnvRef[]>();
  const dynamicWarnings: EnvRef[] = [];

  for (const ref of references) {
    if (ref.isDynamic) {
      dynamicWarnings.push(ref);
      continue;
    }
    const existing = usedNames.get(ref.name);
    if (existing) {
      existing.push(ref);
    } else {
      usedNames.set(ref.name, [ref]);
    }
  }

  const definedNames = new Map<string, EnvDef>();
  for (const def of definitions) {
    definedNames.set(def.name, def);
  }

  const allNames = new Set<string>([
    ...usedNames.keys(),
    ...definedNames.keys(),
  ]);

  const variables: VarInfo[] = [];
  let missing = 0;
  let unused = 0;
  let undocumented = 0;
  let ok = 0;

  for (const name of allNames) {
    const isUsed = usedNames.has(name);
    const isDefined = definedNames.has(name);
    const isDocumented = documentedNames.has(name);

    let status: VarStatus;
    if (isUsed && !isDefined) {
      status = 'missing';
      missing++;
    } else if (!isUsed && isDefined) {
      status = 'unused';
      unused++;
    } else if (isDefined && !isDocumented) {
      status = 'undocumented';
      undocumented++;
    } else {
      status = 'ok';
      ok++;
    }

    variables.push({
      name,
      status,
      references: usedNames.get(name) ?? [],
      definition: definedNames.get(name),
      documented: isDocumented,
    });
  }

  variables.sort((a, b) => {
    const order: Record<VarStatus, number> = { missing: 0, undocumented: 1, unused: 2, ok: 3 };
    const diff = order[a.status] - order[b.status];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  return {
    variables,
    summary: { total: allNames.size, missing, unused, undocumented, ok },
    meta: {
      filesScanned,
      durationMs,
      directory,
      envFiles,
    },
    dynamicAccessWarnings: dynamicWarnings,
  };
}

export async function loadDocumentedNames(examplePath: string): Promise<Set<string>> {
  const result = await parseDotenvFile(examplePath);
  return new Set(result.definitions.map((d) => d.name));
}
