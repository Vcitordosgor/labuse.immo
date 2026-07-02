# LA BUSE — site vitrine

One-pager marketing de **LA BUSE**, plateforme B2B d'intelligence foncière pour
promoteurs immobiliers à La Réunion.

Stack : **Astro** (`output: 'static'`) + **Tailwind CSS** (build-time, tokens dans
`tailwind.config.js`) + **Preact** (îlot pour le formulaire). Zéro CDN, fonts
auto-hébergées (Inter + JetBrains Mono).

Architecture (pattern éprouvé sur tania.re) : **site 100 % statique sur Cloudflare
Pages** + **Worker séparé `labuse-contact`** (`workers/contact/`) routé sur
`labuse.immo/api/contact*` pour le formulaire. Les routes Worker priment sur Pages :
le front appelle `fetch('/api/contact')` en relatif, c'est le worker qui répond.

## Commandes

```bash
npm install      # installer les dépendances
npm run dev      # serveur de dev → http://localhost:4321
npm run build    # build statique → dist/
npm run preview  # prévisualiser le build
```

## Déploiement

### 1. Le site — Cloudflare Pages
Projet Pages connecté au repo, branche `main` : build command `npm run build`,
output `dist`. Rien d'autre (pas de binding, pas de flag : le site est statique).

### 2. Le formulaire — Worker `labuse-contact` (Workers Builds)
Projet **Workers Builds** connecté au même repo GitHub, branche `main` :

| Réglage | Valeur |
|---|---|
| **Root directory (Path)** | `workers/contact` ⚠️ **critique** — sans lui, wrangler auto-génère une config « assets » et déploie tout le repo (`.git` compris) |
| Build command | *(vide)* |
| Deploy command | `npx wrangler deploy` |

Le binding **`SEB`** et la **route** `labuse.immo/api/contact*` viennent du
`workers/contact/wrangler.jsonc` — rien à créer à la main. Seul le secret
**`NOTION_TOKEN`** s'ajoute dans le dashboard du Worker après création
(Settings → Variables and Secrets).

Prérequis Email Routing (sinon `send_failed`) : Email Routing actif sur
`labuse.immo`, destination `contactlabuse@gmail.com` **vérifiée**, sender
`contact@labuse.immo` + **SPF/DKIM/DMARC** sur le domaine.

## Formulaire de contact

Section `Contact.astro` → îlot Preact `ContactForm.tsx` (`client:visible`) qui POST
en JSON vers `/api/contact` (le worker). Côté client : validation, honeypot
`website`, time-trap. Côté worker (`workers/contact/src/index.js`) :

1. honeypot + validation (nom / téléphone / email) ;
2. email interne via le binding **`SEB`** (obligatoire, MIME construit main) ;
3. best-effort (ne bloque jamais le `200`) : auto-réponse + lead dans la base
   Notion « Deals » si `NOTION_TOKEN` est présent.

**À personnaliser** en haut de `workers/contact/src/index.js` : `MARQUE`,
`NOTIFY_EMAIL`, `SENDER_EMAIL`, `SITE_NAME`.

> En **dev local**, il n'y a pas de worker → le POST `/api/contact` répond 404 et le
> formulaire affiche l'erreur avec repli `mailto`. Le flux complet ne se teste que
> déployé.

## Où éditer

| Je veux changer…                | Fichier |
|---------------------------------|---------|
| Les **couleurs / typo (tokens)**| `tailwind.config.js` **et** les variables `:root` de `src/styles/global.css` (garder les deux synchronisés) |
| L'**e-mail de contact / les CTA démo** | `src/consts.ts` (`CONTACT_EMAIL`, `CONTACT_ANCHOR`, `CALENDLY_URL`). Les boutons « Demander une démo » pointent vers le formulaire (`#contact`). |
| Le **formulaire de contact** (destinataire, marque, sender) | `src/pages/api/contact.ts` (constantes en haut) |
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
| 6 | Aperçu produit (maquette) | `ProductPreview.astro` |
| 7 | Les données (22 couches) | `DataLayers.astro` |
| 8 | Chiffres clés | `KeyFigures.astro` |
| 9 | Pour qui | `Audience.astro` |
| 10 | CTA final | `FinalCTA.astro` |
| 11 | Contact (formulaire) | `Contact.astro` (+ `ContactForm.tsx`, `api/contact.ts`) |
| 12 | Bandeau confiance | `TrustBar.astro` |
| 13 | Footer | `Footer.astro` |

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
- [ ] Compléter l'**identité légale** (forme juridique, SIREN, siège, directeur de la
      publication) — `src/pages/mentions-legales.astro`.
- [ ] Confirmer le **volume réel de parcelles** — `src/components/KeyFigures.astro`
      (« 500 000+ », à ajuster à la fin du run prototype).
- [x] ~~Image Open Graph en PNG~~ → `public/og.png` généré (1200×630).
- [x] ~~Pages légales~~ → `/mentions-legales` + `/confidentialite` créées et liées.
- [x] ~~Page 404~~ → `src/pages/404.astro`.
- [x] ~~Headers sécurité/cache~~ → `public/_headers` (CSP, X-Frame-Options, cache immutable).
