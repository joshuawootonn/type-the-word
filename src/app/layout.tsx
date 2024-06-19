import { Session } from 'next-auth'
import { Providers } from './providers'
import { IBM_Plex_Mono, Poppins } from 'next/font/google'
import clsx from 'clsx'
import '~/styles/globals.css'
import { Footer } from '~/components/footer'

export const ibmPlexMono = IBM_Plex_Mono({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-ibm-plex',
})

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-poppins',
})

export default function RootLayout({
    children,
    session,
}: {
    children: React.ReactNode
    session: Session | null
}) {
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
                    {children}
                    <Footer />
                </Providers>
            </body>
        </html>
    )
}
