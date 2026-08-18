---
paths:
  - 'src/machines/**'
---

# Machine conventions

State machines are the lifecycle layer: XState v5 logic that calls the pure
engine and nothing visual. See
[ADR-0012](../adr/0012-state-machines-are-born-shared.md) and
[ADR-0003](../adr/0003-game-lifecycle-on-an-xstate-machine.md).

## Hard boundary (lint-enforced)

- **No React, no `@xstate/react`, no CSS.** Components subscribe to machines;
  machines never reach into React.
- Machines and components are siblings: neither imports the other. Logic and
  presentation meet in features.
- Impure inputs (randomness, the clock) arrive via machine `input`, defaulted at
  the edge — never read inline from `Math.random` or `Date.now` inside actions.

## Shape

- One machine per folder: `src/machines/<name>/` holds `<name>.ts`, its
  `.spec.ts`, and an `index.ts` barrel. Import as `@machines/<name>`.
- `setup({...}).createMachine({...})`, never bare `createMachine` — named
  actions/guards and typed context, events and input.
- Guards and actions delegate rules to the engine; a machine restates no
  legality.

## Naming (Stately conventions)

- Machine export: `<name>Machine` (`gameMachine`). "Machine" is the XState term
  for actor logic — never "state machine" compounds.
- **States** are nouns/adjectives — conditions: `idle`, `playing`, `solved`.
- **Events** are dot.case verbs, namespaced: `game.start`, `cell.press`. The
  namespace enables wildcard transitions (`cell.*`).
- **Actions** are verb phrases (`shuffleBoard`); **guards** read as predicates
  (`boardIsSolved`).

## Testing

- Machine specs are `.spec.ts` in the **node** Vitest project: drive a
  `createActor(...)` with `send`, assert on `getSnapshot()`.
- Seed randomness and the clock through `input` — never fake timers.
