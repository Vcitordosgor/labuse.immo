# À faire hors du code (par toi)

Relevé du 08/10/2026, à la mise en ligne de la refonte. Rien ici ne passe par Claude Code :
ce sont des réglages de comptes, des décisions ou des démarches.

## Avant de fusionner la refonte

| # | Quoi | Pourquoi | Où |
|---|---|---|---|
| 1 | **Vérifier pourquoi le site en ligne n'a pas bougé depuis juillet.** Le correctif fusionné sur `main` le 07/10 n'est toujours pas en ligne. | Si le déploiement est cassé, la refonte ne sortira pas non plus. | Cloudflare → Workers & Pages → projet du site → Deployments : regarder la branche de production (doit être `main`) et le dernier build (en échec ?). |
| ~~2~~ | ~~Numéro de téléphone pour les mentions légales.~~ **Fait le 09/10** : 0693 51 71 53, publié dans les mentions légales. | | |

## Dans le mois qui suit

| # | Quoi | Pourquoi | Où |
|---|---|---|---|
| ~~3~~ | ~~Usage des demandes du formulaire pour TANIA et 9site4.~~ **Décidé le 09/10** : réservées à LABUSE. La politique de confidentialité le dit désormais. Veiller à ce que ce soit vrai dans Notion. | | |
| 4 | Envoyer un e-mail de test à stop@labuse.immo. | L'adresse est imprimée sur les courriers et citée dans la politique. | Cloudflare → Email Routing : vérifier qu'elle arrive dans une boîte que tu lis. |
| 5 | Dans Brevo, vérifier que le suivi des ouvertures et des clics est désactivé. | Si c'est le cas, on pourra l'écrire dans la politique. | Brevo → Paramètres → Suivi. |
| 6 | Accepter l'accord de traitement des données (DPA) de chaque prestataire et en garder une copie datée. | Obligation RGPD (art. 28). Aucun n'est signé aujourd'hui. | OVH, Cloudflare, Notion, Anthropic, Brevo, Stripe : chacun le propose dans ses réglages ou ses conditions. |
| 7 | Sortir contact@ et les envois d'e-mails d'un Gmail grand public. | Gmail grand public n'a pas de contrat de sous-traitance RGPD. | Google Workspace, un fournisseur européen ou Brevo. |
| 8 | Confirmer ton régime de TVA (franchise en base, art. 293 B ?). | Les factures Stripe portent « TVA non applicable, art. 293 B » par défaut dans le code. Le site dit « 79 € HT ». **Indice du 09/10** : le registre indique micro-entreprise et un numéro de TVA inactif, ce qui va dans le sens de la franchise. À confirmer quand même. | Ton comptable ou impots.gouv. Dis-moi la réponse, j'ajoute la phrase aux mentions légales. |
| 8 bis | **Passer Stripe en paiement réel dans l'app.** Le tableau de bord Stripe est bien en mode réel (clé `pk_live_`), mais l'app tourne encore en test : aucun paiement reçu, et le dernier événement Stripe date du 24/07. | Sans cela, le Flash ne peut pas être vendu, et le bouton du site doit rester sur le formulaire. | Créer en mode réel le produit « LABUSE Flash » à 79 € (clé de recherche `labuse_flash_unitaire`) et l'adresse de notification `https://app.labuse.immo/stripe/webhook` (événement `checkout.session.completed`). Puis poser les clés réelles sur le serveur (`/etc/labuse/labuse.env`) — Claude Code peut s'en charger. Finir par un achat réel, remboursé. |
| 9 | Déclarer le nom commercial LABUSE. | Le registre officiel affiche « CLOSING CREST » comme nom commercial. **Vérifié le 09/10 : l'inscription au RCS existe** (greffe de Saint-Denis de La Réunion, 22/03/2024), elle est désormais citée dans les mentions légales. | formalites.entreprises.gouv.fr |
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
