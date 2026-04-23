# Hule

Personal ClickUp alternative. Vue 3 + PrimeVue + Fastify + MongoDB, all in Docker.

## Stack
- **web** — Vue 3 + TypeScript + Vite + PrimeVue + VueUse + Pinia
- **api** — Fastify 5 + TypeScript + official `mongodb` driver (+ GridFS)
- **mongo** — MongoDB 7

## Run (dev)
```
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Web:  http://localhost:5173
- API:  http://localhost:3100/api/health  (proxied through web at http://localhost:5173/api/health)
- Mongo: port not exposed to host by default

## Run (default / prod-like)
```
docker compose up --build
```

## Layout
```
apps/
  web/   Vite + Vue app
  api/   Fastify API (thin proxy over mongodb)
```

Frontend talks to the API via the `/api` prefix (Vite dev proxy in dev, nginx/Fastify serving in prod).

Data access in the frontend goes through `apps/web/src/data/repo/*` (repository interface) and `apps/web/src/data/managers/*` (caching layer) — swap the repo implementation to change data source.
