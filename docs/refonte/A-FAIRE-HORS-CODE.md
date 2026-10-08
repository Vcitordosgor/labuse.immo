# À faire hors du code (par toi)

Relevé du 08/10/2026, à la mise en ligne de la refonte. Rien ici ne passe par Claude Code :
ce sont des réglages de comptes, des décisions ou des démarches.

## Avant de fusionner la refonte

| # | Quoi | Pourquoi | Où |
|---|---|---|---|
| 1 | **Vérifier pourquoi le site en ligne n'a pas bougé depuis juillet.** Le correctif fusionné sur `main` le 07/10 n'est toujours pas en ligne. | Si le déploiement est cassé, la refonte ne sortira pas non plus. | Cloudflare → Workers & Pages → projet du site → Deployments : regarder la branche de production (doit être `main`) et le dernier build (en échec ?). |
| 2 | **Me donner un numéro de téléphone** pour les mentions légales. | Obligatoire pour un éditeur de site (loi LCEN). L'ancienne page ne l'avait pas non plus. Une ligne pro qui répond suffit. | Réponds-moi simplement avec le numéro. |

## Dans le mois qui suit

| # | Quoi | Pourquoi | Où |
|---|---|---|---|
| 3 | Décider si les demandes reçues par le formulaire peuvent servir à TANIA et 9site4. | La base Notion « Deals » est partagée. Aujourd'hui la politique ne dit rien : si tu veux t'en servir pour tes autres activités, il faut l'annoncer, avec un droit de refus. | Dis-moi ton choix, j'ajoute la phrase. |
| 4 | Envoyer un e-mail de test à stop@labuse.immo. | L'adresse est imprimée sur les courriers et citée dans la politique. | Cloudflare → Email Routing : vérifier qu'elle arrive dans une boîte que tu lis. |
| 5 | Dans Brevo, vérifier que le suivi des ouvertures et des clics est désactivé. | Si c'est le cas, on pourra l'écrire dans la politique. | Brevo → Paramètres → Suivi. |
| 6 | Accepter l'accord de traitement des données (DPA) de chaque prestataire et en garder une copie datée. | Obligation RGPD (art. 28). Aucun n'est signé aujourd'hui. | OVH, Cloudflare, Notion, Anthropic, Brevo, Stripe : chacun le propose dans ses réglages ou ses conditions. |
| 7 | Sortir contact@ et les envois d'e-mails d'un Gmail grand public. | Gmail grand public n'a pas de contrat de sous-traitance RGPD. | Google Workspace, un fournisseur européen ou Brevo. |
| 8 | Confirmer ton régime de TVA (franchise en base, art. 293 B ?). | Les factures Stripe portent « TVA non applicable, art. 293 B » par défaut dans le code. Le site dit « 79 € HT ». | Ton comptable ou impots.gouv. Dis-moi la réponse, j'harmonise. |
| 9 | Déclarer le nom commercial LABUSE. | Le registre officiel affiche « CLOSING CREST » comme nom commercial. Vérifier au passage si une inscription au RCS est nécessaire. | formalites.entreprises.gouv.fr |
| 10 | Compléter le pied des factures Stripe. | Mentions obligatoires : Victor Lagane EI, SIRET, adresse, mention TVA, pénalités de retard et indemnité de 40 €. | Stripe → Paramètres → Factures. |
| 11 | Me dire comment les courriers sont postés (toi ou Merci Facteur) et si la réponse d'un propriétaire est transmise au client. | Pour compléter la section « Courriers » de la politique. | Réponds-moi. |
| 12 | Rédiger l'analyse d'impact (AIPD) et le registre des traitements. | Profilage de parcelles à grande échelle, âge des dirigeants : la CNIL attend une AIPD. | Modèles sur cnil.fr ; je peux préparer un premier jet. |

## Juste après la mise en ligne

| # | Quoi | Où |
|---|---|---|
| 13 | Ajouter le domaine labuse.immo dans Google Search Console (validation par TXT DNS), puis soumettre `https://labuse.immo/sitemap-index.xml`. | search.google.com/search-console |
| 14 | Importer le site dans Bing Webmaster Tools depuis Search Console. | bing.com/webmasters |
| 15 | Tester l'accueil dans le test des résultats enrichis de Google. | search.google.com/test/rich-results |
| 16 | Vérifier que Cloudflare ne remplace pas notre `robots.txt` (robots.txt géré, AI Crawl Control). | Cloudflare → Sécurité / Bots |
| 17 | Rafraîchir l'aperçu LinkedIn, qui garde l'ancienne image en mémoire. | linkedin.com/post-inspector |
