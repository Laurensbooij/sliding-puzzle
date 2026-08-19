# Routing runs on react-router's data router

The app has two routes — Setup at `/` and Play at `/play` — served by
**`createBrowserRouter` + `<RouterProvider>`** from `react-router`. The route
table is a plain object array under one layout route (`AppShell`), with **no
loaders and no actions**: every piece of state a screen reads lives in a
provider mounted above the router (ADR-0015), so there is nothing for the
router to fetch.

The **data** router specifically, not the declarative `<BrowserRouter>`. The
navigation guard that blocks leaving a game in progress is `useBlocker`, and
`useBlocker` exists only on the data router. Choosing the declarative one now
would mean rewriting the entry point the moment that guard lands.

## This is outside ADR-0011's scope, not an exception to it

[ADR-0011](0011-no-runtime-ui-dependencies.md) says the interactive primitives
carry zero runtime UI dependencies, and its revisit test is explicitly about
**ARIA Authoring Practices patterns with no native equivalent** — a listbox, a
combobox, a date picker. A router is neither an interactive primitive nor an
ARIA pattern: it renders no UI, has no accessibility contract of its own, and
replaces no native element.

Spelled out because "no runtime UI dependencies" is exactly the line a future
reader will think this crossed. It did not. ADR-0011 stands unamended, and the
question a router raises — is the platform's own API enough? — is answered
below on its own terms.

## Considered options

- **Hand-rolled History API routing.** Two routes need little: a
  `popstate` listener, `history.pushState`, and a switch on `location.pathname`.
  Rejected on the two jobs that are not the switch:
  - **Blocking a navigation.** Leaving a game mid-play has to raise a confirm
    dialog and then either proceed or stay. The History API cannot veto a
    `popstate` — the URL has already changed by the time the event fires, so a
    hand-rolled guard has to push the old entry back and hope nothing else
    reacted in between. react-router's blocker sits in front of the transition
    instead, which is the difference between preventing a navigation and undoing
    one.
  - **Route-change accessibility.** Per-route `document.title` and moving focus
    to the new screen's `<h1>` need a single point that knows a transition
    happened and which route won. A layout route plus `useMatches` is that
    point; the hand-rolled version grows the same machinery, only untested.

  Two routes is also the floor, not the ceiling: the Records screen was cut from
  this scope, not from the product.

- **TanStack Router.** Type-safe paths and a first-class blocker. Rejected as
  more router than two routes justify — file-based or fully typed route trees
  earn their keep at a scale this app does not have — and react-router is what
  the rest of the React ecosystem's documentation assumes.

## Consequences

- **Navigation is the app tier's job**, one step beyond the boundary rules in
  [ADR-0007](0007-module-boundaries-and-import-aliases.md). `src/app/` owns the
  router, the route table, and every `useNavigate` / `useBlocker` call — the
  navigation blocker is registered by the Play **route element**, not by the Play
  screen, which keeps react-router out of `src/features/play` entirely. A widget
  may still render a `<Link>`; a link is markup, and the header's wordmark is
  one. What no screen does is decide where it is mounted: it takes a callback,
  and the app tier wires that callback to a route.
- **Paths live in `src/lib/routes/`**, not in the router. Both the route table
  and the screens that link between them read the same constant. No alias — two
  call sites do not clear ADR-0007's bar for minting one.
- **`/play` is always valid and mounting it starts a fresh shuffled game.** The
  game config is persisted, so a grid size and an artwork always exist; pasting
  the URL or refreshing mid-game therefore starts over rather than resuming.
  There is no resume story and so no bounce-to-Setup guard.
- **Unknown paths redirect to Setup**, replacing the history entry. There is no
  designed 404 surface, and inventing one for a two-screen app would be a screen
  nobody drew.
- **No skip link (SC 2.4.1) — an explicit N/A.** A skip link exists to bypass a
  block of repeated content ahead of the main content. What repeats above
  `page-content` is the header's two focusable elements — the wordmark and the
  gear — which is two tab presses, not a block. Route changes move focus to the
  new screen's `<h1>` instead, which is the thing a skip link would have been
  approximating. Revisit if the header ever grows a nav list.
- **No `basename` and no SPA fallback are configured.** Both are deploy-time
  concerns and there is no deploy workflow yet. Static hosting will need the
  rewrite-to-`index.html` rule; that lands with the deploy.
- **One more runtime dependency.** Measured on the branch that added it: the
  app's JS bundle went from 75 kB to 105 kB gzipped — about **30 kB** for the
  router, which is the largest single dependency here after React. Accepted for
  the blocker and the route-change accessibility above; the hand-rolled
  alternative costs near nothing in bytes and is priced in correctness instead.
