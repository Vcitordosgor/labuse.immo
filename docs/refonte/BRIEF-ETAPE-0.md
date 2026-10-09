# Refonte labuse.immo — Brief étape 0 (inventaire)

**Date** : 2026-10-07 · **Source de vérité** : repo de l'app `Vcitordosgor/labuse` @ `a883cab`
(lu en lecture seule) · **Base marketing** : `main` @ `d7ded6f`
**Statut** : lecture seule terminée — aucune ligne de code du site modifiée.

Chaque fait ci-dessous est cité avec son fichier dans le repo de l'app. Rien n'est arrondi
vers le haut (règle `docs/ARGUMENTAIRE_PRECISION.md` de l'app).

---

## 1. En bref

1. Le site actuel décrit un produit qui **n'existe plus** : score /100, « go/no-go », 22 couches,
   500 000+ parcelles, contact du propriétaire. L'app d'aujourd'hui, c'est **une analyse en
   bandes**, **sourcée ligne à ligne**, un **Copilote**, **16 outils**, des **documents**, un **Radar**.
2. Deux promesses du site actuel sont **juridiquement risquées dès maintenant** (voir §4.1).
3. La DA de l'app est **plus sobre** que celle du site : vert `#4ADE80`, arrondis 4–6 px,
   « ni halo, ni lueur », violet réservé à l'IA, Space Grotesk en titres.
4. Offres réelles : **Flash 79 €** (rapport PDF d'une parcelle, achat en ligne) et
   **Intégral** (abonnement mensuel **sans engagement**, accès sur invitation).
5. L'app est **réservée à l'ordinateur** (≥ 1024 px). Le site devra le dire. C'est aussi un
   argument fort pour la vidéo : c'est la seule façon de « voir » l'app depuis un téléphone.

---

## 2. Faits vérifiés, publiables

| Fait | Valeur exacte | Source (repo app) |
|---|---|---|
| Parcelles analysées | **431 663** | `docs/audit-2026-10/QV16-VERIF-1/QV16-VERIF-1.md` (06/10), `docs/SOURCES_ETAT.md` |
| Communes couvertes | **24 / 24** | `docs/SOURCES_ETAT.md`, `docs/audit-2026-10/SCORING-9.md` |
| Run servi en prod | `q_v16`, promu le **05/10/2026** | `config/served_manifest.json` |
| Outils | **16 outils fonciers** | `frontend/src/components/outils/registry.ts` (libellé UI : « 16 outils fonciers, du repérage à l'action ») |
| Accroche de l'app | « **Tout le foncier de La Réunion. Au même endroit.** » | `frontend/src/components/panel/LeftPanel.tsx:326` |
| Fil rouge démo | « **LABUSE trouve, explique, et ne promet jamais.** » | `docs/DEMO.md` |
| Positionnement | « LA BUSE ne vend pas une carte. LA BUSE vend une lecture foncière complète : tout ce qui est public, au même endroit, puis interprété. » | `README.md` |
| Provenance | Chaque ligne étiquetée **Sourcé / Estimé / Absent** | `frontend/src/lib/strings.ts`, `index.css:604-611` |

**À ne PAS publier** (ou seulement après validation) :

- **Nombre de sources** : les chiffres se contredisent (54, 62, 64, 78/94, 94, 99, 100/123…).
  Le plus récent est 99 sources affichées (`docs/audit-2026-10/DASHBOARD-AUDIT-1/INVENTAIRE.csv`).
  → Recommandation : **citer les sources par leur nom**, sans compteur. Ou reprendre le chiffre
  affiché sur la page Sources de l'app en prod, si tu le confirmes.
- **« 99,99 % d'adresses »** : c'est un taux de rattachement d'**adresses** à une parcelle
  (339 941 adresses), pas une couverture des parcelles (227 545 / 431 663 ont une adresse). Trompeur hors contexte.
- **Nombre d'« opportunités »** : aucun chiffre actuel (le seul, 9 103, date du 28/06 et le
  concept a été renommé « Probabilité de vente sous 1 an »).
- **Fréquence de mise à jour** : ne promettre ni « quotidien » ni « temps réel ». Les crons en
  prod ne sont pas prouvés dans le repo ; le recalcul du score est une promotion manuelle.
- **150 260 parcelles écartées** (`SCORING-9.md`) : chiffre vrai et parlant pour la
  traçabilité, mais à valider avant usage (ne pas confondre avec la bande « Non retenue » = 228 084).

---

## 3. Le produit d'aujourd'hui (vocabulaire de l'app)

Barre latérale de l'app : **Carte · Outils · Docs · Copilote · Radar · Projets · CRM · Sources**.

| Module (libellé UI) | En une phrase | Statut |
|---|---|---|
| **Analyse LABUSE** | L'île se colore ; chaque parcelle reçoit une bande : *Excellente · Bonne · À étudier · Faible · Non retenue · Analyse incomplète* | livré |
| **Signal de mutation** | Fort / Moyen / Faible — « un indice, pas une promesse » ; chances de vente sous 12 mois (« 1/5 sous 1 an ») | livré |
| **Fiche parcelle** | 4 groupes : Le bien · Le droit du sol · Le marché · Le projet. Onglet **« Pourquoi pas ? »** : motifs rédhibitoires et de vigilance, chacun sourcé | livré |
| **Copilote** (IA) | « Posez votre question. Réponse courte, sourcée, datée — La Réunion uniquement. » Verrou anti-invention : tout chiffre doit venir d'un outil | livré |
| **Outils** (16) | PLU · Permis · Communes · Scan patrimoine · Assemblage · Comparer · Pièges et risques · Étude de zone · Remonter le temps · Faisabilité · Gabarit réglementaire 3D · Taxe d'aménagement · Prospection solaire · Blocs fonciers · Successions à venir · Courrier propriétaire | livré (Courrier : envoi postal **pas encore** automatique) |
| **Docs** | Dossier · Bilan (PDF + Excel) · Apporteur · Pré-dossier PC · Gabarit · Comparatif · Étude de zone | livré (Comparables DVF : « bientôt ») |
| **Radar + Veille** | Biens en vente sur les portails, marché par commune ; veille foncier/annonces, mail du matin ou du lundi | livré |
| **Projets + CRM** | Projets à partir du vivier LABUSE, tri par cartes ; pipeline kanban | livré |
| **Sources** | Fraîcheur de chaque source | livré |
| **Flash** | Rapport PDF sur **une** parcelle, par adresse ou IDU, sans compte | livré (paiement réel : voir §5) |

Notions **disparues** de l'app, à retirer du site : score /100, « opportunité », « complétude »
(réservée à l'admin), « go / no-go » (0 occurrence dans l'interface), « Priorité » (palier non servi).

**Cibles avérées** : promoteurs, marchands de biens, bailleurs, apporteurs d'affaires ;
commerçants et porteurs de projet (via Flash / Étude de zone) ; installateurs solaires
(Prospection solaire). **Non avérés** dans l'app : CMI, géomètres, collectivités.

---

## 4. Écart avec le site actuel

### 4.1 Urgent — promesses risquées en ligne aujourd'hui

| Où | Ce que dit le site | Ce que dit l'app | Risque |
|---|---|---|---|
| Hero | « …remontent d'elles-mêmes — **avec le contact de leur propriétaire** » | « Personnes morales et publiques uniquement ; **jamais** de personne physique nominative » (README) ; courriers « À l'occupant » | RGPD + promesse non tenue |
| Hero / Features | « parcelles **réellement constructibles** » | « ne garantit **jamais** la constructibilité » ; « ne remplace pas un certificat d'urbanisme » (CGU) | Promesse contractuelle |
| Maquette produit | « 87/100 », « ≈ 14 logts », bouton « Contacter le propriétaire » | Aucun score brut côté client ; pas d'identité des particuliers | Image fausse du produit |
| Confidentialité | Déclare traiter « nom et prénom pour les **personnes physiques** » | L'app dit ne jamais le faire | Politique qui sur-déclare (**zone interdite pour moi** — à faire valider) |

→ Je peux corriger les 3 premières lignes **tout de suite** sur le site en ligne (petit
correctif de texte), sans attendre la refonte. À toi de dire.

### 4.2 Chiffres et contenus obsolètes

- « **500 000+** parcelles » → faux (431 663).
- « **22 couches** croisées » → obsolète (sources nommées, voir §2).
- « 1 clic pour la faisabilité », « 100 % du foncier passé au crible » → vagues, à remplacer.
- Tarifs **290 / 490 €** → obsolètes (Intégral 349 €/mois) et, selon ta décision, **plus affichés**.
- Trust bar aux **logos fictifs** (« Déjà adopté par… ») → à retirer.
- Audiences : retirer CMI / géomètres, ajouter porteurs de projet (Flash).
- Aucun lien **« Se connecter »** vers l'app (`https://app.labuse.immo/login`).
- Aucune mention **« disponible sur ordinateur »**.

### 4.3 DA

| | Site actuel | App (source : `frontend/tailwind.config.js`, `index.css`, charte `docs/audit-2026-09/DA-AUDIT-1/CHARTE-DA-1.md`) |
|---|---|---|
| Vert de marque | `#2fe0a0` | **`#4ADE80`** (`config/brand_colors.json`) — l'ancien est banni du code |
| Fonds | `#060a08` / `#0c1512` | `#0A0C0B` (page) · `#0C0F0D` (panneau) · `#111614` (carte) · `#161C19` (flottant) |
| Texte | `#f3f6f4` / `#93a09a` | 8 niveaux : `#E8EFEA` (titre) · `#B8C4BC` (valeur) · `#8A968F` (libellé) · `#7C8A82` (micro-label)… |
| Violet | — | **`#B497F0` réservé à l'IA** (Copilote). « Le mauve n'est jamais la marque. » |
| Couleurs de statut | — | ambre `#E0A94F` (vigilance), corail `#E2726A` (blocage) ; bandes A `#5CE6A1` · B `#46A0E0` · C `#E8B23A` · D `#C4653C` |
| Arrondis | 16–32 px | **4 px / 6 px / pilule**, rien d'autre |
| Profondeur | glows verts, dégradés | **« Ni halo, ni lueur »** ; ombre réservée aux éléments flottants |
| Typo | Inter + JetBrains Mono | **Space Grotesk** (titres) + Inter (corps) + JetBrains Mono (références, labels) |
| Libellés | mono capitales | `.label-caps` 11 px, capitales, tracking .12em |
| Mouvement | reveal au scroll, radar animé | survol 100 ms, apparition 150 ms, **aucune animation au défilement** |
| Signature visuelle | radar qui balaie | **la carte sombre de l'île** avec les pastilles de communes |
| Logo | « LA BUSE » espacé | En-tête app : « **LA** » blanc + « **BUSE** » menthe, collés, Space Grotesk ; PDF/e-mails : « LA BUSE » espacé |

Adaptation au marketing : un site vitrine respire davantage qu'un outil dense (tailles de titres
plus grandes, sections aérées), mais il reprend **à l'identique** les couleurs, les rayons,
la typo et les règles (pas de glow, menthe = action principale, violet = IA seulement).
Les polices restent **auto-hébergées** (l'app charge Google Fonts ; le site ne doit pas — RGPD).

---

## 5. Offres — recommandation

| | Flash | Intégral (« abonnement pro ») |
|---|---|---|
| Ce que c'est | 1 rapport PDF sur 1 parcelle, par adresse ou IDU, lien valable 30 jours, **sans compte** | Accès complet à l'app, 1 licence = 1 accès nominatif, **mensuel sans engagement** |
| Prix affiché | **79 €** | **Non affiché** (ta décision) |
| Bouton | « Commander un Flash » → `https://app.labuse.immo/flash` | **« Demander une démo »** |
| Mention | « Paiement unique, sans abonnement » | « Abonnement mensuel, sans engagement » |

**Pourquoi « Demander une démo » plutôt que « Nous contacter » ou « Prendre contact avec un
conseiller » :**

- C'est **le vrai parcours** : le compte s'ouvre sur invitation, et l'app dit elle-même
  « la démo accompagnée reste le vrai onboarding » (`/guide`). Le bouton annonce ce qui va se passer.
- « Conseiller » évoque une banque ou une assurance, et laisse imaginer une équipe commerciale.
- « Nous contacter » est le libellé le plus faible : il ne dit pas ce qu'on obtient.
- En sous-texte, on garde l'argument fort sans le prix : **« sans engagement »**.

**Nom de l'offre** : je recommande **« Intégral »**, comme dans l'app, les CGV et les factures,
plutôt que « Pro » — le client retrouvera le même mot partout.

**À vérifier avant de mettre le bouton Flash en ligne** :
- le paiement Stripe est-il passé **en réel** ? Les 17 cases de `docs/BASCULE_LIVE_CHECKLIST.md`
  sont toutes décochées ; sinon le bouton mène à un paiement de test ;
- **TVA** : `config.py` dit « TTC », les CGV disent « hors taxes le cas échéant », la facture dit
  « TVA non applicable, art. 293 B du CGI ». À trancher pour la mention sous le prix.

---

## 6. La vidéo — mon avis

**Oui, bonne idée**, et même la meilleure façon de montrer un outil dense, réservé à
l'ordinateur, à quelqu'un qui découvre le site sur son téléphone. Conditions pour qu'elle serve :

- **Format** : boucle muette, lecture automatique, **12–15 s** plutôt que 10 (10 s = 3 plans
  maximum, trop court pour comprendre). 4 plans d'environ 3 s, sous-titrés par 3–4 mots incrustés :
  1. l'île qui se colore (« Afficher l'analyse LABUSE ») — *431 663 parcelles analysées* ;
  2. une fiche parcelle : bande « Excellente » + « Pourquoi pas ? » — *chaque motif sourcé* ;
  3. le Copilote : une question, une réponse sourcée (le seul plan violet) — *posez votre question* ;
  4. un document PDF qui sort (Dossier ou Flash) — *prêt à envoyer*.
- **Matière** : de préférence **des captures PNG haute résolution** (Retina) de ces 4 moments,
  ou un **enregistrement d'écran** de l'app. Les captures HTML sont parfaites pour les panneaux
  (fiche, Copilote), mais **la carte ne s'affichera pas hors ligne** (tuiles servies par le serveur).
  À partir de captures, je monte des zooms et fondus nets en MP4 + WebM.
- **Contenu affiché** : une parcelle de démo que tu acceptes de montrer (IDU et adresse visibles),
  aucun nom de client. L'app n'affiche déjà aucun particulier, donc pas de floutage RGPD à prévoir
  a priori — je vérifierai image par image.
- **Poids et accessibilité** : < 1,5 Mo, image d'attente (poster), chargement différé,
  `prefers-reduced-motion` → image fixe ; pas de son.
- **Attention** : certaines captures du repo ne montrent pas ce que dit leur nom
  (`14-geste-03-gabarit.png` montre l'accueil) — mieux vaut des captures fraîches de ta part.

---

## 7. Architecture proposée (une seule page)

1. **En-tête** : logo · ancres · « Se connecter » (app) · « Demander une démo ».
2. **Hero** : « Tout le foncier de La Réunion. Au même endroit. » · *431 663 parcelles
   analysées sur les 24 communes, chaque réponse sourcée* · Démo + « Flash 79 € » · **vidéo**.
3. **Le constat** (réécrit, sans promesse de constructibilité).
4. **L'analyse** : bandes, Signal de mutation, « Pourquoi pas ? » — *LABUSE trouve, explique, et ne promet jamais*.
5. **Le Copilote** (seule section violette).
6. **16 outils + documents** (grille sobre).
7. **Radar & veille**.
8. **Sources & traçabilité** : Sourcé / Estimé / Absent, sources nommées.
9. **Pour qui**.
10. **Offres** : Flash 79 € · Intégral (démo).
11. **Questions fréquentes** (courte, utile au SEO) : « Puis-je l'utiliser sur mobile ? »,
    « Est-ce une garantie de constructibilité ? », « Voyez-vous les particuliers ? »…
12. **Contact** (formulaire existant, Worker inchangé) · **Pied de page** + mention
    « pré-analyse, ne remplace pas un certificat d'urbanisme ».

Conservé tel quel : Astro statique, Cloudflare Pages, Worker du formulaire, pages légales
(sauf validation de ta part), socle SEO de `feat/seo-fondations`.

---

## 8. Questions pour Vic

1. **Correctif urgent** (§4.1) : je corrige les 3 promesses risquées sur le site en ligne dès maintenant ?
2. **Offres** : OK pour « Intégral » + « Demander une démo » ?
3. **Flash** : paiement Stripe en réel ou pas encore ? Et quelle mention de TVA ?
4. **Graphie** : « LABUSE » (en-tête de l'app) ou « LA BUSE » (site, PDF) ?
5. **Pages légales** : la politique de confidentialité déclare traiter les noms des
   particuliers (l'app dit le contraire) ; l'adresse de l'éditeur diffère (site : Saint-Denis,
   app : « Saint-Paul ») ; quatre adresses e-mail circulent. À valider avant que je touche à quoi que ce soit.
6. **`feat/seo-fondations`** : je la merge avant la refonte (recommandé), puis j'adapte le
   JSON-LD à la seule offre affichée (Flash 79 €) ?
7. **Vidéo** : peux-tu m'envoyer les captures Retina (ou un enregistrement d'écran) des 4 moments du §6 ?

Prochaine étape : **maquette HTML** de la page complète (étape 1), dès réponse aux questions 2 à 4.
