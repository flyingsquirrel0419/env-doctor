# Contributing to env-doc

Thank you for your interest in contributing! 🎉

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/env-doc`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes (see Development Setup below)
5. Push and open a Pull Request

## Development Setup

```bash
npm install           # Install dependencies
npm run build         # Build first (required for integration tests)
npm test              # Run tests (integration tests need dist/)
npm run test:coverage # Run with coverage report
npm run lint          # Check code style
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format code with Prettier
npm run typecheck     # Type check without building
```

**Requirements:** Node.js 18+

## Code Style

- **Formatter:** Prettier (config in `.prettierrc`)
- **Linter:** ESLint with `@typescript-eslint` + `prettier` config
- **Types:** Strict TypeScript — no `as any`, no `@ts-ignore`, no `@ts-expect-error`
- **Imports:** Use `.js` extensions in import paths (ESM requirement)
- Run `npm run lint:fix` to auto-fix formatting issues before committing

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new extractor for PHP`
- `fix: handle multiline quoted values correctly`
- `docs: update README with CI example`
- `test: add edge case tests for analyzer`
- `chore: update dependencies`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include tests for new features
- Update documentation if needed
- Ensure all checks pass: `npm run lint && npm run typecheck && npm run build && npm test`

## Adding a New Language Extractor

1. Create `src/scanner/extractors/<language>.ts`
2. Implement the `EnvExtractor` interface:
   ```typescript
   import type { EnvExtractor, EnvRef } from '../../types.js';

   export const languageExtractor: EnvExtractor = {
     extensions: ['.ext'],
     extract(content: string, filePath: string): EnvRef[] {
       // Parse content and return env variable references
     },
   };
   ```
3. Register in `src/scanner/extractors/index.ts`
4. Add test fixtures in `tests/fixtures/`
5. Add unit tests in `tests/scanner/extractors.test.ts`

## Reporting Issues

- 🐛 **Bug reports:** Include the command you ran, expected output, actual output, and Node.js version
- 💡 **Feature requests:** Describe the problem you're trying to solve

## Code of Conduct

Be kind and respectful. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
