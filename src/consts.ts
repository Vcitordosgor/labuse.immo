// ─────────────────────────────────────────────────────────────────────────────
//  Constantes partagées : contact, CTA, navigation.
//  👉 Pour changer l'adresse de contact ou le lien de démo, c'est ici.
// ─────────────────────────────────────────────────────────────────────────────

export const CONTACT_EMAIL = 'contact@labuse.immo'; // TODO: adresse de contact réelle

// CTA principal « Demander une démo » → email pré-rempli.
export const DEMO_MAILTO =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent('Demande de démo — LA BUSE')}` +
  `&body=${encodeURIComponent(
    'Bonjour,\n\n' +
      'Je souhaite voir une démonstration de LA BUSE sur ma commune cible.\n\n' +
      'Société :\n' +
      'Rôle :\n' +
      'Commune(s) visée(s) :\n' +
      'Téléphone :\n'
  )}`;

// CTA secondaire « Réserver un créneau ».
// TODO: remplacer par votre vrai lien de prise de rendez-vous (Calendly, Cal.com…)
export const CALENDLY_URL = '#';

// Ancre vers le formulaire de contact (section Contact).
export const CONTACT_ANCHOR = '#contact';

// Ancres de navigation du one-pager.
export const NAV = [
  { href: '#produit', label: 'Le produit' },
  { href: '#reunion', label: 'La Réunion' },
  { href: '#donnees', label: 'Données' },
  { href: '#contact', label: 'Tarifs' },
] as const;
