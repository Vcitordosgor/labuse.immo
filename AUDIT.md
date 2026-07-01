# AUDIT COMPLET — labuse.immo

> Audit en lecture seule du one-pager LA BUSE (Astro 4 hybrid + Cloudflare + Tailwind + îlot Preact).
> Méthode : exploration exhaustive du repo, build réel, crawl du HTML généré (liens, ancres, poids),
> calculs de contraste WCAG, relecture de chaque composant. Aucune modification effectuée.
> Date : 2026-07-01 · Commit audité : `dbb7b40`

---

## Résumé exécutif

Le site est solide pour un premier jet : DA cohérente et différenciante, 0 image raster, JS minimal,
bases a11y/SEO posées. Mais **deux CTA de conversion mènent nulle part** (« Réserver un créneau » et
la nav « Tarifs » trompeuse), **les pages légales n'existent pas** (obligation LCEN), **le partage
social est cassé** (OG en SVG), et **177 KB de fonts se chargent sans preload** — le tout corrigeable
en une petite journée. Le fond du problème structurel : les textes/chiffres sont éparpillés dans
14 composants avec 7 gris hardcodés hors tokens, ce qui rendra chaque itération marketing fragile.

| Axe | Note | Verdict en une ligne |
|---|---|---|
| A. UX / Conversion | **6,5/10** | Value prop claire en 5 s, mais 2 parcours d'action cassés et objections B2B non traitées |
| B. UI / Design | **7/10** | Système .card/.eyebrow propre, mais tokens contournés par ~26 hex hardcodés |
| C. Responsive | **7,5/10** | Mobile-first vérifié, quelques cibles tactiles <44 px et un clipping 640–700 px |
| D. Performance | **7/10** | Page légère (~227 KB transférés) mais fonts non preload = LCP/CLS évitables |
| E. Accessibilité | **7/10** | Bonnes fondations (skip-link, reduced-motion, focus) ; 2 contrastes AA en échec |
| F. SEO technique | **6,5/10** | Base propre (canonical/JSON-LD/sitemap) ; og:image inutilisable, plafond one-pager |
| G. Qualité | **7,5/10** | FR sans faute détectée, TODO tracés ; 1 chiffre non sourcé, code mort, 12 vulns npm |

**Global : ~7/10** — bon socle, 5 corrections à fort levier avant toute mise en ligne.

---

## Poids mesurés (build réel)

| Asset | Brut | Gzip |
|---|---|---|
| `index.html` | 75,3 KB | 16,3 KB |
| CSS (1 fichier) | 53,5 KB | 21,8 KB |
| JS îlot Preact (5 fichiers) | 27,3 KB | ~11,9 KB |
| Fonts effectivement téléchargées (FR) : inter-latin 48,3 + **inter-latin-ext 85,1** + jetbrains-600 21,9 + jetbrains-700 21,9 | **177,2 KB** | (woff2 déjà compressé) |
| **Total première visite** | | **≈ 227 KB** |

0 `<img>` — tout est SVG inline (excellent). `font-display: swap` partout (19 règles). **Aucun preload.**
`dist/_astro` total : 490 KB (subsets cyrillic/greek/vietnamese émis mais non téléchargés grâce à `unicode-range` ; 10 fichiers `.woff` legacy inutiles pour les navigateurs modernes).

### Crawl des liens du HTML généré

- Ancres fonctionnelles : `#top`, `#contenu`, `#produit`, `#reunion`, `#donnees`, `#contact` ✓
- **4 liens morts `href="#"`** : « Réserver un créneau » + Mentions légales + Politique de confidentialité + CGU
- **1 ancre sémantiquement fausse** : « Voir comment ça marche » → `#produit` (section *Features*), alors que la section « Comment ça marche » (`HowItWorks.astro`) **n'a pas d'id**
- **1 entrée nav trompeuse** : « Tarifs » → `#contact` (formulaire), la mention « TARIFS SUR DEMANDE » étant dans `FinalCTA.astro` (section **sans id**)
- Aucun 404 interne (one-pager), aucun lien externe

---

## P0 — Bugs / bloquants

### P0-1 · Le CTA « Réserver un créneau » ne fait rien
- **Où** : `src/components/FinalCTA.astro:48` (lien vers `CALENDLY_URL`), `src/consts.ts:23` (`= '#'`)
- **Description** : bouton de conversion visible dans le bloc CTA final ; cliquer dessus scrolle en haut de page (comportement natif de `href="#"`). Un prospect chaud qui choisit ce chemin est perdu, et le site paraît cassé.
- **Fix** : brancher le vrai lien Calendly/Cal.com, **ou** retirer le bouton tant que le lien n'existe pas (le `mailto`/formulaire suffit).
- **Effort : S**

### P0-2 · Pages légales inexistantes (obligation légale)
- **Où** : `src/components/Footer.astro:9-11` (3 × `href: '#'`)
- **Description** : Mentions légales, Politique de confidentialité et CGU pointent sur `#`. Pour un site professionnel français **avec formulaire collectant des données personnelles** (nom, tél, email → envoyées à Notion + Gmail), les mentions légales (LCEN) et l'information RGPD sont **obligatoires**, pas cosmétiques.
- **Fix** : créer 2 pages Astro statiques minimales (`/mentions-legales`, `/confidentialite` — la CGU peut attendre), y décrire le traitement du formulaire (destinataires : Email Routing + Notion), et brancher les liens.
- **Effort : M**

---

## P1 — Fort impact

### P1-1 · Nav « Tarifs » atterrit sur un formulaire sans aucune info tarif
- **Où** : `src/consts.ts:33` (`{ href: '#contact', label: 'Tarifs' }`) ; `src/components/FinalCTA.astro:6` (section sans id, contenant pourtant la pill « TARIFS SUR DEMANDE »)
- **Description** : un visiteur qui clique « Tarifs » cherche un prix. Il atterrit sur « Parlons de votre commune cible » — aucune mention tarifaire à l'écran. Rupture attente/atterrissage = perte de confiance au moment le plus sensible du parcours B2B.
- **Fix** : ajouter `id="tarifs"` à la section FinalCTA et pointer la nav dessus ; idéalement ajouter une ligne de cadrage (« Licence par commune, sur devis — démo gratuite »).
- **Effort : S**

### P1-2 · « Voir comment ça marche » ne mène pas à « Comment ça marche »
- **Où** : `src/components/Hero.astro:41` (`href="#produit"`) ; `src/components/HowItWorks.astro:23` (section sans id)
- **Description** : le lien du hero promet la méthode, il livre la grille de features. Sur mobile, l'utilisateur ne voit jamais les « Trois étapes » qu'on lui a promises.
- **Fix** : `id="methode"` sur HowItWorks + `href="#methode"`.
- **Effort : S**

### P1-3 · Partage social cassé : `og:image` en SVG
- **Où** : `src/layouts/BaseLayout.astro` (const `ogImage` → `/og.svg`) ; `public/og.svg:1` (TODO déjà noté)
- **Description** : Facebook, LinkedIn et X **ne rendent pas** les images OG en SVG. Tout partage du site (LinkedIn = canal B2B principal pour des promoteurs) s'affiche sans visuel. La balise annonce en plus `og:image:width/height 1200×630` pour un fichier que les crawlers ignorent.
- **Fix** : exporter le SVG en PNG 1200×630 (`og.png`), mettre à jour `ogImage`.
- **Effort : S**

### P1-4 · L'auto-réponse promise au visiteur ne peut jamais partir
- **Où** : `src/pages/api/contact.ts:87-95` (autoReplyTask)
- **Description** : le binding Cloudflare `send_email` n'autorise l'envoi **que vers des adresses de destination vérifiées** (`labuse@gmail.com`). L'auto-réponse vers l'email arbitraire du visiteur sera rejetée à chaque fois — silencieusement (best-effort). Le prospect ne reçoit donc jamais « Votre demande a bien été reçue », alors que l'UI le laisse croire.
- **Fix court terme** : supprimer l'auto-réponse (le message de succès à l'écran suffit). **Fix propre** : passer l'auto-réponse par un fournisseur transactionnel (Resend, Postmark, MailChannels).
- **Effort : S** (suppression) / **M** (fournisseur)

### P1-5 · Deux contrastes sous le seuil WCAG AA (ratios calculés)
- **Où** : `src/components/TrustBar.astro:23` (`text-[#5f6a64]`, wordmarks 16–18 px bold) ; `src/components/TrustBar.astro:30` + `src/components/ProductPreview.astro:316` (`text-muted/70` à 12 px)
- **Description** : `#5f6a64` sur surface `#0c1512` = **3,30:1** (requis : 4,5:1 — un bold 18 px reste sous le seuil « large text » de 18,66 px). `text-muted/70` 12 px sur `#060a08` = **4,06:1** (requis : 4,5:1). Pour référence, le reste passe largement : muted plein 7,33:1 ✓, vert 11,6:1 ✓, texte bouton 11,0:1 ✓.
- **Fix** : wordmarks → `#7a857f` (≥ 4,6:1) ; disclaimers → `text-muted` sans opacité, ou passer à 13–14 px.
- **Effort : S**

### P1-6 · 177 KB de fonts sans preload — LCP/CLS évitables sur le h1
- **Où** : `src/layouts/BaseLayout.astro:3-5` (imports fontsource, aucun `<link rel="preload">` dans le head)
- **Description** : le h1 de 64 px se peint d'abord en fallback système puis « swappe » (font-display:swap) quand Inter arrive — décalage visible et LCP retardé. Aggravation : les textes contiennent « œ » (« d'œil ») → le navigateur télécharge **latin-ext (85 KB) en plus de latin (48 KB)** pour un seul glyphe.
- **Fix** : (1) preload de `inter-latin-wght-normal.woff2` et `jetbrains-mono-latin-600.woff2` ; (2) remplacer « œ » par « oe » dans les 1-2 occurrences (ou accepter les 85 KB) ; (3) optionnel : `size-adjust`/metrics override sur le fallback pour annuler le CLS.
- **Effort : S** (preload+œ) / **M** (metrics)

### P1-7 · « 500 000+ parcelles notées » : chiffre non confirmé affiché en preuve
- **Où** : `src/components/KeyFigures.astro:5-6` (TODO explicite dans le code)
- **Description** : c'est LE chiffre de crédibilité du site et il est marqué « à confirmer ». S'il est faux, c'est un risque commercial (et juridiquement, une allégation trompeuse). Incohérence d'échelle possible avec la maquette produit (« 3 214 parcelles · 214 opportunités », `ProductPreview.astro:311`) — défendable (commune vs île) mais à valider ensemble.
- **Fix** : confirmer le volume réel et figer la formulation (« parcelles notées » vs « parcelles du cadastre couvertes »).
- **Effort : S** (une fois le chiffre fourni)

### P1-8 · Aucun header de sécurité (`_headers` absent)
- **Où** : `public/_headers` — fichier inexistant
- **Description** : pas de CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, ni cache immutable sur `/_astro/*` (assets pourtant hashés). Le site accepte d'être iframé et les assets se revalident inutilement.
- **Fix** : ajouter `public/_headers` avec CSP stricte (le site n'a aucun script tiers — cas idéal), `X-Frame-Options: DENY`, `Cache-Control: public, max-age=31536000, immutable` sur `/_astro/*`.
- **Effort : S**

---

## P2 — Polish

| # | Problème | Où | Fix proposé | Effort |
|---|---|---|---|---|
| P2-1 | Îlot Preact hydraté `client:load` alors que le formulaire est en fin de page → 27 KB JS + hydratation payés au chargement initial | `src/components/Contact.astro:39` | `client:visible` (bonus : rend le time-trap plus fiable, le chrono démarre à l'affichage réel) | S |
| P2-2 | Time-trap silencieux : soumission < 1,5 s après montage ignorée **sans aucun feedback** — un humain rapide (autofill) croit le bouton cassé | `src/components/ContactForm.tsx:24` | au lieu de `return`, différer la soumission de `1500 - écoulé` ms | S |
| P2-3 | Erreurs serveur brutes montrées à l'utilisateur : « L'envoi a échoué [binding_missing] » | `src/components/ContactForm.tsx:59` | mapper vers des messages FR humains + fallback `mailto:` en cas d'échec | S |
| P2-4 | Champs sans `autocomplete` (`name`, `email`, `tel`, `organization`) → friction mobile inutile sur LE formulaire de conversion | `src/components/ContactForm.tsx` (4 inputs) | ajouter les attributs standard | S |
| P2-5 | Erreurs de validation non reliées aux champs (`role=alert` + `aria-invalid` ✓ mais pas d'`aria-describedby`) | `src/components/ContactForm.tsx` (blocs erreurs) | `id` sur chaque `<span>` d'erreur + `aria-describedby` sur l'input | S |
| P2-6 | `<dd>` avant `<dt>` — HTML non conforme (l'ordre spec est dt→dd) | `src/components/Hero.astro:54-63`, `src/components/KeyFigures.astro:26-29` | inverser (garder l'ordre visuel via CSS si besoin) ou remplacer par des `<p>` | S |
| P2-7 | Menu mobile : ni fermeture sur `Échap`, ni clic-extérieur, ni retour de focus au bouton | `src/components/Header.astro` (script inline, aucune gestion `keydown`) | listener `Escape` + fermeture au clic hors panneau | S |
| P2-8 | ~26 gris hardcodés hors tokens : `#aab5b0`×9, `#c3ceca`×4, `#b6c2bc`×3, `#a7b2ac`×3, `#8b978f`×3, `#d3ded8`×2, `#93a09a`×2 — 7 nuances de gris pour 2 tokens déclarés (`ink`, `muted`) | tous les composants ; `ContactForm.tsx:4-7` redéclare même sa palette en constantes | consolider sur 3 tokens (`ink`, `body`, `muted`) dans `tailwind.config.js` | M |
| P2-9 | Double source de vérité des tokens (tailwind.config.js **et** `:root` de global.css, synchro manuelle documentée dans le README) | `tailwind.config.js:14-24` + `src/styles/global.css:9-19` | vars CSS uniques consommées par Tailwind (`colors: { green: 'rgb(var(--green))' }`) | M |
| P2-10 | `background-attachment: fixed` sur body — jank de scroll connu sur mobile (iOS le désactive, Android repaint) | `src/styles/global.css:39` | glow en pseudo-élément `position: fixed` | S |
| P2-11 | `will-change: opacity, transform` laissé en permanence sur ~25 éléments `.reveal` → couches GPU retenues après l'animation | `src/styles/global.css:108` | retirer `will-change` via la classe `.is-visible`, ou le supprimer (transitions courtes) | S |
| P2-12 | Animations radar (sweep 6 s + ~20 blink/pulse) tournent même hors viewport — CPU/batterie | `src/styles/global.css` (keyframes) + `Radar.astro` | IntersectionObserver → `animation-play-state: paused` hors écran | M |
| P2-13 | Carte de détection : `left: -20px` sur un radar centré → entre ~640 et 700 px de viewport, la carte peut être rognée de ~10 px au bord gauche (masqué par l'overflow-hidden du hero) | `src/styles/global.css:236-239` | `left: 0` sous 1024 px, ou `max(-20px, calc(...))` | S |
| P2-14 | Cibles tactiles < 44 px : liens légaux footer (13 px), pills data (~38 px), liens nav footer | `Footer.astro:69-75`, `DataLayers.astro` (pills) | padding vertical ≥ 10 px sur les liens footer ; pills OK si non interactives (le hover suggère le contraire → retirer le hover ou les rendre cliquables) | S |
| P2-15 | Pas de page 404 personnalisée (hybrid Cloudflare → 404 par défaut hors DA) | `src/pages/404.astro` absent | page 404 avec radar + lien retour | S |
| P2-16 | Ni `apple-touch-icon` ni `favicon.ico` de fallback (iOS affichera une capture grise) | `public/` | exporter un PNG 180×180 + un .ico | S |
| P2-17 | `<meta name="keywords">` obsolète (ignorée par Google depuis 2009) | `src/layouts/BaseLayout.astro:69` | supprimer | S |
| P2-18 | JSON-LD Organization maigre : pas de `sameAs` (LinkedIn), `address`, `telephone` ; pas de `WebSite`/`Service` ; un `FAQPage` serait pertinent pour le SEO local | `src/layouts/BaseLayout.astro:92` (const jsonLd) | enrichir quand les infos existent | M |
| P2-19 | Code mort : `DEMO_MAILTO` (consts.ts:9, plus référencé) et icône `route` (Features.astro:32, plus utilisée depuis le passage à `contact`) | `src/consts.ts:9`, `src/components/Features.astro:32` | supprimer | S |
| P2-20 | 12 vulnérabilités npm (7 modérées, 5 hautes) signalées à l'install — transitives (chaîne Astro 4/wrangler) | `package-lock.json` | `npm audit` ciblé ; envisager Astro 5 (voir « différemment ») | M |
| P2-21 | Identifiants internes en clair dans le repo : `DEALS_DB_ID` Notion (`src/lib/notionLead.ts:5`), `labuse@gmail.com` (`wrangler.jsonc:10`, `api/contact.ts:9`). Pas des secrets (le token, lui, est bien en env ✓) mais de la surface d'info si le repo devient public | `notionLead.ts:5`, `wrangler.jsonc:10` | déplacer en variables d'env Cloudflare par cohérence | S |
| P2-22 | Footer : titres de colonnes en `<h2>` de 12 px (« Le site », « Contact ») — pollue le plan de page des lecteurs d'écran au même niveau que les vraies sections | `src/components/Footer.astro:32,48` | `<p>` ou `<h2 class="sr-only">` + liste | S |
| P2-23 | Fausses données de la carte de détection du hero lues par les lecteurs d'écran (la carte n'est pas `aria-hidden`, contrairement à la maquette ProductPreview qui applique le bon pattern `figure role="img"` + intérieur masqué) | `src/components/Hero.astro:96-124` | `aria-hidden="true"` sur la carte + compléter l'`aria-label` du radar | S |
| P2-24 | `sitemap.xml` sans `lastmod` ; en revanche robots.txt ✓, canonical ✓ | `public/sitemap.xml` | ajouter `lastmod` à chaque déploiement (ou générer au build) | S |

---

## TOP 5 QUICK WINS (≤ 30 min chacun, impact fort)

1. **Réparer les 2 parcours cassés** — `id="tarifs"` sur FinalCTA + nav « Tarifs » dessus ; `id="methode"` sur HowItWorks + lien hero dessus ; masquer « Réserver un créneau » tant que Calendly n'existe pas. *(15 min — corrige P0-1, P1-1, P1-2)*
2. **Exporter `og.png` 1200×630** depuis le SVG existant et remplacer la référence. *(20 min — répare tout le partage social, P1-3)*
3. **Preload des 2 fonts critiques** (`inter-latin`, `jetbrains-600`) + remplacer « œ » par « oe » (2 occurrences) → −85 KB et h1 stable. *(15 min — P1-6)*
4. **Contrastes** : `#5f6a64` → `#7a857f` (TrustBar) et `text-muted/70` → `text-muted` (2 disclaimers). *(10 min — P1-5)*
5. **`client:visible` sur ContactForm** + attributs `autocomplete` sur les 4 champs. *(10 min — P2-1, P2-4)*

---

## Ce que j'aurais fait différemment (si on repartait de zéro)

1. **Un fichier de contenu unique** (`src/content/site.ts`) : tous les textes, chiffres et libellés du
   site dans une structure typée, les composants ne faisant que le rendu. Aujourd'hui la copie est
   éparpillée dans 14 composants : chaque itération marketing (fréquentes en early-stage) touche du
   markup, et rien n'empêche « 24 communes » ici et « 23 » là. C'est le choix qui aurait le plus changé
   la maintenabilité.
2. **Une seule source de tokens** : variables CSS dans `:root`, consommées par Tailwind via
   `rgb(var(--*))` — et une **échelle typographique fermée** (6-7 tailles nommées) au lieu de ~20
   `text-[Npx]` arbitraires. Le design resterait identique, la dérive (7 gris pour 2 tokens) serait
   impossible.
3. **Formulaire en progressive enhancement** : un `<form method="POST" action="/api/contact">` natif
   qui fonctionne sans JavaScript, l'îlot Preact n'apportant que la validation instantanée et l'état
   de succès inline. Aujourd'hui, sans JS, le formulaire est inerte — sur LE point de conversion.
4. **Pages légales et page 404 dès le jour 1** — ce sont des exigences (légales et UX), pas du polish
   de fin de projet.
5. **Pipeline OG au build** (satori + resvg) : l'image de partage générée en PNG à chaque build à
   partir des mêmes tokens, jamais un placeholder SVG.
6. **Astro 5 plutôt que 4** : la v4 utilisée est en fin de vie (d'où une partie des 12 vulnérabilités
   transitives) ; la v5 a un adapter Cloudflare plus simple et supprime le mode `hybrid` (statique +
   îlots serveur par défaut).
7. **Mesure dès le lancement** : Cloudflare Web Analytics ou Plausible (RGPD-friendly, sans bannière
   cookie) + événements sur les CTA. Sans données, impossible d'arbitrer les itérations CRO — on
   pilote à l'aveugle, ce qui est ironique pour ce produit.
8. **Un light multi-pages plutôt qu'un one-pager strict** pour le SEO local : `/methode`, `/donnees`,
   `/tarifs` en pages indexables (mêmes sections, URL dédiées) + FAQ avec schema `FAQPage`. Un
   one-pager plafonne vite sur « intelligence foncière La Réunion », « foncier constructible
   Saint-Denis », etc. — des requêtes où la concurrence locale est faible et prenable.
9. **Un test sur l'endpoint contact** (validation + honeypot, en Vitest) : c'est le seul code du site
   qui peut casser silencieusement en production, et il n'a aucun filet.

---

*Fin de l'audit. Aucune correction appliquée — j'attends une validation explicite item par item.*
