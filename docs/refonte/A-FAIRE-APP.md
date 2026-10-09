# À faire dans l'app LABUSE (pour Claude Code, dépôt `labuse`)

Relevé du 08/10/2026, fait en lecture seule sur le code de l'app et les audits
`docs/audit-2026-10/PARITE-AUDIT-1.md` et `DASHBOARD-AUDIT-1/RAPPORT.md`.
Les numéros de ligne sont ceux du clone lu ce jour : à revérifier avant de modifier.

**But** : que la promesse du site, « Chez LABUSE, vous êtes sûr d'avoir la dernière
donnée en date », soit vraie.

## Priorité 1 : la fraîcheur des données

| # | Problème | Où regarder | Ce qu'il faut faire | Comment vérifier |
|---|---|---|---|---|
| 1 | **Le rechargement des ventes (DVF) échoue chaque semaine.** Le cron du mercredi détecte bien une nouvelle livraison, mais l'INSERT écrit des colonnes qui n'existent pas (`mutation_id`, `commune`, `geom`, `raw`) : erreur, transaction annulée, et ça recommence la semaine suivante. Même réparé, il ne touche jamais `dvf_mutations`, la table lue par la fiche, les prix de secteur et la mention « ventes jusqu'à ». Les années chargées sont figées à 2021–2025. | `src/labuse/ingestion/fraicheur.py:361-386` (`refresh_dvf`, `target="dvf_mutations_parcelle"`) ; `src/labuse/ingestion/layers_ingest.py:895` (`GEO_DVF_YEARS`) et `:990-1005` (INSERT) ; `src/labuse/models.py:961-985` (vrai schéma) ; `tests/test_fraicheur.py:126-148` (ne teste que la détection) | Corriger la table et les colonnes cibles ; recharger aussi `dvf_mutations` ; calculer les années au lieu de les figer (2026 incluse) ; n'enregistrer la date de livraison qu'après un rechargement réussi ; ajouter un test du rechargement. | Sur le serveur : `labuse refresh-dvf`, puis lire `/var/log/labuse/dvf.log` ; la date de vente la plus récente de `dvf_mutations` avance ; la fiche affiche « DVF — jusqu'à » la nouvelle date. |
| 2 | **Le rechargement mensuel des adresses (BAN) du 05/10 a échoué.** Au 07/10, la date la plus récente (`max(refreshed_at)`) est toujours le 05/09. Soit le téléchargement a échoué, soit le garde-fou (refus si moins de 80 % des lignes) a bloqué. | `src/labuse/ingestion/ban_adresses.py:188-230` (garde-fou, DELETE puis INSERT) ; `src/labuse/cli.py:3558-3581` (`ingest-ban --download`) ; cron `/etc/cron.d/labuse-ban` (le 5 à 07:30) | Lire `/var/log/labuse/ban_refresh.log`, trouver la cause, corriger, relancer `labuse ingest-ban --download`. | `select max(refreshed_at) from adresses` donne la date du jour. |
| 3 | **Le zonage PLU et les risques (PPR / Géorisques) ne sont jamais mis à jour automatiquement.** Ils sont marqués `auto=False`, `check_couches_cascade()` n'est appelée nulle part, le job `sync-gpu` n'est pas planifié, et la date d'approbation du PLU vient d'un fichier tenu à la main. Ce sont pourtant les couches montrées dans la vidéo du site. | `src/labuse/ingestion/fraicheur.py` (`SOURCES` : `gpu_plu`, `georisques`) ; `check_couches_cascade` ; `src/labuse/jobs.py` (`sync-gpu`) ; `config/plu_millesimes.yaml` ; `src/labuse/api/app.py:5608` (`_plu_fraicheur`) | Planifier chaque semaine la détection **et** le rechargement du PLU (GPU) et de Géorisques ; mettre à jour la date du PLU automatiquement au lieu du fichier manuel. | Les journaux du job montrent un passage chaque semaine ; une révision de PLU publiée sur le GPU apparaît dans la fiche dans la semaine. |
| 4 | **Les tâches planifiées du serveur ne sont pas celles du code.** La prod tourne encore sur 11 anciens crons ; le crontab du registre (25 jobs) n'a jamais été posé. Attention : si on lance `deploy.sh` tel quel, il passe les permis (Sitadel) et les DPE à un rythme **mensuel**, et supprime les crons des ventes (DVF) et des adresses (BAN) sans les remplacer. | `src/labuse/jobs.py:296-335` ; `deploy.sh:74-80` ; `docs/audit-2026-10/PARITE-AUDIT-1.md` §6a et annexes A, C, D | D'abord aligner le registre sur les rythmes voulus : permis chaque jour, procédures collectives (BODACC) chaque jour, DPE chaque semaine, ventes (DVF) chaque semaine, adresses chaque mois, PLU et Géorisques chaque semaine, sonde des sources chaque jour. **Ensuite** lancer `deploy.sh`. | Le vérificateur du registre ne signale plus d'écart sur `/etc/cron.d/labuse` ; chaque job laisse une trace dans `ingestion_runs` ou dans son journal. |
| 5 | **La sonde quotidienne des sources est arrêtée** (dernier passage le 24/09), alors que la page Sources de l'app affiche « La plupart de nos sources sont vérifiées automatiquement chaque jour ». | `src/labuse/jobs.py:296-301` (`sonde-sources`) ; `frontend/src/components/sources/SourcesPage.tsx:132-137` | Réglé par le point 4. En attendant, retirer ou adoucir la phrase de la page Sources. | Le tableau de bord admin montre un passage de la sonde chaque matin. |
| 6 | **Les dates affichées (millésimes) ne sont jamais mises à jour après un rechargement.** `persist_millesime()` existe mais n'est appelée nulle part : pour DVF, DPE, BAN et BODACC, la fiche peut afficher une date ancienne même quand la donnée est neuve. | `src/labuse/ingestion/fraicheur.py:303` (`persist_millesime`), lue par `src/labuse/api/app.py:1145` et `src/labuse/api/modules.py:1756` | Appeler `persist_millesime(only=…)` à la fin de chaque ingestion (DVF, DPE, BAN, BODACC, Sitadel…). | Après un rechargement, le millésime de la source dans `data_sources` et sur la fiche change. |

## Priorité 2 : cohérence de l'app

| # | Problème | Où regarder | Ce qu'il faut faire |
|---|---|---|---|
| 7 | L'écran Veille promet des alertes « nouvelle annonce, baisse de prix **ou un retour** », mais le serveur ne produit jamais d'alerte « retour » (il produit : nouvelle annonce, baisse, retrait, mise en vente d'une parcelle suivie). | `frontend/src/components/radar/VeilleEcrans.tsx:71` et `:304` ; `src/labuse/pige/digests.py:445-505` | Coder la détection des remises en vente, ou remplacer « ou un retour » par « ou un retrait ». |
| 8 | Le catalogue des documents parle des « 17 lignes de Comparer », le tableau en compte 19. | `frontend/src/components/documents/catalogue.ts:82` et `:84` ; `frontend/src/components/compare/ComparePanel.tsx:56-125` | Écrire « 19 lignes » ou retirer le chiffre. |
| 9 | Le sous-titre du CRM dit encore « ajout depuis la fiche (+ Pipeline) », alors que le bouton s'appelle « + CRM ». | `frontend/src/components/crm/Kanban.tsx:488` | Remplacer par « (+ CRM) ». |
| 10 | À vérifier : l'outil Successions afficherait l'âge exact des dirigeants (donnée personnelle). | `frontend/src/components/outils/Successions.tsx` et l'API `getSuccessions` | Si c'est le cas, afficher une tranche (« plus de 70 ans ») plutôt que l'âge exact. |

## Priorité 1 bis : le Flash, pour brancher le bouton du site

La page existe déjà et marche sur ordinateur : `https://app.labuse.immo/flash` (adresse ou IDU, validation de la parcelle, paiement Stripe 79 €, PDF = le Dossier parcelle de l'app). Tant que les points 11 à 13 ne sont pas réglés, le bouton « Commander un Flash » du site reste sur le formulaire de contact. Ensuite, il pointera vers `https://app.labuse.immo/flash`, **sans barre finale**.

| # | Problème | Où regarder | Ce qu'il faut faire | Comment vérifier |
|---|---|---|---|---|
| 11 | **Sur téléphone et tablette, /flash affiche « LABUSE est disponible sur ordinateur »** à la place du formulaire : un visiteur mobile du site ne peut pas commander. **Décision de Vic (09/10) : le message « disponible sur ordinateur » ne doit concerner que l'application elle-même.** Le site vitrine et la page Flash doivent fonctionner sur téléphone. | `src/labuse/api/coffre_ui.py:237` (charge `/ordinateur.js`) ; `src/labuse/api/onboarding.py:112-145` | Exempter `/flash`, `/flash/retour` et la page « Lien expiré » de ce blocage (par exemple un paramètre de `coffre_ui.page`), et vérifier qu'aucune autre page publique ne le porte. Soigner l'affichage de /flash sur petit écran. | Ouvrir `/flash` en émulation iPhone : le formulaire s'affiche, rien ne déborde, on va jusqu'au bouton « Payer ». |
| 12 | **Le paiement réel n'est pas confirmé.** La checklist de bascule n'est pas cochée et le dernier webhook Stripe reçu date du 24/07 (`/healthz/crons`). | `docs/BASCULE_LIVE_CHECKLIST.md` ; `src/labuse/facturation.py:150-285` | Clé `sk_live`, Price Flash 79 € en live, webhook live, puis un achat réel remboursé. | L'URL de paiement Stripe commence par `cs_live_` (et non `cs_test_`) ; le PDF arrive après l'achat test. |
| 13 | **Aucune acceptation des CGV avant de payer le Flash.** Les CGV disent « acceptation à la création du compte » et « contrat B2B », mais le Flash se fait sans compte ; l'art. 4 bis invoque une renonciation à la rétractation jamais recueillie. | `src/labuse/facturation.py:176-185` (`creer_checkout_flash`) ; écran de validation dans `onboarding.py:819-961` ; CGV dans `onboarding.py` | Case obligatoire au-dessus de « Payer 79 € » : « J'agis pour les besoins de mon activité professionnelle et j'accepte les conditions générales de vente ». Enregistrer la version des CGV et l'heure d'acceptation dans `flash_commandes`. Retirer la renonciation de l'art. 4 bis ; dire dans les CGV que pour le Flash, l'acceptation se fait avant le paiement. | Impossible de payer sans cocher ; la commande en base porte la version et l'heure. |
| 14 | **L'e-mail « Flash prêt » n'est jamais envoyé**, alors que la page de retour dit après 2 minutes « le lien vous parviendra par e-mail ». Un acheteur qui ferme l'onglet perd son lien. | `src/labuse/brevo.py:89` (modèle `flash_pret`, aucun appelant) ; `/flash-retour.js` (`onboarding.py:158-201`) ; `_flash_fulfill` (`facturation.py:194`) | Envoyer l'e-mail à la fin de `_flash_fulfill`, avec le lien de téléchargement. Sinon, retirer la phrase. | Achat test : l'e-mail arrive avec un lien qui marche. |
| 15 | **Textes de /flash à réécrire** (texte complet proposé plus bas). Aujourd'hui la page promet « ce qu'on peut y construire » et un « potentiel constructible chiffré », ce que le site a justement retiré ; elle affiche « 79 € » sans HT, signe « Radar foncier » au lieu de LABUSE, et n'indique ni le vendeur ni les étapes de la commande. | `onboarding.py:819-961` ; `config.py:186-192` | Appliquer le texte proposé à la fin de ce document. | Relire la page /flash et la page de validation. |
| 16 | **Un seul champ de saisie, un seul bouton** (décision de Vic, 09/10) : la page demande deux fois la même chose. Le champ unique doit accepter une adresse, un IDU à 14 caractères, ou une référence « commune + section + numéro » (« Saint-Paul CW 658 »). Au passage, la recherche par adresse échoue souvent (« aucune parcelle cadastrale à ce point ») : 4 adresses sur 7 testées, et l'exemple affiché par la page elle-même (« 12 rue de la Gare, Saint-André ») échoue. | `onboarding.py:819-961` ; `src/labuse/geocode.py` | Fusionner les deux champs et reconnaître la nature de la saisie. Si le point BAN tombe hors parcelle (voirie), prendre la parcelle la plus proche dans un rayon court et la faire valider. Quand rien n'est trouvé, le dire et proposer la référence cadastrale. Changer l'exemple affiché. | Les 7 adresses du test aboutissent ; un IDU et une référence « Saint-Paul CW 658 » aboutissent dans le même champ. |
| 17 | `https://app.labuse.immo/flash/` (avec la barre finale) répond 401 « Authentification requise ». | `src/labuse/api/auth.py:44` (`_PUBLIC`) | Rediriger `/flash/` vers `/flash`. | `curl -I https://app.labuse.immo/flash/` donne 301 ou 308. |

## Texte proposé pour la page /flash

Écrit le 09/10/2026, à la demande de Vic : plus désirable, et vrai. Deux promesses de
la page actuelle sont retirées parce que LABUSE ne les tient pas — « ce qu'on peut y
construire » et « potentiel constructible chiffré » : l'app donne les règles qui
s'appliquent, pas un feu vert à construire. Le site vitrine les a retirées pour la
même raison.

**Écran de saisie**

> # Rapport Flash
> ### Tout ce qu'il faut savoir sur un terrain, dans un seul PDF.
>
> **79 €** · paiement unique *(sans « HT » : le jour où la TVA s'appliquera, le prix affiché ne bougera pas)*
>
> - **Le terrain** : surface, bâti, plan cadastral et vue aérienne. Et quand le propriétaire est une société, sa dénomination et son SIREN.
> - **Le droit du sol** : la zone du PLU, les règles qui s'y appliquent, la hauteur et l'emprise autorisées, les servitudes repérées.
> - **Les risques** : inondation, mouvement de terrain, littoral, et les plans de prévention qui couvrent la parcelle.
> - **Le marché** : les ventes faites autour, le prix au m² du secteur, les permis déposés par les voisins.
> - **Le quartier et le projet** : équipements, réseaux, fiscalité locale, et ce que les règles permettent d'envisager.
> - **Chaque information porte sa source et sa date.** Quand c'est une estimation, c'est écrit.
>
> Onze volets, du plan cadastral au potentiel du terrain.
>
> **Quelle parcelle ?**
> [Adresse du bien] — **avec complétion pendant la frappe, exactement comme la recherche de la carte** (api-adresse.data.gouv.fr) : le visiteur tape « 3 chemin de la citerne » et on lui propose cette voie dans chaque commune de l'île, sous la forme « ADRESSE · 3 Chemin de la Citerne · 97417 Saint-Denis ». Classement : la voie qui commence par ce qui est tapé d'abord, puis la plus courte. L'acheteur choisit une adresse existante : beaucoup moins d'échecs de recherche.
> — ou —
> [Référence cadastrale] — *exemple affiché : 97415000AS0772.* Accepte l'IDU à 14 caractères comme une référence « commune + section + numéro ».
>
> Dès qu'un champ est rempli, l'autre disparaît. Un seul bouton : **Voir ma parcelle →**
>
> Vous verrez la parcelle avant de payer. Rien n'est débité à cette étape.

**Écran de validation** — l'acheteur reconnaît son terrain sur une **vue aérienne**, pas sur une ligne de chiffres (décision de Vic, 09/10). Image : IGN Géoplateforme, couche `HR.ORTHOIMAGERY.ORTHOPHOTOS`, déjà utilisée par la carte. Contour : la géométrie cadastrale de la parcelle, assombrissement autour, trait vert. Maquette : https://claude.ai/artifact/SQFxbcDTWU1Jup1ULjAHMx

> # Est-ce le bon terrain ?
>
> [vue aérienne, parcelle entourée]
> **CW 0658** — Saint-Paul · 25 633 m² · *Vue aérienne IGN*
>
>
> - Livré dès le paiement. Le lien de téléchargement reste valable 30 jours.
> - Paiement unique de **79 € HT**. Pas d'abonnement, pas de compte à créer.
> - Aucune donnée de carte ne passe par LABUSE : le paiement est traité par Stripe.
>
> ☐ *J'agis pour les besoins de mon activité professionnelle et j'accepte les [conditions générales de vente].* (case obligatoire, voir le point 13)
>
> **Payer 79 € et recevoir mon rapport →**
> ← changer de parcelle
>
> Vendu par LABUSE (CLOSING CREST) · contact@labuse.immo
> Prix total, sans TVA à ajouter — TVA non applicable, article 293 B du CGI.
> Document d'aide à la décision établi à partir des données publiques. Il ne remplace ni le certificat d'urbanisme délivré par la mairie, ni le conseil d'un notaire.

**À retirer partout sur la page** : « ce qu'on peut y construire », « potentiel
constructible chiffré », « Radar foncier » (ancienne signature, remplacer par LABUSE) et
« votre contact LABUSE » (écrire contact@labuse.immo).

**À vérifier au passage** : l'app affiche 27 156 m² pour la parcelle CW 0658 de Saint-Paul,
alors que la contenance cadastrale officielle (apicarto.ign.fr) est de 25 633 m², soit 6 %
d'écart. Surface calculée depuis la géométrie plutôt que lue au cadastre ? C'est la surface
affichée à l'acheteur avant qu'il paie, et celle du dossier.

**Une phrase à ne pas écrire tant que la priorité 1 n'est pas faite** : « la donnée la
plus fraîche ». Le texte ci-dessus dit seulement que chaque information porte sa source
et sa date, ce qui est vrai aujourd'hui. Une fois les points 1 à 6 réglés, on pourra
ajouter la promesse du site : « vous travaillez sur la dernière donnée en date ».

## Priorité 3 : données personnelles (pour que la politique de confidentialité reste vraie)

La nouvelle politique de confidentialité du site couvre aussi l'app. Elle ne dit que ce qui est fait aujourd'hui ; ces points permettront d'y écrire des durées précises et de retirer des réserves.

| # | Problème | Où regarder | Ce qu'il faut faire |
|---|---|---|---|
| 18 | **Les pages légales de l'app contredisent celles du site** : « Victor L. », « établissement à Saint-Paul », kampusreunion@gmail.com, « unique cookie », « Serveur dédié », « hors taxes le cas échéant ». | `src/labuse/api/onboarding.py:586-591` (`_EDITEUR`), `:662`, `:684`, `:711-712` | Rediriger en 301 `/mentions-legales` et `/confidentialite` de l'app vers `https://labuse.immo/mentions-legales/` et `https://labuse.immo/confidentialite/`. Dans les CGV : éditeur « Victor Lagane, entrepreneur individuel », 3 chemin de la Citerne, La Montagne, 97417 Saint-Denis, SIRET 987 641 917 00016, contact@labuse.immo (art. 5 et 8) ; art. 8 renvoie vers `labuse.immo/confidentialite/`. |
| 19 | Les courriers aux propriétaires ne disent pas d'où viennent les informations. | `src/labuse/courrier_compose.py` (après `_PIED_STOP`) | Ajouter en pied : « D'où viennent ces informations et quels sont vos droits : labuse.immo/confidentialite/#courriers ». |
| 20 | La vue de la rue (Google) se charge au clic sur « Voir la rue », sans demande d'accord, alors que Google peut déposer des cookies. | `frontend/src/components/fiche/Fiche.tsx` (iframe Street View) | Petite fenêtre « Afficher la vue Google ? » avant de créer l'iframe ; `referrerPolicy="no-referrer"`. |
| 21 | **Aucune purge** pour la plupart des tables à données personnelles, et la purge du Copilote n'est pas planifiée en production. | `src/labuse/jobs.py` (`copilote-purge`) ; tables `flash_commandes` (+ PDF), `consultation_log`, `usage_compteurs`, `abuse_scores`, `export_fingerprints`, `ia_log`, `copilote_telemetrie`, `usage_events`, `retours`, `pige_clics`, `mail_queue`, `courrier_*`, captures Radar, `commune_contacts` ; journald et `/var/log/caddy` | Planifier `copilote-purge` ; ajouter une purge par table (journaux et compteurs : 12 mois au plus) ; rotation de journald et Caddy à 12 mois au plus. Me donner ensuite les durées pour les écrire dans la politique. |
| 22 | Un propriétaire qui s'oppose n'est retiré que des courriers, pas des indicateurs. | `courrier_opposition` ; indicateurs, Successions, filtres d'âge | Registre d'exclusion (IDU, SIREN, identifiant RNE) qui retire la parcelle ou la société des indicateurs, de Successions et des filtres d'âge. |
| 23 | Dirigeants : la nationalité est gardée, et la fiche RNE complète est stockée même pour une société non diffusible. | `owner_enrichment.payload` ; `pm_dirigeants.raw` | Retirer la nationalité du payload ; vider `raw` quand l'entreprise n'est pas diffusible. |
| 24 | Sauvegardes : le script garde 4 copies quotidiennes et 3 hebdomadaires, la documentation en annonce 7 et 4 ; `pull_backups.sh` peut rapatrier 14 copies sur le poste local. | `deploy/scripts/backup_postgres.sh` ; `deploy/scripts/pull_backups.sh` | Aligner le code et la documentation ; copies locales sur disque chiffré, même durée, ou arrêter le rapatriement. |
| 25 | Les polices de l'app sont chargées depuis Google Fonts (adresse IP envoyée à Google). | front de l'app et pages serveur (`coffre_ui.py`) | Héberger les polices sur le serveur (@fontsource, comme le site). La mention Google Fonts pourra alors sortir de la politique. |

## Message à coller dans Claude Code (dépôt de l'app)

> Lis `A-FAIRE-APP.md` (je te le colle ci-dessous). Commence par la priorité 1, point par point, dans l'ordre 1 → 6, puis la priorité 1 bis (11 → 17).
> Pour chaque point : vérifie d'abord le constat dans le code (les numéros de ligne peuvent avoir bougé), propose le correctif, écris un test quand c'est possible, et dis-moi ce qu'il faut lancer sur le serveur pour le vérifier.
> Ne lance pas `deploy.sh` avant que le point 4 soit réglé et que je t'aie dit go.
