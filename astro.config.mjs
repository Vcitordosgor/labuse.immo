import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Site statique déployable tel quel sur OVH ou Cloudflare Pages (dossier `dist/`).
export default defineConfig({
  site: 'https://labuse.immo',
  output: 'static',
  integrations: [
    // applyBaseStyles: false -> on gère le reset/base nous-mêmes dans src/styles/global.css
    tailwind({ applyBaseStyles: false }),
  ],
});
