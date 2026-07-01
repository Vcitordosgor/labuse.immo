# LA BUSE — site vitrine

One-pager marketing de **LA BUSE**, plateforme B2B d'intelligence foncière pour
promoteurs immobiliers à La Réunion.

Stack : **Astro** (output statique) + **Tailwind CSS** (build-time, tokens dans
`tailwind.config.js`). Zéro CDN, fonts auto-hébergées (Inter + JetBrains Mono).

## Commandes

```bash
npm install      # installer les dépendances
npm run dev      # serveur de dev → http://localhost:4321
npm run build    # build statique → dist/
npm run preview  # prévisualiser le build
```

Le dossier `dist/` est déployable tel quel sur **OVH** (hébergement mutualisé) ou
**Cloudflare Pages** (build command `npm run build`, output `dist`).

## Où éditer

| Je veux changer…                | Fichier |
|---------------------------------|---------|
| Les **couleurs / typo (tokens)**| `tailwind.config.js` **et** les variables `:root` de `src/styles/global.css` (garder les deux synchronisés) |
| L'**e-mail de contact / le lien démo** | `src/consts.ts` (`CONTACT_EMAIL`, `DEMO_MAILTO`, `CALENDLY_URL`) |
| Les **entrées du menu**         | `src/consts.ts` (`NAV`) |
| Le **texte d'une section**      | Le composant correspondant dans `src/components/` (une section = un composant) |
| Le **SEO / Open Graph / JSON-LD** | `src/layouts/BaseLayout.astro` |
| L'**ordre des sections**        | `src/pages/index.astro` |

### Correspondance sections → composants

| # | Section | Composant |
|---|---------|-----------|
| 1 | Header sticky | `Header.astro` |
| 2 | Hero + radar | `Hero.astro` (+ `Radar.astro`) |
| 3 | Le constat | `Constat.astro` |
| 4 | Ce que fait LA BUSE | `Features.astro` |
| 5 | Comment ça marche | `HowItWorks.astro` |
| 6 | Les données (22 couches) | `DataLayers.astro` |
| 7 | Chiffres clés | `KeyFigures.astro` |
| 8 | Pour qui | `Audience.astro` |
| 9 | CTA final | `FinalCTA.astro` |
| 10 | Bandeau confiance | `TrustBar.astro` |
| 11 | Footer | `Footer.astro` |

## Le radar

`src/components/Radar.astro` contient l'élément signature : cercle + grille radiale +
faisceau tournant + contour **réel** de La Réunion (path issu du GeoJSON officiel dépt
974, `france-geojson` / gregoiredavid) + points parcellaires clignotants + point
« détecté » en surbrillance. Les animations (`sweep`, `blink`, `pulse`) et la carte de
détection sont dans `src/styles/global.css`.

Toutes les animations se **figent proprement** avec `prefers-reduced-motion: reduce`.

## À faire avant mise en production (`TODO` dans le code)

- [ ] Remplacer les **logos placeholders** du bandeau confiance par de vrais clients
      (avec accord signé) — `src/components/TrustBar.astro`.
- [ ] Brancher le **vrai lien de prise de RDV** (Calendly / Cal.com) — `CALENDLY_URL`
      dans `src/consts.ts`.
- [ ] Confirmer l'**adresse de contact** — `CONTACT_EMAIL` dans `src/consts.ts`.
- [ ] Exporter une image **Open Graph en PNG** (1200×630) et remplacer `public/og.svg`
      (certains crawlers ignorent le SVG). Réf. `og:image` dans `BaseLayout.astro`.
- [ ] Créer les **pages légales** (mentions, confidentialité, CGU) et brancher les liens
      du footer.
