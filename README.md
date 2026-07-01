# LA BUSE — site vitrine

One-pager marketing de **LA BUSE**, plateforme B2B d'intelligence foncière pour
promoteurs immobiliers à La Réunion.

Stack : **Astro** (`output: 'hybrid'`, adapter **Cloudflare**) + **Tailwind CSS**
(build-time, tokens dans `tailwind.config.js`) + **Preact** (îlot pour le formulaire).
Zéro CDN, fonts auto-hébergées (Inter + JetBrains Mono). Pages prérendues (statiques),
sauf l'endpoint SSR du formulaire (`/api/contact`).

## Commandes

```bash
npm install      # installer les dépendances
npm run dev      # serveur de dev → http://localhost:4321
npm run build    # build → dist/ (pages statiques + worker SSR)
npm run preview  # prévisualiser via l'adapter Cloudflare
```

Déploiement : **Cloudflare Pages** — build command `npm run build`, output `dist`.
Le formulaire de contact nécessite des bindings Cloudflare (voir plus bas) ; le reste
du site est statique.

## Formulaire de contact (SSR Cloudflare)

Section `Contact.astro` → îlot Preact `ContactForm.tsx` (`client:load`) qui POST vers
l'endpoint `src/pages/api/contact.ts`. Celui-ci :

1. valide (nom / téléphone / email) + **honeypot** + **time-trap** anti-spam ;
2. envoie l'email interne via le binding Email Routing **`SEB`** (obligatoire) ;
3. best-effort (ne bloque jamais le `200`) : auto-réponse au visiteur + création du
   lead dans la base Notion « Deals » (`src/lib/notionLead.ts`) si `NOTION_TOKEN` est là.

**À personnaliser** en haut de `src/pages/api/contact.ts` : `MARQUE`, `NOTIFY_EMAIL`,
`SENDER_EMAIL`, `SITE_NAME`.

### Config Cloudflare (obligatoire pour que le formulaire marche)

- **Pages → Settings → Functions → Bindings** : ajouter un *Send Email binding* nommé
  `SEB` (Production **et** Preview). Déclaré aussi dans `wrangler.jsonc` (`send_email`).
- **Pages → Settings → Environment variables** : `NOTION_TOKEN = secret_xxx`
  (Production + Preview). **Jamais** dans `wrangler.jsonc`.
- Activer **Email Routing** sur le domaine **`labuse.immo`**, vérifier le sender
  (`contact@labuse.immo`) et ajouter **SPF + DKIM + DMARC** sur `labuse.immo`
  (sinon les mails partent en spam).

> En **dev local**, les bindings n'existent pas → l'API répond `binding_missing` (500).
> C'est normal : le flux email/Notion ne fonctionne que sur Cloudflare (Preview/Prod).
> `wrangler.jsonc` + `platformProxy` exposent ce qui est possible en local.

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
- [ ] Brancher le **vrai lien de prise de RDV** (Calendly / Cal.com) — `CALENDLY_URL`
      dans `src/consts.ts`.
- [ ] Confirmer l'**adresse de contact** — `CONTACT_EMAIL` dans `src/consts.ts`.
- [ ] Exporter une image **Open Graph en PNG** (1200×630) et remplacer `public/og.svg`
      (certains crawlers ignorent le SVG). Réf. `og:image` dans `BaseLayout.astro`.
- [ ] Créer les **pages légales** (mentions, confidentialité, CGU) et brancher les liens
      du footer.
