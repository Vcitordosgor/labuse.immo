// Crée un lead dans la base Notion "Deals" (best-effort).
// Ne doit jamais faire échouer la réponse 200 du formulaire.
const NOTION_PAGES_API = 'https://api.notion.com/v1/pages';
const NOTION_VERSION = '2022-06-28';
const DEALS_DB_ID = '1fd7e767-a9b3-4ad4-b987-bdc414cc7b28';

export type Marque = 'TANIA' | 'LABUSE' | '9site4';

export interface NotionLeadInput {
  nom: string;
  email: string;
  marque: Marque;
  telephone?: string;
  entreprise?: string;
  message?: string;
  montant?: number;
}

export async function createNotionLead(input: NotionLeadInput, token: string): Promise<void> {
  const title = input.entreprise ? `${input.nom} — ${input.entreprise}` : input.nom;
  const properties: Record<string, unknown> = {
    'Nom du deal': { title: [{ text: { content: title.slice(0, 200) } }] },
    Marque: { select: { name: input.marque } },
    Statut: { select: { name: 'Nouveau' } },
    Source: { select: { name: 'Formulaire site' } },
    Email: { email: input.email },
    'Date création': { date: { start: new Date().toISOString().slice(0, 10) } },
  };
  if (input.telephone) properties['Téléphone'] = { phone_number: input.telephone };
  if (input.entreprise) properties['Nom entreprise'] = { rich_text: [{ text: { content: input.entreprise.slice(0, 2000) } }] };
  if (input.message) properties.Message = { rich_text: [{ text: { content: input.message.slice(0, 2000) } }] };
  if (typeof input.montant === 'number') properties['Montant estimé'] = { number: input.montant };
  const res = await fetch(NOTION_PAGES_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parent: { database_id: DEALS_DB_ID }, properties }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Notion ${res.status}: ${detail.slice(0, 300)}`);
  }
}
