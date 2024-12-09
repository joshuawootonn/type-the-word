import { useQuery } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { ReactNode, createContext } from 'react'
import { fetchBuiltinThemes } from '~/lib/api'
import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'

const ThemeContext = createContext<{
    builtinThemes: BuiltinThemeRecord[]
    currentTheme: 'system'
}>({
    builtinThemes: [],
    currentTheme: 'system',
})

export function ThemeProvider({
    session,
    children,
    builtinThemes: serverRenderedBuiltinThemes,
}: {
    children: ReactNode
    session: Session | null
    builtinThemes: BuiltinThemeRecord[]
}) {
    const builtinThemes = useQuery({
        queryKey: ['builtinThemes'],
        queryFn: fetchBuiltinThemes,
        enabled: session?.user?.id != null,
        initialData: serverRenderedBuiltinThemes,
    })

    return (
        <ThemeContext.Provider
            value={{
                builtinThemes: builtinThemes.data,
                currentTheme: 'system',
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}
