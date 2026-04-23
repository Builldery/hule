FROM node:22-alpine

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY libs ./libs
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @hule/api...

COPY apps/api ./apps/api
COPY tsconfig.base.json tsconfig.json ./

WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["pnpm", "run", "dev"]
