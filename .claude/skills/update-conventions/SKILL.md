---
name: update-conventions
description: Add or change a project code convention, enforcing it with tooling where possible and keeping CLAUDE.md and docs/conventions/ in sync. Use when the user runs /update-conventions, or asks to add, expand, change, or document a code / style / testing / naming / architecture convention for this repo.
---

# Update conventions

Capture a new (or changed) convention once, in the right place, at the most
deterministic enforcement tier available. This repo's philosophy: **enforce what must
always happen; document the rest** (ADR-0004 explains the doc topology).

## Surfaces

- **`CLAUDE.md`** — the terse must-follow rules, loaded every session. `AGENTS.md` is a
  symlink to it; never create a separate `AGENTS.md`.
- **`docs/conventions/*.md`** — per-area detail with `paths:` frontmatter, symlinked
  into `.claude/rules/` so they load when matching files are touched. One topic per
  file; create a new file (plus symlink) only for a genuinely new area.
- **`docs/adr/`** — the _why_, only for decisions that are hard to reverse, surprising
  without context, and a real trade-off.
- There is **no** separate human-facing standards doc — `docs/conventions/` serves both
  audiences. Don't create one.

## Procedure

1. **Clarify & scope.** Restate the rule in one sentence. Check it doesn't contradict
   an existing rule in `docs/conventions/` or an ADR; resolve conflicts with the user
   before writing.

2. **Pick the enforcement tier** — the key decision. Most deterministic first:
   - **Prettier** (`.prettierrc`) — formatting.
   - **ESLint** (`eslint.config.mjs`) — code patterns. Search for an existing
     rule/plugin before writing prose. A convention specific to this repo goes into
     `tools/eslint-plugin-sliding-puzzle/` as a new rule **with RuleTester specs** in
     `rules/rules.spec.mjs`.
   - **Stylelint** (`stylelint.config.mjs`) — CSS conventions.
   - **Hook** (`.claude/hooks/`, `.husky/`) — actions that must run at fixed moments.
   - **CI** (`.github/workflows/ci.yml`) — the authoritative gate.
   - **Prose** — only when the rule genuinely can't be machine-checked; say so
     explicitly where you document it.

3. **Write it down.** Detail + example into the relevant `docs/conventions/*.md`. Add a
   `CLAUDE.md` line **only if** it's must-follow prose a linter can't catch — don't
   duplicate anything tooling now enforces, and keep `CLAUDE.md` under ~80 lines.

4. **Apply the enforcement change** (config edit, new rule + specs, dependency). If
   autofixable, run the fixer across the repo.

5. **Verify.** `pnpm lint && pnpm typecheck && pnpm test` — all green before done.
