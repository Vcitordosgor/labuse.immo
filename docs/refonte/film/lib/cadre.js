// Le cadre commun à tous les plans : une seule définition de la caméra et du terrain suivi.
// Changer de terrain = changer ce fichier (et retélécharger les photos aériennes centrées sur lui).
export const CAM0={x:-550,y:0,cx:1370,cy:540,s:860/57000};     // l'île entière, à droite ; au moins 80 px entre tout texte et le premier point allumé
export const TERRAIN={x:-27123.93,y:11789.59,id:'97415000EY0109',ref:'EY 0109',commune:'Saint-Paul',code:'97415',indice:14,section:'EY'};
export const S1=1920/400;                                        // cadre d'arrivée : 400 m de large, à la définition native des photos IGN
export const A1={x:620,y:520};                                   // où se pose le terrain à l'écran (tiers gauche : le cadre s'étend vers les terres)
export const A0={x:CAM0.cx+(TERRAIN.x-CAM0.x)*CAM0.s, y:CAM0.cy-(TERRAIN.y-CAM0.y)*CAM0.s};

// le palier de la descente : la commune entière tient dans le cadre (42 km de large), le terrain déjà vers la gauche
export const SM=1920/42000;
export const AM={x:749,y:453};
