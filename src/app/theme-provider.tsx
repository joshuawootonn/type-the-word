'use client'

import { useQuery } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { ReactNode, useMemo } from 'react'
import {
    CurrentThemeRecord,
    ThemeRecord,
} from '~/server/repositories/theme.repository'
import { fetchCurrentTheme, fetchThemes } from '~/lib/api'

const builtinThemes = ['light', 'dark']

export interface UseThemeProps {
    /** List of all available theme names */
    themes: string[]
    /** Update the theme */
    setTheme: React.Dispatch<React.SetStateAction<string>>
    /** Active theme name */
    theme: string | undefined
    currentThemes: [string, string]
    /** If `enableSystem` is true and the active theme is "system", this returns whether the system preference resolved to "dark" or "light". Otherwise, identical to `theme` */
    resolvedTheme?: string | undefined
}

// const isServer = typeof window === 'undefined'
// const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)
// const defaultContext: UseThemeProps = { setTheme: _ => {}, themes: [] }
//
// const getLegacyTheme = (): string | undefined => {
//     if (isServer) return undefined
//     let theme
//     try {
//         // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
//         theme = localStorage.getItem('theme') || undefined
//     } catch (e) {
//         // Unsupported
//     }
//     return theme
// }
//
export function ThemeProvider({
    session,
    children,
    themes: serverRenderedThemes,
    currentTheme: serverRenderedCurrentTheme,
}: {
    children: ReactNode
    session: Session | null
    themes: ThemeRecord[]
    currentTheme: CurrentThemeRecord | null
}) {
    const currentTheme = useQuery({
        queryKey: ['currentTheme'],
        queryFn: fetchCurrentTheme,
        enabled: session?.user?.id != null,
        initialData: serverRenderedCurrentTheme,
    })
    const themes = useQuery({
        queryKey: ['themes'],
        queryFn: fetchThemes,
        enabled: session?.user?.id != null,
        initialData: serverRenderedThemes,
    })

    const allThemes = useMemo(
        () => [...builtinThemes, ...themes.data.map(t => t.value)],
        [themes],
    )

    return (
        <>
            <style jsx global>{`
                ${themes.data
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
                    .join('')}
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

            <ThemeContext.Provider
                value={{
                    themes: allThemes,
                }}
            >
                {children}
            </ThemeContext.Provider>
        </>
    )
}
