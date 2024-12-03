'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, createContext, useContext, useState } from 'react'
import { ThemeRecord } from '~/server/repositories/theme.repository'

const queryClient = new QueryClient()

export const ThemeContext = createContext<{
    updateThemes: (next: string[]) => void
    themes: string[]
}>({
    updateThemes: () => {
        console.log('ThemeContext not initialized')
    },
    themes: [],
})

export const useThemes = () => useContext(ThemeContext)

export function Providers({
    session,
    children,
    themes: myThemes,
}: {
    children: ReactNode
    session: Session | null
    themes: ThemeRecord[]
}) {
    const [themes, updateThemes] = useState<string[]>(['light', 'dark'])
    return (
        <>
            <style jsx global>{`
                ${myThemes
                    .map(
                        t => `
.${t.value} {
  --color-primary: ${t.primaryLightness}% ${t.primaryChroma} ${t.primaryHue};
  --color-secondary: ${t.secondaryLightness}% ${t.secondaryChroma} ${t.secondaryHue};
  --color-success: ${t.successLightness}% ${t.successChroma} ${t.successHue};
  --color-error: ${t.errorLightness}% ${t.errorChroma} ${t.errorHue};
}

`,
                    )
                    .join()}
                @keyframes bibleAnimation {
                    from {
                        mask-position: 0px 0;
                    }
                    to {
                        mask-position: -741px 0;
                    }
                }

                .icon {
                    display: block;
                    transform: translateY(1px);
                    width: 39px;
                    height: 33px;
                }
                .animated-icon {
                    display: none;
                    transform: translateY(1px);
                    width: 39px;
                    height: 33px;
                    background-color: oklch(var(--color-primary));
                    -webkit-mask-image: url('/bible.svg');
                    mask-image: url('/bible.svg');
                    mask-repeat: no-repeat;
                    mask-position: -741px 0;
                }

                .link:hover .icon,
                .link:focus-visible .icon {
                    display: none;
                }
                .link:hover .animated-icon,
                .link:focus-visible .animated-icon {
                    display: block;
                    animation: bibleAnimation 0.6s steps(20, jump-none) forwards;
                }
            `}</style>

            <ThemeContext.Provider value={{ themes, updateThemes }}>
                <ThemeProvider themes={themes} attribute="class">
                    <QueryClientProvider client={queryClient}>
                        <SessionProvider session={session}>
                            {children}
                        </SessionProvider>
                    </QueryClientProvider>
                </ThemeProvider>
            </ThemeContext.Provider>
        </>
    )
}
