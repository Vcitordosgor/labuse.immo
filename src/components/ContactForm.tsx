import { useRef, useState, useMemo } from 'preact/hooks';

// Style calé sur la DA du site via les tokens Tailwind (green/ink/muted/danger).
const FIELD =
  'w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] text-ink placeholder:text-[#6f7a74] outline-none transition-colors focus:border-green/60 focus:ring-2 focus:ring-green/20';
const LABEL = 'mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[.14em] text-green-soft';
const ERR = 'mt-1.5 block text-[13px] text-danger';

// Messages humains pour les codes d'erreur de /api/contact.
const SERVER_ERRORS: Record<string, string> = {
  validation: 'Certains champs sont invalides. Vérifiez-les et réessayez.',
  binding_missing: "Le service d'envoi est momentanément indisponible.",
  send_failed: "L'envoi a échoué de notre côté. Réessayez dans un instant.",
  invalid_json: 'Requête invalide. Rechargez la page et réessayez.',
};
const FALLBACK_NOTE = ' Vous pouvez aussi nous écrire directement : contact@labuse.immo.';

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
    // Time-trap anti-bot : au lieu d'ignorer silencieusement une soumission trop
    // rapide (<1,5 s après montage), on la diffère — aucun humain n'est pénalisé.
    const elapsed = Date.now() - mountedAt;
    if (elapsed < 1500) await new Promise((r) => setTimeout(r, 1500 - elapsed));
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = (body as { error?: string }).error ?? '';
        setServerError((SERVER_ERRORS[code] ?? "L'envoi a échoué.") + FALLBACK_NOTE);
        return;
      }
      setSubmitted(true);
      form.reset();
    } catch {
      setServerError("Impossible d'envoyer (problème réseau)." + FALLBACK_NOTE);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        class="flex flex-col items-center gap-4 rounded-2xl border border-green/25 bg-green/5 px-6 py-14 text-center"
      >
        <span class="grid h-14 w-14 place-items-center rounded-full border border-green/40 bg-green/10 text-green">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div>
          <p class="text-[19px] font-semibold text-ink">Votre demande a bien été envoyée.</p>
          <p class="mt-2 text-[15px] text-muted">Merci — nous vous répondons sous 24&nbsp;h ouvrées.</p>
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
          <input
            id="cf-nom"
            name="nom"
            required
            autoComplete="name"
            class={FIELD}
            placeholder="Votre nom"
            aria-invalid={errors.nom ? 'true' : undefined}
            aria-describedby={errors.nom ? 'cf-err-nom' : undefined}
          />
          {errors.nom && <span id="cf-err-nom" role="alert" class={ERR}>{errors.nom}</span>}
        </div>
        <div>
          <label class={LABEL} for="cf-entreprise">Entreprise</label>
          <input
            id="cf-entreprise"
            name="entreprise"
            autoComplete="organization"
            class={FIELD}
            placeholder="Société (optionnel)"
          />
        </div>
        <div>
          <label class={LABEL} for="cf-tel">Téléphone *</label>
          <input
            id="cf-tel"
            name="telephone"
            type="tel"
            required
            autoComplete="tel"
            class={FIELD}
            placeholder="0692 12 34 56"
            aria-invalid={errors.telephone ? 'true' : undefined}
            aria-describedby={errors.telephone ? 'cf-err-tel' : undefined}
          />
          {errors.telephone && <span id="cf-err-tel" role="alert" class={ERR}>{errors.telephone}</span>}
        </div>
        <div>
          <label class={LABEL} for="cf-email">Email *</label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            class={FIELD}
            placeholder="vous@societe.re"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'cf-err-email' : undefined}
          />
          {errors.email && <span id="cf-err-email" role="alert" class={ERR}>{errors.email}</span>}
        </div>
      </div>

      <div>
        <label class={LABEL} for="cf-msg">Message</label>
        <textarea id="cf-msg" name="message" rows={4} class={`${FIELD} resize-y`} placeholder="Votre commune cible, votre besoin…"></textarea>
      </div>

      {serverError && (
        <p role="alert" class="rounded-xl border border-danger/30 bg-danger/[.06] px-4 py-3 text-[14px] text-danger">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        class="inline-flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-green px-7 text-[16px] font-semibold text-[#04140f] shadow-glow transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? 'Envoi…' : 'Envoyer ma demande'}
        {!sending && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>

      <p class="text-[13px] leading-relaxed text-muted">
        Les informations que vous nous transmettez servent uniquement à traiter votre
        demande de contact. Réponse sous 24&nbsp;h ouvrées. Détails et vos droits dans
        notre <a href="/confidentialite" class="underline decoration-green/40 underline-offset-2 hover:text-ink">politique de confidentialité</a>.
      </p>
    </form>
  );
}
