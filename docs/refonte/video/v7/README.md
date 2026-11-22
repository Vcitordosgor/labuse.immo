# Vidéo du site, refaite sur l'application actuelle (v7)

Même déroulé que la vidéo en ligne (`public/video/labuse-promo.mp4`, fabriquée avec `../record6.mjs`) :
logo → de l'île au terrain sur la carte sombre → vue aérienne → clic sur le terrain → la fiche défile →
« Dossier » → le Dossier PDF → retour sur l'île → Couches → PPR multirisque → Zonage PLU par parcelle →
zoom final sur le zonage. 1440 × 900, 30 i/s, 32,6 s, sans son.

Ce qui change par rapport à la v6 :

- le terrain suivi n'est plus la maison d'un particulier : parcelle `97415000EY1231`, terrain nu de la commune
  de Saint-Paul (Plateau Caillou) ;
- la caméra de la carte est pilotée image par image (`window.__labuse_map`, `easeTo` à durée nulle, attente de
  l'état `idle` avant chaque photo) : zooms exacts, tuiles toujours chargées, résultat reproductible ;
- le défilement de la fiche et de la liste des couches est imposé image par image ;
- l'apparition des couches (vue aérienne, PPR, zonage) est adoucie par un fondu de quelques images au montage.

## Refaire

Les chemins pointent vers un dossier de travail (`SP`) hors dépôt : les images, le PDF et la session n'y
entrent jamais. Les identifiants ne s'écrivent dans aucun fichier.

```bash
LB_ID=… LB_PW=… node login.mjs            # ouvre la session (state.json, hors dépôt)
node record7.mjs                          # A, B, C, E → frames/ (SEGS=E ZFIN=16.2 pour ne refaire que la fin)
node telecharger-dossier.mjs              # le Dossier PDF de la parcelle
pdftoppm -r 144 -png dossier-pdf/97415000EY1231.pdf dossier/p    # puis renommer en p1.png … p10.png
SLOW=1.5 FLY=1.3 node logo7-render.mjs    # L : le logo, puis l'application qui apparaît
SLOW=2 node dossier7-render.mjs           # D : le visualiseur du Dossier
python3 -I montage7.py sortie.mp4         # CRF=22 par défaut ; CRF=29 pour le poids du site
python3 -I planche.py frames/B controle/B.jpg 12 5 560            # planche de contrôle d'un segment
```

L'enregistrement ne modifie rien dans le compte : lecture seule, et l'état de départ (carte sombre, aucune
couche cochée, liste repliée) est remis à la fin. `capture-fiche.mjs` photographie la fiche entière en très
haute définition (fiche fermée et rubriques dépliées) pour le film de présentation.

## Version 8 (retours du dirigeant)

- `logo8.html` / `logo8-render.mjs` : oiseau et « LABUSE » plus gros, phrase de marque « Le trésor est sous vos pieds. »
  sous le mot, tenue allongée pour qu'on la lise (145 images).
- `record8.mjs` : `PANNEAU=ferme` rétracte le panneau « Cartes » hors champ (bouton « Fermer le panneau ») avant
  d'enregistrer ; le zoom d'ouverture, la vue aérienne et la fiche se voient sur une carte bien plus large. L'état
  du panneau n'est pas mémorisé par l'application : rien à remettre en place.
- `montage8.py` : logo v8, segments A et B panneau rétracté, C et E inchangés (panneau ouvert sur les couches).

```bash
SEGS=A,B PANNEAU=ferme SUF=-pf node record8.mjs
SLOW=1.5 FLY=1.3 node logo8-render.mjs && SLOW=2 node dossier8-render.mjs
python3 -I montage8.py sortie.mp4
```

`capture-fiche5.mjs` capture la fiche à 5 px par px CSS, par bandes recollées sous l'en-tête fixe (au-delà de
8192 px physiques de haut, une capture d'un seul tenant se répète). `couches/` : captures de la carte par couche,
à des cadrages exacts, et photos IGN calées sur la même emprise (film « les couches »).
