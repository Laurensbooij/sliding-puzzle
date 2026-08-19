# State homes are modular, and storage stays out of machines

Game config, player settings and records each get their own module under
`src/lib/` — a provider, a hook, and a hand-rolled type guard over one versioned
localStorage key. They share exactly one thing: `usePersistedState` from
`src/lib/storage/`, which is where the whole persistence policy lives. No store,
no app machine, nothing wrapping all three.

Recorded because the alternative is the obvious one: the repo already runs a
lifecycle on XState (ADR-0003), so a reader will ask why this state is not on a
machine too — or at least behind a single `AppStateProvider`.

## Why not an app machine

[ADR-0003](./0003-game-lifecycle-on-an-xstate-machine.md) justifies a machine by
**lifecycle legality**: a game has states that make transitions impossible by
construction, and that is what a store cannot give. Config, settings and records
have no lifecycle. They are key-value state with persistence — every field is
writable at any time, and there is no transition to make illegal. A machine
would add ceremony without adding a guarantee.

Persistence is the second half of it. A machine that reads and writes
localStorage stops being testable as pure logic, and the one piece of real logic
here — `applySolve` — is a function the records module unit-tests the way the
engine is tested, with no React and no storage anywhere near it.

## Consequences

- **The version lives in the key**, `sliding-puzzle.<name>.v1`. A shape change is
  a new key, so a migration is "read the old key if present, else defaults" —
  never an in-place upgrade that has to cope with every shape ever shipped.
- **Invalid, unparseable or unknown data resolves to defaults, silently.** Each
  module hand-rolls its guard; no schema library. Keys are independent, so a
  corrupt one can only cost its own module its stored value.
- **Records is a provider, not a bare hook.** Three readers across features
  (the BEST card, the solved dialog, the Setup record line) must agree the
  instant a solve lands; independent hooks would each hold a copy and drift.
- **`GridSize` narrows at the config edge only.** The engine keeps bare numbers —
  `createBoard(rows, cols)` is untouched — so the union constrains what Setup may
  offer without leaking a UI concern into the rules.
- The storage helper was built because all three consumers exist now. It is the
  second consumer rule honoured, not a platform laid down in advance.

## Considered options

- **One app machine for config, settings and records.** Rejected above: no
  lifecycle to make legal, and it would pull storage into a module that is
  otherwise pure logic.
- **A single `AppStateProvider` holding all three.** Rejected: it couples three
  independently versioned keys to one context, so any write re-renders every
  reader, and the "which key owns this?" answer stops being the folder name.
- **Bare hooks instead of providers, for settings and config too.** Rejected for
  records (readers would drift), and kept uniform for the other two — three
  modules that look alike are cheaper to read than two shapes chosen per module.
