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
import { BuiltinThemeRepository } from '~/server/repositories/builtinTheme.repository'
import {
    CurrentTheme,
    CurrentThemeRepository,
} from '~/server/repositories/currentTheme.repository'
import {
    UserThemeRecord,
    UserThemeRepository,
} from '~/server/repositories/userTheme.repository'
import { ThemeStyles } from './theme-styles'
import { ThemeScript } from './theme-script'

export const metadata: Metadata = {
    metadataBase: new URL('https://typetheword.site'),
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    let lastTypedVerse: TypedVerse | null = null
    let currentTheme: CurrentTheme | null = null
    let userThemes: UserThemeRecord[] = []

    const builtinThemeRepository = new BuiltinThemeRepository(db)
    const builtinThemes = await builtinThemeRepository.getMany()

    if (session != null) {
        const typedVerseRepository = new TypedVerseRepository(db)
        lastTypedVerse = await typedVerseRepository.getOneOrNull({
            userId: session.user.id,
        })
        const userThemeRepository = new UserThemeRepository(db)
        userThemes = await userThemeRepository.getMany({
            userId: session.user.id,
        })

        const currentThemeRepository = new CurrentThemeRepository(db)
        currentTheme = await currentThemeRepository.getCurrentTheme({
            userId: session.user.id,
        })
    }

    // added suppressHydrationWarning since `ThemeScript` adds classes to `html` onload
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <ThemeStyles
                    builtinThemes={builtinThemes}
                    userThemes={userThemes}
                />
                <ThemeScript
                    currentTheme={currentTheme}
                    builtinThemes={builtinThemes}
                    userThemes={userThemes}
                />
            </head>
            <body
                className={clsx(
                    'min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 font-sans lg:px-0',
                    poppins.variable,
                    ibmPlexMono.variable,
                )}
            >
                <Providers
                    currentTheme={currentTheme}
                    userThemes={userThemes}
                    builtinThemes={builtinThemes}
                    session={session}
                >
                    <Navigation lastTypedVerse={lastTypedVerse} />
                    {children}
                    <Footer />
                </Providers>
                <Fathom />
                <GlobalHotkeys />
            </body>
        </html>
    )
}
