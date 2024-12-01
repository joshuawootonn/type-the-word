import { getServerSession } from 'next-auth'
import { Providers } from './providers'
import clsx from 'clsx'
import '~/styles/globals.css'
import { Footer } from '~/components/footer'
import { Navigation } from '~/components/navigation'
import { poppins, ibmPlexMono } from './fonts'
import { authOptions } from '~/server/auth'
import Fathom from './fathom'
import { Metadata } from 'next'
import { TypedVerseRepository } from '~/server/repositories/typedVerse.repository'
import { db } from '~/server/db'
import { TypedVerse } from '~/server/repositories/typingSession.repository'
import { GlobalHotkeys } from './global-hotkeys'
import {
    CurrentThemeRecord,
    ThemeRecord,
    ThemeRepository,
} from '~/server/repositories/theme.repository'

export const metadata: Metadata = {
    metadataBase: new URL('https://typetheword.site'),
}

export type BuiltinTheme = Omit<ThemeRecord, 'id' | 'userId'>
export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    let lastTypedVerse: TypedVerse | null = null
    let themes: ThemeRecord[] = []
    let curr: ThemeRecord | null = null
    let currentTheme: CurrentThemeRecord | null

    if (session != null) {
        const typedVerseRepository = new TypedVerseRepository(db)
        lastTypedVerse = await typedVerseRepository.getOneOrNull({
            userId: session.user.id,
        })
        const themeRepository = new ThemeRepository(db)
        const userThemes =
            (await themeRepository.getMany({
                userId: session.user.id,
            })) ?? []
        themes = themes.concat(userThemes)
        currentTheme = await themeRepository.getCurrentTheme({
            userId: session.user.id,
        })
        curr = themes.find(t => t.value === currentTheme?.currentThemeValue)
    }

    console.log(curr, themes, currentTheme)
    // added suppressHydrationWarning for next-themes within `<Providers />`
    return (
        <html
            style={
                curr
                    ? {
                          '--color-primary': `${curr.primaryLightness}% ${curr.primaryChroma} ${curr.primaryHue}`,
                          '--color-secondary': `${curr.secondaryLightness}% ${curr.secondaryChroma} ${curr.secondaryHue}`,
                          '--color-success': `${curr.successLightness}% ${curr.successChroma} ${curr.successHue}`,
                          '--color-incorrect': `${curr.errorLightness}% ${curr.errorChroma} ${curr.errorHue}`,
                      }
                    : {}
            }
            lang="en"
            suppressHydrationWarning
        >
            <body
                className={clsx(
                    'min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 font-sans lg:px-0',
                    poppins.variable,
                    ibmPlexMono.variable,
                )}
            >
                <Providers session={session}>
                    <Navigation
                        themes={themes}
                        lastTypedVerse={lastTypedVerse}
                    />
                    {children}
                    <Footer />
                </Providers>
                <Fathom />
                <GlobalHotkeys />
            </body>
        </html>
    )
}
