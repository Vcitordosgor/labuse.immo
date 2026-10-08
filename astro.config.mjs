import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Site 100 % statique déployé sur Cloudflare Pages (dossier `dist/`).
// Le formulaire de contact est servi par un Worker SÉPARÉ (workers/contact/),
// routé sur labuse.immo/api/contact* — les routes Worker priment sur Pages.
export default defineConfig({
  site: 'https://labuse.immo',
  output: 'static',
  integrations: [
    // Plan du site généré au build : sitemap-index.xml + sitemap-0.xml, URLs avec slash final.
    // @astrojs/sitemap épinglé en 3.2.1 dans package.json (les 3.7.x visent Astro 5 et
    // plantent au build sur Astro 4). La 404 (noindex) est exclue.
    sitemap({
      filter: (page) => !/\/404\/?$/.test(new URL(page).pathname),
    }),
  ],
  // Aucune police inlinée en data: dans le CSS : la CSP (font-src 'self') les bloquerait.
  vite: { build: { assetsInlineLimit: 0 } },
});
