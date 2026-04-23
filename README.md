# Hule

Personal ClickUp alternative. Vue 3 + PrimeVue + Fastify + MongoDB, organised as a **pnpm monorepo**.

## Stack
- **web** — Vue 3 + TypeScript + Vite + PrimeVue + VueUse + Pinia + vis-timeline
- **api** — Fastify 5 + TypeScript + official `mongodb` driver (+ GridFS) + Zod
- **mongo** — MongoDB 7

## Layout
```
hule/
├── package.json             pnpm workspace root
├── pnpm-workspace.yaml      packages: apps/*, libs/*
├── tsconfig.base.json       strict base shared by all apps/libs
├── tsconfig.json            root aliases (@hule/*, @buildery/*)
├── vite.aliases.ts          vite alias helper — mirrors tsconfig paths
├── apps/
│   ├── web/                 @hule/web — Vue 3 SPA
│   └── api/                 @hule/api — Fastify server
└── libs/
    ├── types/               @hule/types — shared domain models
    ├── utils/               @hule/utils — shared utilities (date, html, window)
    ├── ui-kit/              @buildery/ui-kit (git submodule)
    ├── styles-kit/          @buildery/common-css-styles (git submodule)
    ├── ts-api-kit/          @buildery/ts-api-kit (git submodule)
    ├── event-bus/           @buildery/event-bus (git submodule)
    └── bp-compiler/         @buildery/bp-compiler (git submodule)
```

### apps/web/src domain-first layout
```
src/
├── app/         cross-cutting (api httpClient, layout)
├── space/       api/ store/ components/ views/
├── list/        api/ store/ views/
├── task/        api/ store/ classes/ compose/ components/ views/ constants/
├── comment/     api/ store/ components/
├── kanban/      components/
├── timeline/    views/ components/ compose/ classes/ styles/
└── sidebar/     components/
```

### apps/api/src domain-first layout
```
src/
├── server.ts, db.ts
├── shared/      dto.ts, validation.ts (Zod helpers)
└── modules/
    ├── space/{space.routes.ts, space.schema.ts}
    ├── list/{list.routes.ts, list.schema.ts}
    ├── task/{task.routes.ts, task.schema.ts}
    ├── comment/comment.routes.ts
    └── file/file.routes.ts
```

## First-time setup

```bash
git clone <repo>
cd hule
git submodule update --init --recursive     # fetch libs/ submodules
pnpm install
```

`.npmrc` has `shamefully-hoist=true` so PrimeVue / vis-timeline / ui-kit peer
dependencies resolve correctly.

## Run (dev)
```
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```
- Web:   http://localhost:5173
- API:   http://localhost:3100/api/health (also via web at http://localhost:5173/api/health)
- Mongo: not exposed to host by default

## Run (prod-like)
```
docker compose up --build
```

## Local development (without Docker)
```bash
pnpm dev:web    # vite dev server
pnpm dev:api    # fastify with tsx watch
pnpm type-check # vue-tsc + tsc across workspace
pnpm build      # builds all packages
```

Frontend talks to the API via the `/api` prefix (Vite dev proxy in dev, nginx/Fastify serving in prod).
