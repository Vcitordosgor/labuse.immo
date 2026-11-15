# Film de présentation LABUSE — banc de fabrication

De quoi refabriquer le film image par image : les scènes, le moteur de rendu, le montage et la préparation des
données. Rien de lourd n'est versionné ; les données, les images et les vidéos se reconstruisent à partir de
ce dossier.

État : **pilote, quatrième version** (50 s, sans son), après trois passages de contrôle. Les plans qui montrent l'application réelle (le Dossier, les couches)
restent à tourner. Le scénario complet et la proposition faite au dirigeant ne sont pas dans ce dépôt.

## Principe

- Chaque plan est une page HTML (`scenes/`) qui expose `window.DUR` (secondes) et `window.render(t)`.
  Tout est fonction du temps, jamais de l'horloge : le rendu est reproductible, image par image.
- `lib/rendre.mjs` ouvre la scène dans Chromium et photographie chaque image (1920 × 1080, 30 i/s).
- `monter.py` enchaîne les plans et encode en H.264 (profil high, yuv420p, bt709, démarrage rapide).
- L'île est dessinée avec toutes les parcelles du cadastre ouvert (Etalab) ; la plongée utilise les photos
  aériennes de l'IGN ; les contours de l'île et des communes viennent de l'application (fichiers publics).

## Refaire le pilote

Prérequis : Node 22 avec Playwright et Chromium (chemins dans `lib/browser.mjs`), ffmpeg, Python 3.

```bash
python3 -I donnees.py --idu 97415000EY0109     # cadastre, photos aériennes, voisinage : dix minutes, 65 Mo dans data/
for p in a1-une a2-plongee a3-fiche a5-final b1-oiseau; do node lib/rendre.mjs scenes/$p.html; done   # → frames/<plan>/
node lib/rendre.mjs scenes/v1-une.html --a 0.034 --l 1080 --h 1920                                     # image verticale
node lib/habillage/filigrane.mjs                # la mention incrustée « PILOTE · NE PAS DIFFUSER »
python3 -I monter.py pilote.mp4 a1-une a2-plongee a3-fiche a5-final --filigrane lib/habillage/filigrane.png
python3 -I monter.py variante-ouverture.mp4 b1-oiseau --filigrane lib/habillage/filigrane.png
```

`lib/rendre.mjs` accepte `--de` et `--a` (secondes) pour ne rendre qu'un passage, `--garder 1` pour ne pas vider
le dossier de sortie (rendu en plusieurs passes, en parallèle), `--pas N` pour une image sur N (planches d'essai).

## Les plans

| Fichier | Durée | Contenu |
| --- | --- | --- |
| `scenes/a1-une.html` | 5,6 s | L'île allumée, « 434 582 parcelles. Vous en cherchez une. », puis un seul point |
| `scenes/a2-plongee.html` | 7,4 s | Descente en deux temps : la commune s'allume, puis le terrain |
| `scenes/a3-fiche.html` | 18,4 s | Les dix sites, le clic, la fiche (maquette, à remplacer par l'écran réel) |
| `scenes/a5-final.html` | 19,0 s | Remontée, « Un terrain, ou toute l'île. », signature et bouton |
| `scenes/b1-oiseau.html` | 8,6 s | Variante d'ouverture : l'oiseau fait le tour de l'île et l'allume |
| `scenes/v1-une.html` | image | Première image de la version verticale (1080 × 1920) |

`lib/cadre.js` porte le cadre commun : la caméra de départ, le terrain suivi, le cadre d'arrivée.
`lib/ile.js` dessine l'île (nuage de points accumulé puis converti en couleur), `lib/plongee.js` la photo
aérienne, le cadastre et la limite communale, `lib/flou.js` le flou de mouvement des zooms rapides.

## Changer de terrain

1. `python3 -I donnees.py --idu <identifiant> --etapes terrain,ortho`
2. Reporter dans `lib/cadre.js` la ligne `TERRAIN` que le script affiche, et dans `lib/plongee.js` le nom du
   fichier de voisinage.
3. Corriger à la main le fil d'Ariane (`a2`, `a3`) et les valeurs de la fiche (`a3`), relevées dans l'application
   le jour même.
4. Relancer les rendus.

## Garde-fous

- Le terrain du pilote est la maison d'un particulier : le pilote ne se diffuse pas. Le film final prendra une
  parcelle détenue par une collectivité.
- Aucun chiffre hors de ceux du site ; aucune promesse de délai, de gain ou de constructibilité.
- La mention sur le certificat d'urbanisme reste à l'écran pendant la fiche et le Dossier.
- Les identifiants du compte d'essai ne s'écrivent dans aucun fichier : variables d'environnement `LB_ID` et
  `LB_PW` (voir `../video/login.mjs`).

## Contrôle

`planches.sh` tire du film monté les planches (une image toutes les 0,4 s, et des passages image par image) qui
ont servi aux trois relectures du pilote. Deux scènes portent leurs propres contrôles automatiques, affichés
comme erreurs au rendu : dans `a3-fiche.html`, aucun fil ne passe sous une étiquette, rien ne déborde de la fiche.

## Polices

Space Grotesk, Inter et JetBrains Mono (licence SIL Open Font 1.1), copiées depuis les paquets `@fontsource`.
