#!/bin/bash
# Vidéo 3 — séquence « fiche parcelle » (FV) : refait TOUTES les images et le journal à partir d'un fond.
#   ./f-rendre.sh <fond.jpg> <x_terrain> <y_terrain>
#     fond.jpg            image fixe de l'application, 2880×1800 (2 px par px CSS) — la première image de la séquence est ce fond, intact
#     x_terrain y_terrain position du terrain cliqué, en px CSS du cadre 1440×900 (le fond avance à peine vers ce point)
#   sans argument : le fond d'essai video/frames/B-v9/0036.jpg, terrain à (575, 498).
#   variables : SS=2 (px du rendu par px final ; 1 = brouillon rapide), ANNEAU=0 (1 = un anneau fin part du terrain à l'arrivée de la fiche),
#               ESSAI=nom (essai : rien n'est écrit dans video/frames, voir plus bas)
# Écrit : video/frames/FV/0000.jpg … (1440×900, JPEG 95), video/frames/journal-FV.json, controle-v2/planche-fv.jpg, fixe-fv-tuiles.jpg, fixe-fv-outils.jpg.
# Un seul processus de rendu à la fois, en priorité basse. Durée : voir la dernière ligne (≈ 2 à 4 min selon la charge de la machine).
R=/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad/promo
V=/tmp/claude-0/-home-user-labuse-immo/c63124ce-02a1-58ce-ac83-598cbc29f87a/scratchpad/video/frames
FOND=${1:-$V/B-v9/0036.jpg}; TX=${2:-575}; TY=${3:-498}
[ -f "$FOND" ] || { echo "ÉCHEC : fond introuvable : $FOND"; exit 1; }
FOND=$(readlink -f "$FOND"); cd $R || exit 1; mkdir -p f-data journaux; D=$(date +%s)
EXT=$(echo "${FOND##*.}" | tr 'A-Z' 'a-z'); [ "$EXT" = jpeg ] && EXT=jpg; rm -f f-data/fond.*; cp "$FOND" f-data/fond.$EXT || exit 1      # jpg, png ou webp
rm -f journaux/fv.fini journaux/fv-journal.json
nice -n 19 node lib/f-rendre.mjs --fond f-data/fond.$EXT --tx "$TX" --ty "$TY" --ss ${SS:-2} --anneau ${ANNEAU:-0} --sortie frames/fv-brut --journal journaux/fv-journal.json 2>&1 | tee journaux/fv-rendu.log
[ -f journaux/fv-journal.json ] || { echo "ÉCHEC du rendu (voir journaux/fv-rendu.log)"; exit 1; }
grep -q 'ERREUR' journaux/fv-rendu.log && { echo "ÉCHEC : erreur de page pendant le rendu (voir journaux/fv-rendu.log)"; exit 1; }
# (essai sans toucher à la livraison : ESSAI=nom → images dans frames/fv-<nom>, journal dans journaux/fv-<nom>.json, pas de planche)
if [ -n "$ESSAI" ]; then SORTIE=$R/frames/fv-$ESSAI; OPTS="--sortie $SORTIE --journal-sortie $R/journaux/fv-$ESSAI.json --sans-controle"; else SORTIE=$V/FV; OPTS=""; fi
nice -n 19 /usr/bin/python3 -I f-finir.py "$FOND" $OPTS 2>&1 | tee journaux/fv-finir.log; [ ${PIPESTATUS[0]} -eq 0 ] || { echo "ÉCHEC de la fin de chaîne (voir journaux/fv-finir.log)"; exit 1; }
echo "f-rendre.sh : fond $FOND, terrain ($TX, $TY) — $(ls $SORTIE/*.jpg | wc -l) images dans $SORTIE en $(( $(date +%s) - D )) s" | tee journaux/fv.fini
