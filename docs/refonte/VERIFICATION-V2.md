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
