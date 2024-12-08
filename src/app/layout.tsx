import { getServerSession } from 'next-auth'
import { Providers } from './providers'
import clsx from 'clsx'
import '~/styles/globals.css'
import { Footer } from '~/components/footer'
import { Navigation } from '~/components/navigation/navigation'
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
    let currentTheme: CurrentThemeRecord | null = null

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
    }

    // added suppressHydrationWarning for next-themes within `<Providers />`
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <style>
                    {`
                ${themes
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
              `}
                </style>
            </head>
            <body
                className={clsx(
                    'min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 font-sans lg:px-0',
                    poppins.variable,
                    ibmPlexMono.variable,
                )}
            >
                <Providers
                    session={session}
                    themes={themes}
                    currentTheme={currentTheme}
                >
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
