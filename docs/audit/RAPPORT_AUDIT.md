# Rapport d'audit visuel — labuse.immo

**Date** : 2026-07-09
**Branche** : `chore/polish-visuel-20260709` (base `main`)
**Méthode** : captures Playwright (chromium) 375 / 768 / 1440px, `prefers-reduced-motion`
pour figer l'état posé, captures par section + états interactifs, contrôle console/réseau,
contrôle de contraste WCAG calculé, revue code (head/SEO/a11y).
**Zones interdites respectées** : contenu des pages légales (mentions / confidentialité) ;
configuration de déploiement Cloudflare Pages. DA verrouillée (tokens, typo, logo, layout).

---

## Notes par page

| Page | Note | Verdict |
|------|------|---------|
| Accueil (one-pager) | **9 / 10** | Très solide. Un seul vrai défaut : le panneau du menu mobile laisse transparaître le contenu. |
| 404 | **9 / 10** | On-brand, soignée. Nit : apostrophe droite. |
| Mentions légales | — | Hors périmètre visuel (contenu juridique verrouillé). Liens vérifiés OK. |
| Confidentialité | — | Hors périmètre visuel (contenu juridique verrouillé). Liens vérifiés OK. |

---

## Ce qui est déjà au niveau (aucune action)

- **Console/réseau** : zéro erreur JS, zéro warning d'hydratation, zéro 404 de ressource
  (le seul 404 console est la page-test volontairement inexistante).
- **Responsive** : zéro scroll horizontal sur les 3 viewports × 4 pages.
- **Contraste WCAG AA** : tous les tokens de texte passent (ink 18.3:1, body 9.4:1,
  muted 7.3:1, dim 6.6:1, green 11.7:1). Seul le placeholder de formulaire est à 4.47:1
  (exempté WCAG — texte non-contenu). **Aucune correction requise.**
- **SEO / partage** : titres + descriptions uniques par page, canonical, Open Graph
  complet (image 1200×630 + alt), Twitter card, JSON-LD Organization.
- **Perf perçue** : 2 fonts critiques préchargées (`crossorigin`), `font-display:swap`,
  fonts auto-hébergées (zéro Google Fonts — RGPD).
- **A11y** : skip-link, `focus-visible` (anneau vert vérifié), `prefers-reduced-motion`
  respecté (reveal + radar figés), landmarks, `lang="fr"`.
- **Micro-détails** : favicon SVG + apple-touch-icon, theme-color, 404 sur-mesure on-brand,
  disclaimers honnêtes sur la maquette produit (« données fictives ») et la trust bar.
- **Cohérence composants** : un seul style de CTA primaire (vert, glow), cartes homogènes
  (radius, hairline, dégradé), eyebrows mono cohérents sur toutes les sections.

---

## Tableau des problèmes

| N° | Page | Problème | Preuve | Priorité | Fix prévu |
|----|------|----------|--------|----------|-----------|
| 1 | Accueil (mobile) | Menu ouvert : le panneau `bg-bg/95` (translucide) laisse **ghoster le contenu du hero** derrière les liens ; le panneau ne verrouille pas le scroll. Effet « carte flottante » qui fait amateur. | `avant/interactive/mobile-menu-open.png` | **P1** | Fond du panneau 100 % opaque + `overflow` du body verrouillé quand le menu est ouvert. |
| 2 | Accueil (mobile) | L'icône du bouton menu **reste un hamburger** quand le menu est ouvert (seul l'`aria-label` change). Pas de retour visuel d'état. | `avant/interactive/mobile-menu-open.png` | **P2** | Basculer l'icône hamburger ↔ croix selon l'état. |
| 3 | Tout le site | Pas de style `::selection` — la sélection de texte utilise le bleu système par défaut, hors DA. | Revue code `global.css` | **P2** | Ajouter un `::selection` vert discret. |
| 4 | 404 | Apostrophe droite « n'apparaît » alors que tout le reste du site utilise l'apostrophe typographique « ' ». | `avant/nope-404-1440.png` / `404.astro:21` | **P2** | Remplacer par l'apostrophe courbe. |
| 5 | Accueil — CTA finale | Veuve typographique : le mot « jeu. » se retrouve **seul sur sa dernière ligne** (desktop). | `avant/sec-1440/10-finalcta.png` | **P2** | Lier « terrain de jeu » par des espaces insécables. |

---

## Propositions DA (aucune action sans accord de Vic)

Ces points relèvent d'un choix éditorial / business ou d'un refactoring hors périmètre.
Je ne les touche pas.

1. **Trust bar « Déjà adopté par des acteurs qui construisent La Réunion »** avec 5 logos
   fictifs (TERRA, LITTORAL, HORIZON, BÂTIR, MASCARIN). C'est honnêtement disclaimé
   (« Logos illustratifs — remplacés par de vrais clients dès accord signé »), mais
   l'affirmation « Déjà adopté » revendique une preuve sociale qui n'existe pas encore.
   **Test du miroir** : un prospect averti peut le percevoir comme du faux-semblant.
   → Options : (a) retirer la bande jusqu'aux premiers vrais clients, (b) reformuler sans
   revendiquer d'adoption (« Conçu avec des acteurs du foncier réunionnais »), (c) garder tel
   quel. **Décision Vic requise.**

2. **Chiffre « 500 000+ parcelles notées »** (section Chiffres clés). À confirmer contre la
   base réelle — ne jamais arrondir vers le haut un chiffre non vérifié. → Fournir le chiffre
   exact ou valider l'ordre de grandeur.

3. **Valeurs hex « one-off »** hors tokens (dégradés de cartes `#0e1a16`/`#0a1310`, nuances
   de texte `#aab5b0`/`#c3ceca`…). Elles font partie du hero validé et sont cohérentes ;
   les tokeniser serait un refactoring (risque DA). → Laissé tel quel, signalé pour info.

---

## Plan d'exécution (Phase 3)

- **Commit 1** `fix(polish): menu mobile — fond opaque, icône croix, verrouillage scroll` (N° 1, 2)
- **Commit 2** `fix(polish): typographie — ::selection, apostrophe 404, veuve CTA finale` (N° 3, 4, 5)

Aucun P0. Aucune donnée bloquée côté LABUSE (pas de lien de paiement ni numéro à câbler —
tous les CTA pointent vers le formulaire de contact, déjà fonctionnel).
