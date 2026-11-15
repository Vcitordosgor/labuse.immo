#!/bin/bash
# Planches de contrôle tirées du pilote monté (donc avec la mention incrustée et la compression réelle).
# Chaque vignette est prise à son image exacte (sélection par numéro d'image), pour que les heures annoncées soient justes.
# Durées des plans du pilote : 5,6 + 7,4 + 18,4 + 19,0 = 50,4 s (30 images par seconde).
set -e
R=$(cd "$(dirname "$0")" && pwd)
V=$R/out/${1:-pilote-v4.mp4}; D=$R/${2:-controle4}; mkdir -p $D
# pl nom image_de_départ nombre_de_vignettes pas_en_images grille largeur
pl(){ ffmpeg -v error -y -i $V -vf "select='gte(n\,$2)*lt(n\,$2+$3*$4)*not(mod(n-$2\,$4))',scale=${6:-640}:-2,tile=$5:padding=4:color=0x333333" -fps_mode vfr -frames:v 1 -q:v 3 $D/$1; }
pl plan1.jpg 0 14 12 5x3
pl plan2.jpg 168 19 12 5x4
pl plans3-4-a.jpg 390 23 12 6x4
pl plans3-4-b.jpg 666 19 15 5x4
pl plans7-8-a.jpg 942 23 12 6x4
pl plans7-8-b.jpg 1218 20 15 5x4
pl image-par-image-plongee.jpg 276 30 1 6x5 480
pl image-par-image-remontee.jpg 978 48 1 8x6 480
pl image-par-image-oiseau.jpg 1215 72 1 9x8 480
un(){ ffmpeg -v error -y -ss $2 -i $V -frames:v 1 -q:v 2 $D/$1; }
un plein-plan1.jpg 1.0; un plein-plan2-palier.jpg 7.8; un plein-plan2-plongee.jpg 9.93; un plein-plan2-arrivee.jpg 12.4; un plein-plan3.jpg 17.5; un plein-plan4.jpg 27.5; un plein-plan7.jpg 38.5; un plein-plan8.jpg 49.5
ls -la $D | tail -n +4 | awk '{print $5, $9}'
