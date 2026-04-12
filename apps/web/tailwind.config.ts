import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        mist: 'rgb(var(--color-mist) / <alpha-value>)',
        ember: 'rgb(var(--color-ember) / <alpha-value>)',
        emberSoft: 'rgb(var(--color-ember-soft) / <alpha-value>)',
        ocean: 'rgb(var(--color-ocean) / <alpha-value>)',
        pine: 'rgb(var(--color-pine) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        display: ['var(--font-fraunces)', 'serif'],
      },
      boxShadow: {
        panel: '0 24px 80px rgba(15, 23, 42, 0.28)',
      },
      backgroundImage: {
        'mesh-warm':
          'radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.16), transparent 28%), radial-gradient(circle at 80% 15%, rgba(20, 184, 166, 0.16), transparent 32%), radial-gradient(circle at 50% 90%, rgba(251, 191, 36, 0.14), transparent 28%)',
      },
    },
  },
  plugins: [],
};

export default config;
