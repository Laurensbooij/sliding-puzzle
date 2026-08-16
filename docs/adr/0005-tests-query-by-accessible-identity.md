# Tests query by accessible identity, not by test id

Component tests query with `getByRole` and `getByLabelText` first, falling back to
`getByTestId` only for elements with no accessible identity. Test ids remain mandatory on
interactive and state-bearing elements — they are stable targets for debugging and for
any future end-to-end layer, not the mechanism unit tests reach for.

Recorded because the pairing looks contradictory: ids that every component must carry and
that most tests deliberately don't use. The reason is that when `getByRole` fails, it has
usually found an accessibility defect rather than a testing inconvenience, and a
test-id-first suite passes identically whether a tile is a `<button>` or an unfocusable
`<div>`. Given the WCAG 2.2 AA commitment, the query strategy is what keeps that
commitment tested rather than merely stated.

## Consequences

- Tests run in jsdom, which computes the accessibility tree by approximation. Role and
  name assertions are therefore weaker than they would be in a real browser; Storybook's
  accessibility addon covers part of the gap at the story layer.
- "Use a test id only where no accessible query works" is a judgement call and stays
  prose. The mechanical parts — no inline `data-testid` literals, ids declared in
  `constants.ts` — are lint rules.
