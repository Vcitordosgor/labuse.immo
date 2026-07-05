# DERIVATIONS — choix juridiques (pages légales & RGPD)

Journal des décisions non triviales prises pour les mentions légales et la politique
de confidentialité, avec leur justification (LCEN + RGPD + doctrine CNIL standard).
Ce document n'est pas un conseil juridique : les cas sensibles sont à faire valider
par un avocat / DPO avant exploitation commerciale.

Dernière mise à jour : juillet 2026.

---

## 1. Deux traitements distincts, documentés séparément
Le produit crée deux relations très différentes aux données : les **visiteurs** (qui
consentent en remplissant le formulaire) et les **propriétaires fonciers** (qui ne sont
pas utilisateurs et dont les données sont traitées à leur insu). Les fusionner aurait
noyé le second — qui est le cœur du risque. La politique les traite donc en deux blocs
explicites, avec ancres `#visiteurs` et `#proprietaires`.

## 2. Base légale du traitement « propriétaires » = intérêt légitime (art. 6-1-f)
- **Consentement (6-1-a)** : écarté — impossible à recueillir auprès de personnes qui
  ne sont pas en relation avec nous.
- **Contrat (6-1-b)** : écarté — aucun contrat avec les propriétaires.
- **Intérêt légitime (6-1-f)** : retenu. Une **mise en balance** est documentée dans la
  politique : données de sources publiques, aucune donnée sensible (art. 9), portant sur
  le patrimoine foncier dans un cadre professionnel, avec droit d'opposition simple.
  ➜ À formaliser hors site : un document de *balancing test* / LIA (Legitimate Interests
  Assessment) conservé par l'éditeur. **[VIC : à rédiger et archiver]**

## 3. Information des personnes : recours à l'exception d'effort disproportionné (art. 14-5-b)
Les données n'étant pas collectées auprès des personnes, l'art. 14 impose en principe une
information **individuelle**. Vu le volume (tous les propriétaires des communes couvertes),
on invoque l'exception **14-5-b (effort disproportionné)**. Conformément à la doctrine, cette
exception n'est pas un blanc-seing : elle est **compensée** par (a) une information rendue
**publiquement accessible** (la politique, liée au pied de page), et (b) des mesures
protectrices concrètes — droit d'opposition et d'effacement faciles à exercer par email.
Choix assumé de **ne pas minimiser** ce traitement dans le texte.

## 4. Pas de bannière cookies — décision fondée sur un scan réel du code
Scan du code et du HTML généré : **aucun cookie**, aucun `localStorage`/`sessionStorage`,
aucun script tiers, aucun pixel, aucune font externe (Inter + JetBrains Mono sont
auto-hébergées via `@fontsource`, pas de Google Fonts CDN). Doctrine CNIL : le consentement
n'est requis que pour les traceurs **non strictement nécessaires**. Ici il n'y a aucun
traceur du tout → **aucune bannière requise**, et aucune n'est ajoutée (un site réellement
sans cookie est un atout de conformité). À re-vérifier si un jour on ajoute analytics/pixel.

## 5. Décision automatisée (art. 22) — jugée non applicable
Le « score d'opportunité » est une **aide à la décision** destinée à des professionnels ;
il ne produit pas d'effet juridique ni ne affecte de manière significative le propriétaire
au sens de l'art. 22. La politique le mentionne explicitement pour lever l'ambiguïté.

## 6. Destinataires / sous-traitants identifiés dans le code
- **Cloudflare, Inc.** (US) — hébergement du site + acheminement de l'email (Email Routing / binding `SEB`).
- **Google / Gmail** (US) — la notification interne arrive dans `contactlabuse@gmail.com`.
- **Notion Labs, Inc.** (US) — CRM (base « Deals »), écriture best-effort du lead.
Tous hors UE → transferts encadrés par **clauses contractuelles types**. Mention faite dans la politique.
➜ **[VIC : signer les DPA]** (Data Processing Agreements) avec Cloudflare, Notion et Google
Workspace — pendant contractuel obligatoire, hors périmètre du code.

## 7. Durées de conservation
- Visiteurs : **3 ans** après dernier contact (aligné sur la recommandation CNIL pour la
  prospection B2B).
- Propriétaires : durée de pertinence opérationnelle, suppression/anonymisation sinon, et
  **sans délai** en cas d'opposition/effacement recevable.

## 8. Directeur de la publication
Pour une entreprise individuelle, le directeur de la publication est la personne physique
éditrice : **Victor Lagane**.

## 9. Mention d'information sous le formulaire (exigence CNIL souvent oubliée)
Ajout sous le formulaire d'une phrase précisant la **finalité** (« servent uniquement à
traiter votre demande de contact ») + lien vers la politique. C'est le minimum CNIL au
point de collecte.

---

## Points restant explicitement à la charge de l'éditeur (VIC)
- [ ] **Adresse postale complète** de l'EI (rue + code postal) — placeholder dans
      `mentions-legales.astro`.
- [ ] **LIA / balancing test** écrit et archivé (justif. de l'intérêt légitime).
- [ ] **DPA signés** avec Cloudflare, Notion, Google Workspace.
- [ ] Confirmer le **canal de réception** : `contactlabuse@gmail.com` (Gmail perso ?) vs
      boîte pro — impacte la liste des sous-traitants.
- [ ] **Registre des traitements** (art. 30) tenu par l'éditeur.
- [ ] Revue finale par un **avocat / DPO** avant lancement commercial.
