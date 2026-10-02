import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Two builds from one codebase:
//   --mode prod → base /fanki/      → dist/
//   --mode dev  → base /fanki/dev/  → dist/dev/   (built second, emptyOutDir false)
// API_URL_<ENV> and LEARNER_TOKEN_<ENV> come from .env.local locally and from
// GitHub Actions secrets in CI. The learner token is public by design (read + append reviews only).
export default defineConfig(({ mode, command }) => {
  const isProd = mode === 'prod';
  const ENV = isProd ? 'PROD' : 'DEV';
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const base = process.env.FANKI_BASE ?? (isProd ? '/fanki/' : '/fanki/dev/');
  const name = isProd ? 'Fanki' : 'Fanki DEV';
  const iconDir = isProd ? 'icons/prod' : 'icons/dev';

  if (command === 'build' && !process.env.FANKI_ALLOW_NO_API && (!env[`API_URL_${ENV}`] || !env[`LEARNER_TOKEN_${ENV}`])) {
    throw new Error(`API_URL_${ENV} / LEARNER_TOKEN_${ENV} missing (set in .env.local or CI secrets)`);
  }

  return {
    base,
    plugins: [
      preact(),
      {
        name: 'fanki-html',
        transformIndexHtml: (html: string) =>
          html.replaceAll('%APP_NAME%', name).replaceAll('%ICON_DIR%', `${base}${iconDir}`)
      },
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: [`${iconDir}/apple-touch-icon.png`, `${iconDir}/favicon.svg`],
        manifest: {
          id: base,
          name,
          short_name: name,
          description: 'Oefen Nederlands, ook zonder internet.',
          lang: 'nl',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#101418',
          theme_color: '#101418',
          icons: [
            { src: `${iconDir}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: `${iconDir}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
            // Android: content inside the inner ~78 % so circle/squircle masks never cut it (scripts/make-icons.mjs)
            { src: `${iconDir}/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          cacheId: isProd ? 'fanki-prod' : 'fanki-dev',
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          // PROD's worker (scope /fanki/) must never answer for the DEV app under /fanki/dev/.
          globIgnores: isProd ? ['dev/**', 'icons/dev/**'] : ['icons/prod/**'],
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: isProd ? [/\/dev\//] : [],
          cleanupOutdatedCaches: true
        }
      })
    ],
    define: {
      __API_URL__: JSON.stringify(env[`API_URL_${ENV}`] ?? ''),
      __LEARNER_TOKEN__: JSON.stringify(env[`LEARNER_TOKEN_${ENV}`] ?? ''),
      __APP_ENV__: JSON.stringify(ENV),
      __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? new Date().toISOString().slice(0, 16))
    },
    build: {
      outDir: process.env.FANKI_OUT_DIR ?? (isProd ? 'dist' : 'dist/dev'),
      emptyOutDir: isProd || !!process.env.FANKI_OUT_DIR,
      target: 'safari15'
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts']
    }
  };
});
