import { Analytics } from '@vercel/analytics/react'
import clsx from 'clsx'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'

import { Footer } from '~/components/footer'
import { Navigation } from '~/components/navigation/navigation'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { BuiltinThemeRepository } from '~/server/repositories/builtinTheme.repository'
import {
    CurrentTheme,
    CurrentThemeRepository,
} from '~/server/repositories/currentTheme.repository'
import { TypedVerseRepository } from '~/server/repositories/typedVerse.repository'
import { TypedVerse } from '~/server/repositories/typingSession.repository'
import {
    UserThemeRecord,
    UserThemeRepository,
} from '~/server/repositories/userTheme.repository'
import '~/styles/globals.css'

import Fathom from './fathom'
import { poppins } from './fonts'
import { GlobalHotkeys } from './global-hotkeys'
import { Providers } from './providers'
import { ThemeScript } from './theme-script'
import { ThemeStyles } from './theme-styles'

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
                    'min-h-screen-1px flex w-full font-sans',
                    poppins.variable,
                )}
            >
                <div className="container mx-auto flex max-w-page flex-col px-4  lg:px-0">
                    <Providers
                        currentTheme={currentTheme}
                        userThemes={userThemes}
                        builtinThemes={builtinThemes}
                        session={session}
                    >
                        <Navigation
                            lastTypedVerse={lastTypedVerse}
                            userThemes={userThemes}
                            builtinThemes={builtinThemes}
                        />
                        {children}
                        <Footer />
                    </Providers>
                    <Fathom />
                    <Analytics />
                    <GlobalHotkeys />
                </div>
            </body>
        </html>
    )
}
