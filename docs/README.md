# Documentation map

Four trees, split by purpose rather than audience. Humans and agents read the same
files — see [ADR-0004](adr/0004-conventions-split-by-purpose-not-audience.md).

| Tree                           | Holds                                                        | Reach for it when                                   |
| ------------------------------ | ------------------------------------------------------------ | --------------------------------------------------- |
| [`adr/`](adr/)                 | Why a decision was made, and what was rejected               | You want to change something and need the reasoning |
| [`conventions/`](conventions/) | The rules that follow — engine, components, testing, styling | You are writing code                                |
| [`journey/`](journey/)         | How the project got built, phase by phase, with screenshots  | You are documenting or showcasing a phase           |
| [`agents/`](agents/)           | How agent skills consume this repo                           | You are configuring the issue tracker or triage     |

Two files sit at the repo root and belong to this set:

- **[CONTEXT.md](../CONTEXT.md)** — the domain glossary. Every term the code may use, and
  the synonyms it must not. Read it before naming anything.
- **[CLAUDE.md](../CLAUDE.md)** — the terse must-follow rules, loaded into every agent
  session. `AGENTS.md` is a symlink to it.

## How they fit together

- A decision is recorded **once**, in `adr/`. Everything else links to it.
- `conventions/*.md` carry `paths:` frontmatter and are symlinked into `.claude/rules/`,
  so an agent loads only the ones matching the files it touches.
- `journey/` is narrative and chronological. It links ADRs and never restates them.
