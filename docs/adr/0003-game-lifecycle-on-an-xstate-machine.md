# Game lifecycle runs on an XState machine

Game state is global — the UI reports move count and status outside the board — so it
lives in an XState machine rather than component-local state. The machine owns the
lifecycle (idle, playing, solved) and the choreography around it; the engine (ADR-0001)
remains the sole authority on what a legal move is, and the machine's guards delegate to
it rather than restating the rules.

Recorded because the machine looks heavier than the problem: a reader counting three
states will wonder why this isn't a store, and the answer is that transitions a state
does not declare are impossible by construction, and that animation sequencing is
declarative rather than a pile of timeouts.

## Considered options

- **Zustand.** Smaller, selector-based, and a natural fit for a store whose actions just
  call engine functions. Rejected: nothing in a store prevents a move being applied to a
  solved game, so legality at the lifecycle level stays a convention.

## Consequences

- Components send events and read machine state through selectors; they never mutate
  game state directly.
- The engine must stay callable outside the machine, so its functions take arguments and
  return values rather than reading machine context.
