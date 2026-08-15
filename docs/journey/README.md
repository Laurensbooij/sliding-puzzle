# Development journey

How this sliding puzzle got built, phase by phase. Each milestone documents the goal, the decisions, and what the result looked like.

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 01 | [Task manager](01-task-manager.md) | Done |
| 02 | [Design system in Claude](02-design-system.md) | Done |
| 03 | [Figma refinement](03-figma-refinement.md) | In progress |
| 04 | [Project setup](04-project-setup.md) | In progress |
| 05 | [Component set](05-component-set.md) | Not started |
| 06 | [Puzzle implementation](06-puzzle-implementation.md) | Not started |

## Writing a milestone

Copy the structure of an existing file. Every milestone answers four questions:

- **Goal** — the job to be done in this phase.
- **Screenshots** — what the result looked like.
- **Decisions** — what got chosen, and why.
- **Next** — what this unblocked.

Link the Linear issues (`SLI-x`) and the commit range that delivered the work.

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
