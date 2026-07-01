import type { APIRoute } from 'astro';
import { createNotionLead, type Marque } from '../../lib/notionLead';
import { sendEmail, type EmailBinding } from '../../lib/sendEmail';

export const prerender = false;

// ===== À PERSONNALISER PAR SITE =====
const MARQUE: Marque = 'LABUSE'; // 'LABUSE' | 'TANIA' | '9site4'
const NOTIFY_EMAIL = 'labuse@gmail.com'; // où tu reçois les leads
const SENDER_EMAIL = 'contact@labuse.immo'; // sender vérifié dans Email Routing (labuse.immo)
const SITE_NAME = 'LABUSE';
// ====================================

interface ContactPayload {
  nom?: string;
  entreprise?: string;
  telephone?: string;
  email?: string;
  message?: string;
  website?: string;
}

const PHONE_REGEX = /^[+]?[\d\s().-]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SebSendMsg = { from: string; to: string; subject: string; text: string; html?: string; replyTo?: string };
type Seb = { send: (msg: SebSendMsg) => Promise<unknown> };

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  // Honeypot — silent OK
  if (payload.website && payload.website.trim()) return json({ ok: true }, 200);
  const nom = (payload.nom ?? '').trim();
  const entreprise = (payload.entreprise ?? '').trim();
  const telephone = (payload.telephone ?? '').trim();
  const email = (payload.email ?? '').trim();
  const message = (payload.message ?? '').trim();
  const errors: string[] = [];
  if (!nom) errors.push('nom');
  if (!telephone || !PHONE_REGEX.test(telephone)) errors.push('telephone');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('email');
  if (errors.length) return json({ ok: false, error: 'validation', fields: errors }, 400);
  const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
  const sebBinding = env?.SEB as EmailBinding | undefined;
  if (!sebBinding) return json({ ok: false, error: 'binding_missing' }, 500);
  // Enveloppe le binding natif Email Routing : construit le MIME sous le capot,
  // pour que les appels seb.send({ from, to, subject, text, html, replyTo }) restent inchangés.
  const seb: Seb = { send: (msg) => sendEmail(sebBinding, msg) };
  const lines = [
    `Nom : ${nom}`,
    entreprise ? `Entreprise : ${entreprise}` : '',
    `Téléphone : ${telephone}`,
    `Email : ${email}`,
    message ? `\nMessage :\n${message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const internalHtml = `<div style="font-family:system-ui,sans-serif;line-height:1.6">
    <h2>Nouveau lead — ${esc(nom)}${entreprise ? ` (${esc(entreprise)})` : ''}</h2>
    <p><strong>Téléphone :</strong> ${esc(telephone)}<br>
    <strong>Email :</strong> ${esc(email)}${message ? `<br><br><strong>Message :</strong><br>${esc(message).replace(/\n/g, '<br>')}` : ''}</p>
  </div>`;
  // 1) Email interne — OBLIGATOIRE
  try {
    await seb.send({
      from: `${SITE_NAME} <${SENDER_EMAIL}>`,
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: `Nouveau lead ${SITE_NAME} — ${nom}`,
      text: lines,
      html: internalHtml,
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[api/contact] internal email failed', detail);
    return json({ ok: false, error: 'send_failed', detail }, 502);
  }
  // 2) Best-effort : lead Notion (ne bloque jamais le 200).
  //    Pas d'auto-réponse au visiteur : le binding Email Routing n'autorise que
  //    des destinataires vérifiés, et le message de succès à l'écran suffit.
  const notionToken = typeof env?.NOTION_TOKEN === 'string' ? (env.NOTION_TOKEN as string) : null;
  if (notionToken) {
    const [notionRes] = await Promise.allSettled([
      createNotionLead(
        { nom, email, telephone, entreprise: entreprise || undefined, message: message || undefined, marque: MARQUE },
        notionToken
      ),
    ]);
    if (notionRes.status === 'rejected') console.error('[api/contact] notion failed', String(notionRes.reason));
  }
  return json({ ok: true }, 200);
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
