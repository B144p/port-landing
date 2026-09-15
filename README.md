# port-landing

Single-page entry point for the port-\* portfolio frontends. Lists every published
`FrontendVersion` from `port-server`, lets a visitor pick one, and auto-redirects to the
first version by `order` after 60 seconds of inactivity. Themed after `port-oscilloscope`.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `API_URL` — base URL of the `port-server` instance to fetch `/v1/frontend-version`
  from (e.g. a local instance, the `dev` Render deployment, or production once it's
  live). Server-only: `lib/backend.ts` and `app/api/frontend-version/route.ts` are the
  only things that read it — the browser never talks to `port-server` directly.
- `NEXT_PUBLIC_FRONTEND_VERSION_KEY` — the `key` this page sends as
  `X-Frontend-Version` on its own view-counting request. Must match a `FrontendVersion.key`
  row on the backend for the request to be attributed (unknown keys are ignored, not
  errored).
- `PROXY_SHARED_SECRET` — must match `port-server`'s `PROXY_SHARED_SECRET`. Lets
  `app/api/frontend-version` forward the visitor's real IP so view counting stays
  accurate; leave unset in development if `port-server`'s is also unset.
- `TRUST_FORWARDED_FOR` — optional. The visitor IP comes from `X-Forwarded-For`, which
  is trusted automatically on Vercel (it overwrites the header at its edge). Set this to
  `true` only behind another proxy that sets the header; served directly, a visitor
  could spoof it, so it's ignored.

## Learn more

See `docs/web-port-upgrade/roadmap.md` and `docs/port-landing/roadmap.md` in the sibling
`docs` repo for the full requirements this page implements.
