import { type Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        fontFamily: {
            sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
            mono: ['var(--font-roboto-mono)', ...defaultTheme.fontFamily.mono],
        },
        extend: {
            colors: {
                transparent: 'transparent',
                current: 'currentColor',
                white: {
                    DEFAULT: '#ffffff',
                },
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
        },
    },
    plugins: [require('@tailwindcss/typography')],
} satisfies Config
