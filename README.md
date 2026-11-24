# ZothPen — offensive security field manual

> A free, offline-first, dependency-free penetration-testing field manual and
> course that runs entirely in the browser. 16 modules, 70 tool dossiers,
> 16 hands-on labs, 74 drills, 17 scripting recipes. No backend, no accounts,
> no analytics, no paywall.
>
> Live: https://zothpen.netlify.app · Source: https://github.com/1nc0gn30/zothpen

## What it is

ZothPen is a single static page (hash-routed SPA) that teaches offensive
security from legal scoping to active-directory abuse: lesson bodies, tool
dossiers with real flags and syntax, copy-paste labs against targets you own,
graded drills, and a "Forge" of hardening recipes in bash, python, ruby, lua
and powershell. Progress, XP, streaks and appearance live in `localStorage`
only — nothing leaves the browser.

## Content

| Track | Count |
| ----- | ----- |
| Modules (m00–m15) | 16 |
| Tool dossiers | 70 |
| Hands-on labs | 16 |
| Drills (graded, explained) | 74 |
| Forge recipes | 17 |

## Run it locally

No build step, no dependencies: serve the repository root over HTTP and open it.

```bash
python3 -m http.server 8080
# then open http://127.0.0.1:8080/
```

Opening `index.html` straight from the filesystem mostly works, but a real
static server is what the app is tested against.

## Layout

```
index.html            app shell + head (SEO/meta live here)
assets/
  app.js              router, state, md() renderer
  data-*.js           content: window.ZM modules, ZT tools, ZL labs, ZD drills, ZF forge
  views-*.js          view renderers
  style.css           CRT/phosphor theme
  fonts/              self-hosted (no external font CDN)
  img/  comic/  agents/
tools/                dev scripts (audit, dump, selftest build) — not part of the app
_selftest.html        in-browser regression harness
netlify.toml          publish "." + security/cache headers
robots.txt sitemap.xml llms.txt
og.png                1200x630 social card
tools/og-card.html    source for the card (render: see below)
```

## Deploy

Hosted on Netlify as a standalone site: build command none, publish directory
`.`. The repo is connected for continuous deployment — a push to `main` ships
it. Any static host works the same way.

## Editing the head

All SEO/meta/JSON-LD lives in the `<head>` of `index.html` and is hand-written
(there is no generator for this site). The origin used by `canonical`, `og:url`,
`og:image`, the JSON-LD `@id`s, `robots.txt` and `sitemap.xml` is
`https://zothpen.netlify.app/`. When the `zothpen.nullai.tech` domain is live,
replace that one origin in those five places and re-deploy.

## Attribution & Support

Engineered by **Neal Frazier Tech** ([@1nc0gn30](https://github.com/1nc0gn30)) • [NullAI Platform](https://nullai.tech).

- 100% free & open-access: [Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

## Legal

Everything here is for authorised testing of systems you own or have written
permission to assess. Read module 00 — it is the point.
