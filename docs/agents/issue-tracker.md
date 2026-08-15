# Issue tracker: Linear

Issues and specs for this repo live in the **Sliding puzzle** Linear workspace
(<https://linear.app/sliding-puzzle>), team **Sliding puzzle**, issue key `SLI`.

All operations go through the **Linear MCP tools**. There is no CLI path — do not
reach for `gh issue`, even though the code itself lives on GitHub.

## Conventions

- **Create an issue**: `save_issue` with `team: "Sliding puzzle"`, `title`, and
  `description` (Markdown, literal newlines — no escape sequences). Omit `id`.
- **Read an issue**: `get_issue` with the identifier (e.g. `SLI-42`), plus
  `list_comments` for the discussion thread.
- **List issues**: `list_issues` with `team`, and `state` / `label` / `assignee`
  filters as needed. Pass `fields` to control what comes back.
- **Comment**: `save_comment` with the issue id.
- **Apply / remove labels**: `save_issue` with `labels` — it _replaces_ the whole
  label set, so include the labels you want to keep. `create_issue_label` first if
  the label doesn't exist yet.
- **Close**: `save_issue` with `state: "Done"`; use `state: "Canceled"` when the
  issue is being dropped rather than completed.

Statuses on this team: `Backlog`, `Todo`, `In Progress`, `Done`, `Canceled`, `Duplicate`.

## Pull requests as a triage surface

**PRs as a request surface: no.** Code review happens on GitHub; the triage queue is
Linear-only.

## When a skill says "publish to the issue tracker"

Create a Linear issue with `save_issue`.

## When a skill says "fetch the relevant ticket"

`get_issue` on the identifier, then `list_comments` for the thread.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: an issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far /
  Fog body.
- **Child ticket**: an issue with `parentId` set to the map's identifier — Linear
  sub-issues are the native representation. Labels: `wayfinder:<type>`
  (`research` / `prototype` / `grilling` / `task`). Once claimed, assign to the
  driving dev.
- **Blocking**: Linear's native issue relations — `save_issue` with `blockedBy`
  (append-only; `removeBlockedBy` to clear). A ticket is unblocked when every
  blocker is in a completed or canceled state.
- **Frontier query**: `list_issues` with `parentId: "<map>"` and an incomplete
  state filter; drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `save_issue` with `assignee: "me"` — the session's first write.
- **Resolve**: `save_comment` with the answer, `save_issue` to `Done`, then append a
  context pointer to the map's Decisions-so-far (`patch` with an `append` op).
