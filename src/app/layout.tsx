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

    if (session != null) {
        const typedVerseRepository = new TypedVerseRepository(db)
        lastTypedVerse = await typedVerseRepository.getOneOrNull({
            userId: session.user.id,
        })
    }

    // added suppressHydrationWarning for next-themes within `<Providers />`
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={clsx(
                    'min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 font-sans lg:px-0',
                    poppins.variable,
                    ibmPlexMono.variable,
                )}
            >
                <Providers session={session}>
                    <Navigation lastTypedVerse={lastTypedVerse} />
                    {children}
                    <Footer />
                </Providers>
                <Fathom />
            </body>
        </html>
    )
}
