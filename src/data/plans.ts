// ─────────────────────────────────────────────────────────────────────────────
//  GRILLE TARIFAIRE — source de vérité unique.
//  Consommée par Pricing.astro (affichage) ET par le JSON-LD SoftwareApplication
//  (index.astro) : les montants du schéma sont mécaniquement ceux de la page.
//  ⚠️ Wording prix validé — ne pas modifier sans accord.
// ─────────────────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  featured: boolean;
  /** Prix mensuel HT en euros — absent pour les offres sur devis. */
  price?: string;
  devis?: boolean;
  pour: string;
  users: string;
  extraSeat?: string;
  features: string[];
  cta: string;
}

export const plans: Plan[] = [
  {
    id: 'inde',
    name: 'Indé',
    featured: false,
    price: '290',
    pour: 'Marchand de biens, CMI, géomètre — en solo',
    users: '1 utilisateur',
    features: [
      'Accès complet à la plateforme',
      'Fiches parcelles sourcées — chaque valeur tracée à sa source',
      'Go/no-go argumenté : règles d’urbanisme à l’article et à la page',
    ],
    cta: 'Réserver une démo',
  },
  {
    id: 'pro',
    name: 'Pro',
    featured: true,
    price: '490',
    pour: 'Promoteurs, lotisseurs, CMI structurés',
    users: '2 utilisateurs inclus',
    extraSeat: 'Siège supplémentaire : 150 €/mois',
    features: [
      'Tout ce que contient l’offre Indé',
      'Comptes équipe',
      'Partage des dossiers entre collaborateurs',
    ],
    cta: 'Réserver une démo',
  },
  {
    id: 'orga',
    name: 'Organisation',
    featured: false,
    devis: true,
    pour: 'Bailleurs sociaux, grands comptes, EnR',
    users: 'Utilisateurs selon besoin',
    features: [
      'Tout ce que contient l’offre Pro',
      'Déploiement dédié',
      'Accompagnement à la prise en main',
    ],
    cta: 'Nous contacter',
  },
];
