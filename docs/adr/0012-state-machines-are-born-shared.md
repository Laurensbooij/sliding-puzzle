# State machines are born shared in a machines tier

Machines live in `src/machines/<name>/`, imported as `@machines/<name>`. They are
a sibling of `src/components/` in the import flow — `engine → lib →
{machines | components} → features → app` — and the two never import each other:
machines are logic, components are presentation, and they meet only in features.

This is the second exception to "colocate by default; promote on the 2nd
consumer" (the first: ADR-0009). Recorded because the first machine had exactly
one consumer, so the ladder said colocate — and a reader will reasonably ask why
it doesn't.

## Considered options

- **Colocate in the owning feature** (`src/features/game/game-machine.ts`). The
  ladder's answer, and where the game machine first landed. Rejected: a machine is
  framework-agnostic logic (engine + XState, no React), so a feature folder
  understates its reach — and cross-feature imports are banned, which would force
  a second consumer to duplicate the machine rather than promote it.
- **A `src/game/` domain tier.** Names the domain rather than the technology, and
  was the reviewer's recommendation. Rejected by decision: one bucket for every
  machine keeps the lifecycle layer discoverable in one place as machines
  accumulate, and the per-machine folder (`machines/game-machine/`) keeps each
  machine's module, spec and barrel together.

## Consequences

- Machine purity is lint-enforced like engine purity: no React, no `@xstate/react`,
  no CSS under `src/machines/` — components subscribe to machines, machines never
  reach into React.
- `@machines/*` joins the alias set (ADR-0007 amended); the `@/machines` spelling
  is a lint error.
- Machines run in the **node** Vitest project: `.spec.ts`, no DOM.
- The tier names the technology, not the domain. If XState is ever replaced
  (ADR-0003 records Zustand as the considered alternative), this folder is the
  rename surface.
