<div align="center">

# 🩺 env-doc

**One command to catch every missing, unused, and undocumented `.env` variable.**

[![npm version](https://img.shields.io/npm/v/env-doc?style=flat-square)](https://www.npmjs.com/package/env-doc)
[![License](https://img.shields.io/github/license/env-doc/env-doc?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/node/v/env-doc?style=flat-square)](https://nodejs.org)

</div>

---

## Why env-doc?

Every developer has deployed to production only to watch it crash because of a missing `.env` variable. `env-doc scan` finds those variables **before** they cause downtime — and cleans up stale ones while it's at it.

Three problems, one command:

| Problem | What happens | How env-doc helps |
|---------|-------------|---------------------|
| **Missing variables** | Code uses `DATABASE_URL` but `.env` doesn't have it | Detected as `❌ Missing` |
| **Unused variables** | `.env` has `OLD_REDIS_URL` nobody uses anymore | Detected as `🗑️ Unused` |
| **Undocumented variables** | `.env` has `INTERNAL_API_KEY` but `.env.example` doesn't | Detected as `⚠️ Undocumented` |

---

## ✨ Features

- 🚀 **Zero config** — run `npx env-doc` in any project directory
- 🔍 **Multi-language** — JavaScript, TypeScript, Python, Go, Ruby
- 📊 **Structured output** — pretty terminal tables or JSON for tooling
- 🔁 **Auto-generate `.env.example`** — keeps docs in sync with one command
- 🤖 **CI-ready** — `env-doc check` exits with code 1 on missing variables
- ⚡ **Fast** — scans hundreds of files in under 500ms

---

## 🚀 Quick Start

```bash
npx env-doc scan
```

That's it. No install needed.

```
env-doc v1.0.0  ·  scanned 47 files in 284ms

❌  Missing  (3)
   DATABASE_URL      src/db.ts:12, src/config.ts:8
   JWT_SECRET        src/auth/middleware.ts:4
   STRIPE_API_KEY    src/payments/stripe.ts:22

⚠️  Undocumented  (2)
   INTERNAL_API_KEY
   DEBUG_MODE

🗑️  Unused  (1)
   OLD_REDIS_URL

✅  OK  (8)
   PORT, NODE_ENV, API_BASE_URL, ... (and 5 more)

────────────────────────────────────────
Run `env-doc generate` to update .env.example
```

---

## 📦 Installation

**Run without installing (recommended):**
```bash
npx env-doc scan
```

**Install globally:**
```bash
npm install -g env-doc
```

**From source:**
```bash
git clone https://github.com/env-doc/env-doc
cd env-doc && npm install && npm run build
```

---

## 📖 Commands

### `env-doc scan`

Scan and report env variable issues. Always exits `0`.

```bash
env-doc scan                          # scan current directory
env-doc scan --dir ./src              # scan specific directory
env-doc scan --dotenv .env.local    # use specific .env file
env-doc scan --format json            # JSON output
env-doc scan --no-color               # disable colors
env-doc scan -i "**/vendor/**"        # ignore additional patterns
```

### `env-doc check`

Same as `scan`, but exits `1` if missing variables found. Perfect for CI.

```bash
env-doc check                         # fails on missing vars
env-doc check --strict                # also fail on unused/undocumented
```

**CI example (GitHub Actions):**
```yaml
- name: Check env variables
  run: npx env-doc check
```

### `env-doc generate`

Generate or update `.env.example` from scan results.

```bash
env-doc generate                      # creates/updates .env.example
env-doc generate --example .env.tmpl  # custom output path
```

---

## ⚙️ Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--dir <path>` | `-d` | `./` | Directory to scan |
| `--dotenv <path>` | `-e` | `.env` | Path to .env file |
| `--example <path>` | `-x` | `.env.example` | Path to .env.example file |
| `--ignore <patterns>` | `-i` | — | Additional glob patterns to ignore |
| `--format <type>` | `-f` | `text` | Output format: `text` or `json` |
| `--no-color` | | — | Disable colored output |
| `--strict` | | — | (check only) Fail on unused/undocumented too |
| `--version` | | — | Print version |
| `--help` | | — | Print help |

---

## 🗺️ Supported Languages

| Language | Patterns detected |
|----------|------------------|
| JavaScript / TypeScript | `process.env.VAR`, `process.env['VAR']`, `process.env["VAR"]` |
| Python | `os.environ.get('VAR')`, `os.environ['VAR']`, `os.getenv('VAR')` |
| Go | `os.Getenv("VAR")` |
| Ruby | `ENV['VAR']`, `ENV.fetch('VAR')` |

**Dynamic access warning:** Patterns like `process.env[dynamicKey]` can't be statically analyzed. env-doc detects these and reports them as warnings.

---

## 🏗️ Architecture

```
CLI Entry (Commander.js)
    │
    ├── Scanner ──── Walker (fast-glob) ──── Extractors (per-language regex)
    │                                                    │
    │                                          EnvRef[] (used variables)
    │
    ├── Parser ──── Dotenv parser ──── EnvDef[] (defined variables)
    │
    └── Analyzer ── compares used ↔ defined ↔ documented
                         │
                    AnalysisResult
                         │
                    ┌────┴────┐
                 Reporter   Generator
                (text/json)  (.env.example)
```

---

## 🧪 Development

```bash
git clone https://github.com/env-doc/env-doc && cd env-doc
npm install
npm run build          # build first (required for integration tests)
npm test               # run test suite
npm run test:coverage  # run with coverage report
npm run lint           # check code style
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## 🗺️ Roadmap

- [x] v1.0 — Core scan, check, generate commands
- [ ] v1.1 — PHP and Rust extractors
- [ ] v1.2 — `env-doc.config.ts` support
- [ ] v2.0 — Monorepo multi-.env support, VSCode extension

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

Apache-2.0 — see [LICENSE](LICENSE) for details.

---

<div align="center">
Made with ❤️ for developers tired of "undefined is not a string" · <a href="https://github.com/env-doc/env-doc">Star this repo ⭐</a>
</div>
