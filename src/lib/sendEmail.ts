// Helper d'envoi pour le binding NATIF Cloudflare Email Routing (`send_email`).
// Construit un message MIME complet — UTF-8 en base64, sujet encodé RFC 2047,
// multipart/alternative si HTML — puis appelle binding.send(new EmailMessage(...)).
// Zéro dépendance npm (btoa / TextEncoder / crypto sont natifs dans les Workers).
import { EmailMessage } from 'cloudflare:email';

export interface EmailBinding {
  send(message: EmailMessage): Promise<void>;
}

// Signature volontairement identique à l'objet utilisé côté appelant (contact.ts).
export interface EmailFields {
  from: string; // "Nom <addr@domaine>" ou "addr@domaine"
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

const CRLF = '\r\n';

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
const b64 = (s: string) => bytesToBase64(new TextEncoder().encode(s));

// Corps en base64, replié en lignes de 76 caractères (RFC 2045).
function b64Body(s: string): string {
  const raw = b64(s);
  const lines: string[] = [];
  for (let i = 0; i < raw.length; i += 76) lines.push(raw.slice(i, i + 76));
  return lines.join(CRLF);
}

// En-tête RFC 2047 : =?UTF-8?B?...?= , découpé en mots (chaque mot reste court,
// et on ne coupe jamais au milieu d'un caractère multi-octets — itération par code point).
function encodeHeaderWord(s: string): string {
  if (/^[\x20-\x7E]*$/.test(s)) return s; // ASCII imprimable → tel quel
  const words: string[] = [];
  let chunk = '';
  const flush = () => {
    if (chunk) {
      words.push(`=?UTF-8?B?${b64(chunk)}?=`);
      chunk = '';
    }
  };
  for (const ch of s) {
    if (chunk && b64(chunk + ch).length > 60) flush();
    chunk += ch;
  }
  flush();
  return words.join(`${CRLF} `);
}

// Adresse « nue » (pour l'enveloppe EmailMessage) : extrait ce qui est entre < >.
function addrOnly(s: string): string {
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim();
}

// Valeur d'en-tête d'adresse : encode le nom d'affichage si non-ASCII, garde <addr>.
function addrHeader(s: string): string {
  const m = s.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m && m[1]) return `${encodeHeaderWord(m[1])} <${m[2].trim()}>`;
  return s.trim();
}

// Date au format RFC 2822 : "Wed, 01 Jul 2026 21:57:29 +0000".
function rfc2822Date(d: Date): string {
  return d.toUTCString().replace('GMT', '+0000');
}

function buildMime(msg: EmailFields, date: Date, id: string): string {
  const domain = addrOnly(msg.from).split('@')[1] || 'localhost';
  const headers: string[] = [`From: ${addrHeader(msg.from)}`, `To: ${addrHeader(msg.to)}`];
  if (msg.replyTo) headers.push(`Reply-To: ${addrHeader(msg.replyTo)}`);
  headers.push(`Subject: ${encodeHeaderWord(msg.subject)}`);
  headers.push(`Message-ID: <${id}@${domain}>`);
  headers.push(`Date: ${rfc2822Date(date)}`);
  headers.push('MIME-Version: 1.0');

  if (msg.html) {
    const boundary = `----=_LABUSE_${id}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64Body(msg.text),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64Body(msg.html),
      `--${boundary}--`,
      '',
    ].join(CRLF);
    return headers.join(CRLF) + CRLF + CRLF + body;
  }

  headers.push('Content-Type: text/plain; charset=UTF-8');
  headers.push('Content-Transfer-Encoding: base64');
  return headers.join(CRLF) + CRLF + CRLF + b64Body(msg.text) + CRLF;
}

export async function sendEmail(binding: EmailBinding, msg: EmailFields): Promise<void> {
  const raw = buildMime(msg, new Date(), crypto.randomUUID());
  const message = new EmailMessage(addrOnly(msg.from), addrOnly(msg.to), raw);
  await binding.send(message);
}
