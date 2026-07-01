import { useRef, useState, useMemo } from 'preact/hooks';

// Style calé sur la DA du site (dark, vert, labels mono). Logique inchangée.
const FIELD =
  'w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] text-[#f3f6f4] placeholder-[#5f6a64] outline-none transition-colors focus:border-[#2fe0a0]/60 focus:ring-2 focus:ring-[#2fe0a0]/20';
const LABEL = 'mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[.14em] text-[#8ff0cf]';
const ERR = 'mt-1.5 block text-[13px] text-[#ff9b8f]';

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mountedAt = useMemo(() => Date.now(), []);
  const PHONE_REGEX = /^[+]?[\d\s().-]{8,20}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    // Time-trap : ignore une soumission < 1500ms après le montage (bot)
    if (Date.now() - mountedAt < 1500) return;
    const fd = new FormData(form);
    // Honeypot
    if ((fd.get('website') as string)?.trim()) {
      setSubmitted(true);
      return;
    }
    const data = {
      nom: ((fd.get('nom') as string) || '').trim(),
      entreprise: ((fd.get('entreprise') as string) || '').trim(),
      telephone: ((fd.get('telephone') as string) || '').trim(),
      email: ((fd.get('email') as string) || '').trim(),
      message: ((fd.get('message') as string) || '').trim(),
    };
    const errs: Record<string, string> = {};
    if (!data.nom) errs.nom = 'Veuillez indiquer votre nom.';
    if (!data.telephone) errs.telephone = 'Veuillez indiquer un téléphone.';
    else if (!PHONE_REGEX.test(data.telephone)) errs.telephone = 'Format de téléphone non reconnu.';
    if (!data.email) errs.email = 'Veuillez indiquer un email.';
    else if (!EMAIL_REGEX.test(data.email)) errs.email = "L'adresse email semble invalide.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setSending(true);
    setServerError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServerError(`L'envoi a échoué [${(body as any).error ?? res.status}]. Réessayez.`);
        return;
      }
      setSubmitted(true);
      form.reset();
    } catch {
      setServerError("Impossible d'envoyer (réseau). Réessayez.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        class="flex flex-col items-center gap-4 rounded-2xl border border-[#2fe0a0]/25 bg-[#2fe0a0]/5 px-6 py-14 text-center"
      >
        <span class="grid h-14 w-14 place-items-center rounded-full border border-[#2fe0a0]/40 bg-[#2fe0a0]/10 text-[#2fe0a0]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div>
          <p class="text-[19px] font-semibold text-[#f3f6f4]">Message bien reçu.</p>
          <p class="mt-2 text-[15px] text-[#93a09a]">Merci — nous revenons vers vous très vite.</p>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate class="flex flex-col gap-5">
      {/* Honeypot — caché */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0"
      />

      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label class={LABEL} for="cf-nom">Nom *</label>
          <input id="cf-nom" name="nom" required class={FIELD} placeholder="Votre nom" aria-invalid={errors.nom ? 'true' : undefined} />
          {errors.nom && <span role="alert" class={ERR}>{errors.nom}</span>}
        </div>
        <div>
          <label class={LABEL} for="cf-entreprise">Entreprise</label>
          <input id="cf-entreprise" name="entreprise" class={FIELD} placeholder="Société (optionnel)" />
        </div>
        <div>
          <label class={LABEL} for="cf-tel">Téléphone *</label>
          <input id="cf-tel" name="telephone" type="tel" required class={FIELD} placeholder="0692 12 34 56" aria-invalid={errors.telephone ? 'true' : undefined} />
          {errors.telephone && <span role="alert" class={ERR}>{errors.telephone}</span>}
        </div>
        <div>
          <label class={LABEL} for="cf-email">Email *</label>
          <input id="cf-email" name="email" type="email" required class={FIELD} placeholder="vous@societe.re" aria-invalid={errors.email ? 'true' : undefined} />
          {errors.email && <span role="alert" class={ERR}>{errors.email}</span>}
        </div>
      </div>

      <div>
        <label class={LABEL} for="cf-msg">Message</label>
        <textarea id="cf-msg" name="message" rows={4} class={`${FIELD} resize-y`} placeholder="Votre commune cible, votre besoin…"></textarea>
      </div>

      {serverError && (
        <p role="alert" class="rounded-xl border border-[#ff9b8f]/30 bg-[#ff9b8f]/[.06] px-4 py-3 text-[14px] text-[#ff9b8f]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        class="inline-flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#2fe0a0] px-7 text-[16px] font-semibold text-[#04140f] shadow-[0_0_40px_rgba(47,224,160,.18)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? 'Envoi…' : 'Envoyer ma demande'}
        {!sending && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>

      <p class="text-[12px] leading-relaxed text-[#93a09a]">
        Réponse sous 24&nbsp;h ouvrées. Vos informations restent confidentielles.
      </p>
    </form>
  );
}
