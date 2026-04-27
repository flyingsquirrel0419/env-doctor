# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-27

### Added

- `dotenv-scan scan` — scan project for env variable issues with text or JSON output
- `dotenv-scan check` — CI-friendly command that exits 1 on missing variables
- `dotenv-scan generate` — auto-generate or update `.env.example` from scan results
- Language extractors for JavaScript/TypeScript, Python, Go, and Ruby
- `.env` file parser with support for comments, quoted values, multiline values
- Variable classification: missing, unused, undocumented, OK
- Dynamic access detection (`process.env[key]`) with warnings
- File size limit (1MB) and binary file detection
- `--strict` flag for `check` command to fail on unused/undocumented too
- `--format json` for structured output
- `--ignore` flag for additional glob patterns
- `--no-color` for CI environments
- Zero config — works out of the box with sensible defaults
- Full test suite with unit and integration tests
- TypeScript strict mode with full type coverage

### Security

- No network access — fully offline operation
- Only variable names in output, never values
- Input validation on file paths and glob patterns
- File size limits prevent resource exhaustion
- Minimal dependency footprint (3 runtime dependencies)
