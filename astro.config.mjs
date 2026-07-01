import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import cloudflare from '@astrojs/cloudflare';

// Site majoritairement statique + endpoints SSR (formulaire de contact) sur
// Cloudflare Pages. `output: 'hybrid'` = pages prérendues par défaut, SSR
// uniquement là où `export const prerender = false` (voir src/pages/api/contact.ts).
export default defineConfig({
  site: 'https://labuse.immo',
  output: 'hybrid',
  adapter: cloudflare({
    // Proxy des bindings Cloudflare en dev local : DÉSACTIVÉ.
    // Il lance workerd, qui exige macOS 13.5+ / glibc 2.35+ et plante ailleurs.
    // Les bindings (SEB, NOTION_TOKEN) n'existent que déployés sur Cloudflare ;
    // en dev, /api/contact répond simplement `binding_missing` (comportement documenté).
    // Pour le réactiver ponctuellement : CF_PROXY=1 npm run dev
    platformProxy: { enabled: process.env.CF_PROXY === '1' },
  }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    preact(),
  ],
});
