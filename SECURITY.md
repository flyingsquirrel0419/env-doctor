# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅ |

## Reporting a Vulnerability

**Do not report security vulnerabilities through GitHub Issues.**

If you discover a security vulnerability in env-doc:

1. **Email:** Open a GitHub Security Advisory (preferred) at
   [github.com/env-doc/env-doc/security/advisories/new](https://github.com/env-doc/env-doc/security/advisories/new)

2. **Include:**
   - Type of vulnerability
   - File paths of affected code
   - Steps to reproduce
   - Potential impact

3. **Response time:** You will receive a response within 48 hours.

4. **Disclosure:** We follow responsible disclosure — fixes are shipped before any public disclosure.

## Security Model

env-doc is a **local-only CLI tool** with these security properties:

- **No network access** — env-doc never makes HTTP requests or phone-home calls
- **No secret exfiltration** — the tool reads `.env` files but only outputs variable **names**, never values
- **No arbitrary code execution** — pure regex-based scanning, no `eval` or `Function` constructors
- **File system read-only** — `scan` and `check` only read files; `generate` writes only to `.env.example`

## Known Security Considerations

| Consideration | Status | Details |
|---------------|--------|---------|
| `.env` values in output | ✅ Safe | Only variable names are reported, never values |
| Path traversal via `--dir` | ✅ Safe | `path.resolve()` normalizes paths; fast-glob handles pattern safety |
| Regex DoS via malicious source files | ✅ Mitigated | File size limit of 1MB enforced; regex patterns are bounded |
| Supply chain | ✅ Monitored | Dependencies are minimal (3 runtime deps: chalk, commander, fast-glob) |
