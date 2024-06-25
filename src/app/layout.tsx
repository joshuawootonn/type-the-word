import { getServerSession } from 'next-auth'
import { Providers } from './providers'
import clsx from 'clsx'
import '~/styles/globals.css'
import { Footer } from '~/components/footer'
import { Navigation } from '~/components/navigation'
import { poppins, ibmPlexMono } from './fonts'
import { authOptions } from '~/server/auth'

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    return (
        <html lang="en">
            <body
                className={clsx(
                    'min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 font-sans lg:px-0',
                    poppins.variable,
                    ibmPlexMono.variable,
                )}
            >
                <Providers session={session}>
                    <Navigation />
                    {children}
                    <Footer />
                </Providers>
            </body>
        </html>
    )
}
