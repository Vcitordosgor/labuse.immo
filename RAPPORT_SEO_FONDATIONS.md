# Rapport — SEO fondations techniques (labuse.immo)

**Date** : 2026-07-10 · **Branche** : `feat/seo-fondations` (base `main` @ `d7ded6f`)
**Statut** : prêt pour validation. **Aucun merge** — Vic merge lui-même en `--no-ff`.
**Zones interdites respectées** : contenu des pages légales intact (seules leurs *meta
descriptions* `<head>` ont été resserrées, comme le mandat l'autorise), grille tarifaire
et wording prix inchangés, DA/tokens intacts, config Cloudflare Pages intacte,
ancres/ids du one-pager préservés.

---

## Avant / après par page

| Page | Title avant | Title après | Desc. avant | Desc. après |
|------|-------------|-------------|-------------|-------------|
| `/` | LA BUSE — Intelligence foncière pour promoteurs à La Réunion *(61 car.)* | **Terrain constructible à La Réunion, scoré — LA BUSE** *(51 car.)* | 240 car. ❌ | 145 car. ✅ (cadastre, PLU, PPR, 24 communes, « terrains constructibles ») |
| `/404` | Page introuvable — LA BUSE *(inchangé)* | idem + **noindex** | 66 car. (apostrophe droite) | 66 car. (apostrophe courbe) |
| `/mentions-legales/` | Mentions légales — LA BUSE *(inchangé)* | idem | 86 car. ✅ *(inchangé)* | idem |
| `/confidentialite/` | Politique de confidentialité — LA BUSE *(inchangé)* | idem | 213 car. ❌ | 153 car. ✅ |

H1 : déjà 1 seul par page, hiérarchie h1→h2→h3 sans saut — **aucune correction nécessaire**.
Canonicals : déjà absolus et uniformes (trailing slash) — **inchangés**.
OG/Twitter : déjà complets sur toutes les pages (factorisés dans `BaseLayout.astro`,
qui joue le rôle du composant SEO demandé) — **inchangés** hors `og:image` → `/og.jpg`.

## Schémas JSON-LD posés

| Page | Schémas |
|------|---------|
| Toutes | `Organization` (préexistant, conservé) + `WebSite` (nouveau) |
| `/` | `SoftwareApplication` (applicationCategory `BusinessApplication`, OS `Web`) + `AggregateOffer` 290–490 EUR/mois |
| `/mentions-legales/`, `/confidentialite/` | `BreadcrumbList` (Accueil → page) |
| — | `FAQPage` : **non posé** — aucune FAQ visible sur le site (règle respectée) |

**Règle prix respectée mécaniquement** : la grille a été extraite dans `src/data/plans.ts`,
désormais source unique consommée par `Pricing.astro` (affichage) **et** par le JSON-LD.
Les montants du schéma ne peuvent plus diverger de la page. Offres avec prix public :
Indé 290 €/mois, Pro 490 €/mois. « Organisation » (sur devis) ne produit **pas** d'`Offer`.

> ⚠️ Le bloc variables mentionnait « Essentiel 149 €/mois si visible » : ce plan
> **n'existe pas** sur le site. La grille réellement affichée (290/490/devis) a été
> utilisée, conformément à la règle « montants EXACTS de la page ».

## Sitemap, robots, llms.txt

- `@astrojs/sitemap` **3.2.1** (épinglé : les versions 3.7.x ciblent Astro 5 et crashent
  au build sur Astro 4 — « Cannot read 'reduce' » — c'était la cause du retrait initial
  de l'intégration). Le sitemap statique `public/sitemap.xml` est supprimé.
- `sitemap-index.xml` + `sitemap-0.xml` générés au build : `/`, `/mentions-legales/`,
  `/confidentialite/`. **404 exclue** (filter). Pages légales laissées dans le sitemap.
- `robots.txt` : `Allow: /` pour tous les agents (aucun blocage de GPTBot, OAI-SearchBot,
  ClaudeBot, PerplexityBot, Bingbot), `Sitemap:` pointé sur `sitemap-index.xml`.
- `llms.txt` : pitch + pages clés en liens absolus + contact.

## Image OG

Image de marque existante (déjà dans la DA : fond noir, radar, vert menthe, fonts du
repo) réencodée PNG 322 KB → **JPEG q90 77 KB**, 1200×630, visuellement identique.
Variante OG par page : **reportée en v2** (nécessiterait astro-og-canvas/satori, une
nouvelle dépendance — l'image de marque unique suffit pour la v1).

## Hygiène crawl (aucun changement nécessaire)

- 404 personnalisée dans la DA : déjà présente.
- Rendu : site 100 % statique ; le seul îlot client est le formulaire de contact
  (non critique pour le SEO). Tout le contenu est dans le HTML généré — vérifié.
- Liens internes : 13 liens internes uniques sur chaque page (header + footer).
- Images : aucune balise `<img>` (tout est SVG inline) ; SVG décoratifs en
  `aria-hidden`, radar signifiant avec `role="img"` + `aria-label`. `alt`/lazy : N/A.

## QA — Definition of Done

| Critère | Résultat |
|---------|----------|
| `npm run build` sans erreur ni warning nouveau | ✅ (4 pages) |
| Titles/descriptions uniques + longueurs | ✅ `docs/audit/seo-check.mjs` : tout vert |
| JSON-LD parse valide + types conformes | ✅ idem |
| `sitemap-index.xml`, `robots.txt`, `llms.txt` dans le build | ✅ |
| Lighthouse home | ✅ **SEO 100 · Perf 91** |
| Lighthouse 404 | ⚠️ SEO 66 · Perf 100 — seul audit en échec : `is-crawlable`, **conséquence directe du `noindex` volontaire** (bonne pratique pour une 404 ; en prod le statut HTTP 404 servi par Cloudflare fait échouer ce même audit de toute façon). Tous les autres audits SEO passent. |
| Zéro diff visuel | ✅ `<body>` généré comparé octet à octet entre `main` et la branche : **identique** sur les 4 pages (seul écart : l'`uid` interne non déterministe de l'îlot Astro du formulaire, sans effet). |

## Champs omis faute de donnée (jamais inventés)

- `Organization.sameAs` : aucun profil social trouvé dans le repo/config → omis.
- `Organization.telephone` : aucun numéro réel dans le repo → omis.
- `Organization.address` postale : disponible dans les mentions légales (adresse de
  l'EI) mais volontairement non publiée dans le schéma (adresse personnelle d'un EI,
  pas un établissement recevant du public) → à trancher par Vic si souhaité.

## Points laissés pour v2

1. **OG par page** (title en overlay) via satori + fonts locales.
2. **Incohérence de donnée détectée** (hors mandat — wording visible) : la section
   « Chiffres clés » affiche **« 500 000+ parcelles notées »** alors que le pitch du
   mandat donne **431 000+** comme chiffre réel. À corriger dans une passe contenu
   dédiée — je n'ai pas touché au wording visible.
3. Le bloc variables DA mentionne un **violet #B497F0** : ce token n'existe pas dans ce
   repo (DA = fond noir + vert menthe uniquement). Non introduit.
4. `docs/audit/seo-check.mjs` peut être branché en CI (exit 1 si un critère casse).

## Commits (1 par phase, phases 1–2 fusionnées car mêmes fichiers)

- `feat(seo): head on-page + JSON-LD (phases 1-2)`
- `feat(seo): sitemap généré, robots.txt, llms.txt (phase 3)`
- `feat(seo): image OG < 300 KB (phase 4)`
- Phase 5 : aucun changement requis (déjà conforme) — pas de commit.
- `chore(seo): script QA + rapport (phase 6)`

## Actions manuelles restantes (Vic, après merge + déploiement)

GSC (propriété Domain labuse.immo, TXT DNS), Bing Webmaster (import GSC), Cloudflare
AI Crawl Control (autoriser GPTBot/OAI-SearchBot/ClaudeBot/PerplexityBot), soumission
du sitemap dans GSC + Rich Results Test sur `https://labuse.immo/`.
