# Puzzle rules live in a pure engine, separate from React

All board rules — shuffling, move legality, solvability, solved detection — live in a
module that imports nothing from React and touches no DOM. React reaches it only through
the game machine (ADR-0003), so components render state and send events but never decide
what is legal.

The seam exists to be enforced, not just described: "no React import inside the engine"
is a mechanical check a lint rule can make, which is why it was chosen over conventions
that degrade silently.

## Considered options

- **Rules inside hooks** (`useGame` owning the logic, tested via `renderHook`). Rejected:
  shuffle and solvability need thousands of seeded runs to verify, which is fast against
  pure functions and painful through a renderer. It also leaves no enforceable boundary —
  logic drifts into components one commit at a time with nothing to catch it.

## Consequences

- The unit/component test split follows the seam: engine behaviour is tested without a
  DOM, components are tested for rendering and interaction only.
- The engine cannot read from React context. Anything it needs is an argument.
