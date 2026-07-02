import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';

// Site 100 % statique déployé sur Cloudflare Pages (dossier `dist/`).
// Le formulaire de contact est servi par un Worker SÉPARÉ (workers/contact/),
// routé sur labuse.immo/api/contact* — les routes Worker priment sur Pages.
export default defineConfig({
  site: 'https://labuse.immo',
  output: 'static',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    preact(),
  ],
});
