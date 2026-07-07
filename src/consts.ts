// ─────────────────────────────────────────────────────────────────────────────
//  Constantes partagées : contact, CTA, navigation.
//  👉 Pour changer l'adresse de contact, c'est ici.
// ─────────────────────────────────────────────────────────────────────────────

export const CONTACT_EMAIL = 'contact@labuse.immo';

// Ancre vers le formulaire de contact (préfixée « / » pour fonctionner
// aussi depuis les pages annexes : légales, 404…).
export const CONTACT_ANCHOR = '/#contact';

// Ancres de navigation (même logique : valides depuis toutes les pages).
export const NAV = [
  { href: '/#produit', label: 'Le produit' },
  { href: '/#reunion', label: 'La Réunion' },
  { href: '/#donnees', label: 'Données' },
  { href: '/#tarifs', label: 'Tarifs' },
] as const;
