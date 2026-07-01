/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS — source de vérité unique (repris du hero validé).
//  Ces mêmes valeurs sont mirroir des variables CSS de src/styles/global.css
//  (:root). Si tu changes une couleur ici, change-la aussi là-bas.
// ─────────────────────────────────────────────────────────────────────────────
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060a08', // fond
        surface: '#0c1512', // surfaces / cartes
        green: {
          DEFAULT: '#2fe0a0', // vert principal
          soft: '#8ff0cf', // vert clair (accents / glow)
        },
        coast: '#7cf3cf', // trait de la carte
        ink: '#f3f6f4', // texte
        muted: '#93a09a', // texte atténué
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      letterSpacing: {
        tightest: '-.045em', // titres serrés (H1/H2)
      },
      maxWidth: {
        content: '1240px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(47,224,160,.18)',
        card: '0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.4)',
      },
      keyframes: {
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
