import { resolve } from 'node:path'

/**
 * Shared alias resolver for all apps in the monorepo.
 * Mirrors the `paths` declarations in the root tsconfig.json.
 * Apps also get a per-app `@/` alias pointing at their own `src/`.
 */
export function getResolvedAliases(appDir: string): Record<string, string> {
  const root = resolve(appDir, '../..')
  return {
    '@hule/types': resolve(root, 'libs/types/src'),
    '@hule/utils': resolve(root, 'libs/utils/src'),
    '@buildery/ui-kit': resolve(root, 'libs/ui-kit/src'),
    '@buildery/common-css-styles': resolve(root, 'libs/styles-kit/src/index.scss'),
    '@buildery/ts-api-kit': resolve(root, 'libs/ts-api-kit/src'),
    '@buildery/event-bus': resolve(root, 'libs/event-bus/src'),
    '@buildery/bp-compiler': resolve(root, 'libs/bp-compiler/src'),
    '@': resolve(appDir, 'src'),
  }
}
