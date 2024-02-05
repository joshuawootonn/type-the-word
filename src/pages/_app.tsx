import * as Fathom from 'fathom-client'
import { type Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { type AppType } from 'next/app'
import { IBM_Plex_Mono, Poppins } from 'next/font/google'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { env } from '~/env.mjs'
import '~/styles/globals.css'
import { api } from '~/utils/api'
import clsx from 'clsx'
import { AxiomWebVitals } from 'next-axiom'

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

const MyApp: AppType<{ session: Session | null }> = ({
    Component,
    pageProps: { session, ...pageProps },
}) => {
    const router = useRouter()

    useEffect(() => {
        Fathom.load(env.NEXT_PUBLIC_FATHOM_ID, {
            includedDomains: ['www.typetheword.site', 'typetheword.site'],
        })

        const handleRouteChange = () => {
            Fathom.trackPageview()
        }
        router.events.on('routeChangeComplete', handleRouteChange)
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange)
        }
    }, [router.events])

    return (
        <div
            className={clsx(
                'min-h-[calc(100vh_-_1px)] overflow-hidden font-sans',
                poppins.variable,
                ibmPlexMono.variable,
            )}
        >
            <AxiomWebVitals />
            <SessionProvider session={session}>
                <Component {...pageProps} />
            </SessionProvider>
        </div>
    )
}

export default api.withTRPC(MyApp)
