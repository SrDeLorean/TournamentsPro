import type { Config } from 'tailwindcss';

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--bg-main)',
          elevated: 'var(--bg-card)',
          hover: 'var(--bg-card-hover)',
        },
        neon: {
          cyan: 'var(--accent-cyan)',
          violet: 'var(--accent-violet)',
          emerald: 'var(--accent-emerald)',
          gold: 'var(--accent-gold)',
          crimson: 'var(--accent-crimson)',
        },
        game: {
          eafc: '#72f7c1',
          valorant: '#ff4655',
          cs2: '#f8ae3c',
          lol: '#c89b3c',
          rocketleague: '#46b8ff',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 0 1px rgb(34 211 238 / 0.22), 0 0 24px rgb(34 211 238 / 0.25)',
        'neon-violet': '0 0 0 1px rgb(192 132 252 / 0.22), 0 0 24px rgb(192 132 252 / 0.25)',
        'neon-game': '0 0 0 1px color-mix(in srgb, var(--game-accent) 28%, transparent), 0 0 28px color-mix(in srgb, var(--game-accent) 28%, transparent)',
        glass: '0 18px 60px -28px rgb(0 0 0 / 0.82)',
      },
      backgroundImage: {
        'esports-grid': 'linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px)',
        'esports-radial': 'radial-gradient(circle at top, rgb(34 211 238 / 0.14), transparent 42%)',
        'game-spotlight': 'radial-gradient(circle at top right, color-mix(in srgb, var(--game-accent) 24%, transparent), transparent 44%)',
      },
      backdropBlur: {
        glass: '18px',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
