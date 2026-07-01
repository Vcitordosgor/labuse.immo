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
    // Expose les bindings Cloudflare (SEB, NOTION_TOKEN…) en dev local via wrangler.
    platformProxy: { enabled: true },
  }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    preact(),
  ],
});
