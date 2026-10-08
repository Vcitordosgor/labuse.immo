# LABUSE — site vitrine

One-pager marketing de **LABUSE** : tout le foncier de La Réunion au même endroit.

Stack : **Astro 4** (`output: 'static'`), CSS maison (`src/styles/global.css`,
tokens dans `:root`), un seul script inline par page. Zéro CDN, polices
auto-hébergées via @fontsource (Inter, Space Grotesk, JetBrains Mono) : la CSP
de `public/_headers` impose `font-src 'self'`.

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
npm run seo:check  # après le build : titles, canonical, JSON-LD, sitemap, mots interdits
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

Section `#contact` de `src/pages/index.astro` : le script de la page POST en JSON
vers `/api/contact` (le worker). Les boutons `data-pre="demo|flash"` (et `?pre=…`
dans l'URL) pré-remplissent le message. Côté client : validation, honeypot
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
| Les **couleurs / typo (tokens)**| variables `:root` de `src/styles/global.css` |
| Le **texte d'une section**, l'ordre des sections, le formulaire | `src/pages/index.astro` |
| Le **menu** / le **pied de page** | `src/components/Header.astro` / `src/components/Footer.astro` |
| Le **SEO / Open Graph / JSON-LD** | `src/layouts/BaseLayout.astro` (commun) ; JSON-LD de l'offre Flash en tête de `src/pages/index.astro` |
| Les **pages légales** | `src/pages/mentions-legales.astro`, `src/pages/confidentialite.astro` |
| La **vidéo** | `public/video/` (sources de tournage et de montage : `docs/refonte/video/`) |
| L'**image de partage** | `public/og.jpg` (1200×630) |
| Ce que lisent les IA | `public/llms.txt` |

Le plan du site (`sitemap-index.xml`) est généré au build par `@astrojs/sitemap`,
**épinglé en 3.2.1** (les 3.7.x plantent sur Astro 4).

Maquette validée, vidéo et notes de la refonte d'octobre 2026 : `docs/refonte/`.
Corrections à faire côté app : `docs/refonte/A-FAIRE-APP.md`.
