# Development journey

How this sliding puzzle got built, phase by phase. Each milestone documents the goal, the decisions, and what the result looked like.

## Milestones

| #   | Milestone                                            | Status      |
| --- | ---------------------------------------------------- | ----------- |
| 01  | [Task manager](01-task-manager.md)                   | Done        |
| 02  | [Design system in Claude](02-design-system.md)       | Done        |
| 03  | [Figma refinement](03-figma-refinement.md)           | In progress |
| 04  | [Project setup](04-project-setup.md)                 | Done        |
| 05  | [Component set](05-component-set.md)                 | Not started |
| 06  | [Puzzle implementation](06-puzzle-implementation.md) | Not started |

## Writing a milestone

Copy the structure of an existing file. Every milestone answers four questions:

- **Goal** — the job to be done in this phase.
- **Screenshots** — what the result looked like.
- **Decisions** — what got tried, and what got overruled.
- **Next** — what this unblocked.

Link the Linear issues (`SLI-x`) and the commit range that delivered the work.

Milestone numbers give ordering, not a closed set. Append `07-`, `08-` as phases appear.

### When to write each part

- **Create the file when the phase starts**, with the Goal filled in.
- **Fill Decisions during the phase**, while the reasoning is still fresh.
- **Add Screenshots and Next at the end**, once there is a result to show.

Statuses use exactly three values: **Done**, **In progress**, **Not started**.

### Link decisions, never restate them

A milestone's **Decisions** section holds only what is too small or too contingent for an
ADR — what got tried, what got overruled, what turned out impossible. Anything
load-bearing enough that a contributor could violate it belongs in
[docs/adr/](../adr/), linked from here.

Restating an ADR means every reversal has to be edited in two places, and the journey
copy is the one that silently goes stale. Write `chose XState ([ADR-0003](../adr/0003-game-lifecycle-on-an-xstate-machine.md))`,
not a paragraph explaining XState.

## Screenshot conventions

- **Location:** `assets/NN-milestone-slug/`. One folder per milestone.
- **Filename:** `kebab-slug.png`, describing what is shown. No dates — order comes from the milestone number.
- **Format:** PNG for UI, JPEG for photographic content.
- **Size:** max 1600px wide, under 500KB per file. Git keeps every version of a binary forever.
- **Reference:** use relative paths so images render on GitHub and in editors.

```markdown
![3x3 grid with one tile mid-slide](assets/06-puzzle-implementation/tile-slide.png)
```

Write alt text that describes the image. It is the fallback when the image fails to load.
