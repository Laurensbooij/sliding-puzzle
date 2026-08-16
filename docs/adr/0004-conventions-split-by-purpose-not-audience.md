# Conventions are split by purpose, not by audience

`CLAUDE.md` is the real file and `AGENTS.md` is a symlink to it; detailed per-area
conventions live in `docs/conventions/*.md`, each symlinked into `.claude/rules/` and
carrying `paths:` frontmatter so an agent loads only the ones matching the files it is
touching. Rationale lives here, in `docs/adr/`.

Recorded because the obvious alternative — a full human-facing standards document plus a
distilled agent-facing copy — is what most repos do, and someone will propose it. That
layout splits one body of content by audience, which means two copies, which means a
tool to keep them in sync. Splitting by purpose instead (rules / detail / rationale)
leaves every fact in exactly one place, readable by both audiences.

## Considered options

- **`docs/CODING_STANDARDS.md` (full) + a distilled `CLAUDE.md`.** Rejected: the
  duplication is the whole cost, and the sync tooling it requires is a symptom, not a
  solution.
- **A `follow-conventions` skill that loads the standards.** Rejected: skills are
  model-invoked, so a must-have would load only when the model chose to. Path-scoped
  rules load deterministically on matching file reads.

## Consequences

- The symlink direction is deliberate. `CLAUDE.md` is the real file so that a checkout
  without symlink support degrades `AGENTS.md` rather than the file the primary tool
  reads.
- Path-scoped rules are not re-injected after context compaction; they reload on the next
  matching file read. Rules that must always hold belong in the linter, not in prose.
