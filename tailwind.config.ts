import { type Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

module.exports = {
    darkMode: 'selector',
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        fontFamily: {
            sans: ['var(--font-poppins)', ...defaultTheme.fontFamily.sans],
            mono: ['var(--font-ibm-plex)', ...defaultTheme.fontFamily.mono],
        },
        extend: {
            colors: {
                transparent: 'transparent',
                current: 'currentColor',
                white: {
                    DEFAULT: '#ffffff',
                },
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                incorrect: 'rgb(var(--color-incorrect) / <alpha-value>)',
                extra: 'rgb(var(--color-extra) / <alpha-value>)',
            },
            borderWidth: {
                DEFAULT: '1px',
                0: '0',
                1: '1px',
                2: '2px',
                3: '3px',
                4: '4px',
                6: '6px',
                8: '8px',
            },
            boxShadow: {
                lg: '12px 12px 0px rgba(0, 0, 0, 0.5)',
            },
            spacing: {
                100: '25rem',
                104: '26rem',
                108: '27rem',
                112: '28rem',
                116: '29rem',
                120: '30rem',
                124: '31rem',
                128: '32rem',
                132: '33rem',
                136: '34rem',
                140: '35rem',
            },
            maxWidth: {
                page: '65ch',
            },
            screens: {
                sm: '540px',
            },
            animation: {
                'spin-every-once-in-a-while':
                    'spin-every-once-in-a-while 7s ease-in-out infinite',
            },
            keyframes: {
                'spin-every-once-in-a-while': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(90deg)' },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
} satisfies Config
