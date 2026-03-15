# Agent Instructions for pict-cli

## Overview

pict-cli is a Node.js command-line tool for PICT-style combinatorial test
generation. It is an independent project by the package author and is not
affiliated with Microsoft. The CLI delegates generation logic to
[@takeyaqa/pict-wasm](https://github.com/takeyaqa/pict-wasm).

## Build and Test Commands

```bash
# Install dependencies
pnpm install

# Format and formatting check
pnpm run fmt
pnpm run fmt:check

# Lint
pnpm run lint

# End-to-end tests
pnpm run test
```

## Architecture

- `bin/cli.js` is the single executable entrypoint.
- The CLI parses short options with `node:util.parseArgs`.
- It reads exactly one model file from disk and optionally reads a seed file.
- It creates `PictRunner`, runs the model, and prints either tab-separated test
  cases or model statistics.
- Error handling maps local `CliError` instances and upstream `PictError`
  failures to process exit codes, while preserving stdout/stderr behavior.
- `tests/e2e.spec.js` is the end-to-end test suite, built with `node:test` and
  `spawnSync` against the real CLI entrypoint.

## Key Conventions

- **Git Workflow**: Always create a new branch from `main` before starting any task
- **Prettier** for formatting
- **Commit Messages**: Use Conventional Commits format (e.g., `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`)
- **Before committing** - Always run `pnpm run fmt`, `pnpm run lint`, and `pnpm run test`
- **Ignore `pnpm-lock.yaml`** - Always skip this file during code review and pull request creation
