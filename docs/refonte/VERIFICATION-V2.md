# Maquette v2 : chiffres et formulations vérifiés

Chiffres et phrases de fraîcheur vérifiés dans le repo de l'app (`Vcitordosgor/labuse` @ `a883cab`)
par un recensement, puis par une contre-vérification adversariale (workflow du 07/10/2026).

## Chiffres retenus

| Affiché | Ce qui est compté | Source (repo app) | Réserve |
|---|---|---|---|
| + de 90 sources de données | lignes de `GET /sources` (tuile « sources ») | `sources_catalog.py:38` (WHERE_AFFICHEES), `seed_sources.py` (97 affichables) | 99 mesuré sur la base locale : n'écrire 99 qu'après l'avoir lu en prod. Jamais « sources officielles ». |
| 59 couches cartographiques | interrupteurs du panneau Couches côté client | `CouchesTuyau.tsx:52,111,729-740`, `couches_tuyau.py:803`, `declarations/couches/*.yaml` | Compté dans le code ; recompter une fois en prod. |
| 24/24 communes | communes distinctes du cadastre analysé | `registre/moteurs/commune.py:185,202` | Vrai pour le cadastre et l'analyse, pas pour chaque couche (PLU 23/24). |
| 89 informations sur la fiche | champs distincts déclarés sur la fiche parcelle | `declarations/fiche/*.yaml` | Pas toutes renseignées pour chaque parcelle : ne jamais écrire « 89 données par parcelle ». |
| 431 663 parcelles analysées | lignes du run servi `q_v16` | `config/served_manifest.json`, `docs/audit-2026-10/QV16-VERIF-1` | — |
| 16 outils fonciers | outils visibles du registre | `outils/registry.ts`, `Rail.tsx:238` | — |

Écartés : 43 « contrôles croisés », 208 ou 286 « données » (interprétations non publiables).

## Fraîcheur : ce qu'on peut dire

- OK : « Les données bougent, LABUSE suit. » ; « Permis, ventes, procédures collectives : les
  nouvelles publications officielles sont intégrées automatiquement. »
- Interdit tant que les tâches automatiques ne sont pas toutes posées et vérifiées sur le VPS :
  « chaque jour », « quotidien », « toujours à jour », « temps réel ».
- **À corriger dans l'app** : `SourcesPage.tsx:136` affiche « vérifiées automatiquement chaque jour »,
  faux en prod aujourd'hui (seul le radar du lundi tourne).

## Points ouverts pour Vic

1. Politique de confidentialité du site : déclare traiter les noms des particuliers ; l'app dit le
   contraire. À réécrire (texte proposé disponible).
2. Flash « 79 € HT » : la facture de l'app porte « TVA non applicable, art. 293 B » et Stripe
   encaisse 79 € tout compris. Afficher « HT » laisse croire qu'une TVA s'ajoute.
3. App : l'outil Successions affiche l'âge exact du dirigeant (« dirigeant 74 ans ») alors que le
   filtre promet « jamais l'âge exact ».

## Ajouts v3 (07/10/2026)

| Affiché | Valeur exacte | Source (repo app) | Réserve |
|---|---|---|---|
| 99 sources de données | 99 (tuile « sources ») | `DASHBOARD-AUDIT-1/RAPPORT.md:21` | Choix de Vic ; mesuré sur la base locale, à relire en prod. |
| 2,6 M+ données publiques intégrées | 2 678 205 enregistrements (somme des `count(*)`, dérivés et doublons de bâtiments retirés) | `docs/audit-2026-10/CHASSE-1/COUVERTURE.csv`, `ECARTS.csv:6` | Base locale du 04/10 ; recompter sur le VPS. |
| 50 805 permis et autorisations d'urbanisme | 50 805 (SITADEL) | `docs/audit-2026-10/PARITE-AUDIT-1.md:177` | Mesuré en prod le 07/10. |
| 78 308 ventes immobilières depuis 2014 | 29 566 (2021-2025) + 48 742 (2014-2020) | `PARITE-AUDIT-1.md:169`, `docs/M124_DVF_PROFONDEUR.md:12` | 2021-2025 identique prod/local. |

Onglets « Aujourd'hui » : portails publics réels, chacun intégré par LABUSE (`seed_sources.py`) :
cadastre.gouv.fr, Géoportail Urbanisme, georisques.gouv.fr, DEAL Réunion, explore.data.gouv.fr (DVF),
Sitadel · data.gouv.fr, Annuaire Entreprises, bodacc.fr, cartes.gouv.fr (remplace le Géoportail,
fermeture annoncée au 30/09/2026), annonces immobilières (générique, pas de marque privée).
