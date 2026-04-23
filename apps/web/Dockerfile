FROM node:22-alpine

WORKDIR /repo

# Enable pnpm via corepack (locked to the version in the root package.json).
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# Copy monorepo manifests + lockfile. Submodules (libs/ui-kit, libs/styles-kit,
# libs/ts-api-kit, libs/event-bus, libs/bp-compiler) and local libs must be
# present in the build context — run `git submodule update --init --recursive`
# before `docker compose build`.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY libs ./libs
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY tsconfig.base.json tsconfig.json vite.aliases.ts ./

WORKDIR /repo/apps/web
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
