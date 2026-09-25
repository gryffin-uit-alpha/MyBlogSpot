/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: '#CBD5E1', // High contrast readable text (slate-300)
            lineHeight: '1.8',
            p: {
              color: '#CBD5E1',
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            h1: {
              color: '#F8FAFC',
              fontWeight: '700',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em',
              marginTop: '1.5em',
              marginBottom: '0.8em',
            },
            h2: {
              color: '#F1F5F9',
              fontWeight: '700',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.01em',
              marginTop: '1.4em',
              marginBottom: '0.6em',
            },
            h3: {
              color: '#E2E8F0',
              fontWeight: '600',
              fontFamily: "'Space Grotesk', sans-serif",
              marginTop: '1.2em',
              marginBottom: '0.5em',
            },
            h4: {
              color: '#E2E8F0',
              fontWeight: '600',
            },
            a: {
              color: '#22D3EE',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                color: '#67E8F9',
                textDecoration: 'underline',
              },
            },
            strong: {
              color: '#FFFFFF',
              fontWeight: '700',
            },
            code: {
              color: '#22D3EE',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(34, 211, 238, 0.25)',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.375rem',
              fontWeight: '500',
              fontFamily: "'JetBrains Mono', monospace",
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            blockquote: {
              color: '#94A3B8',
              borderLeftColor: '#22D3EE',
              borderLeftWidth: '4px',
              backgroundColor: 'rgba(34, 211, 238, 0.04)',
              padding: '0.8rem 1.2rem',
              borderRadius: '0 0.5rem 0.5rem 0',
              fontStyle: 'italic',
            },
            ul: {
              listStyleType: 'disc',
            },
            li: {
              color: '#CBD5E1',
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'ul > li::marker': {
              color: '#22D3EE',
            },
            'ol > li::marker': {
              color: '#22D3EE',
            },
            hr: {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              marginTop: '2em',
              marginBottom: '2em',
            },
            table: {
              color: '#E2E8F0',
            },
            'thead th': {
              color: '#F8FAFC',
              borderBottomColor: 'rgba(255, 255, 255, 0.15)',
            },
            'tbody td': {
              borderBottomColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
        invert: {
          css: {
            color: '#CBD5E1',
            p: {
              color: '#CBD5E1',
            },
            h1: {
              color: '#F8FAFC',
            },
            h2: {
              color: '#F1F5F9',
            },
            h3: {
              color: '#E2E8F0',
            },
            h4: {
              color: '#E2E8F0',
            },
            strong: {
              color: '#FFFFFF',
            },
            li: {
              color: '#CBD5E1',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
