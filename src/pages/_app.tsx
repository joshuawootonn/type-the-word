import * as Fathom from 'fathom-client'
import { type Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { type AppType } from 'next/app'
import { Roboto_Mono } from 'next/font/google'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { env } from '~/env.mjs'
import '~/styles/globals.css'
import { api } from '~/utils/api'
import clsx from 'clsx'
import localFont from 'next/font/local'

export const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    variable: '--font-roboto-mono',
})

const neueMontreal = localFont({
    src: '../../public/neue-montreal/NeueMontreal-Variable.woff2',
    variable: '--font-neue-montreal',
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
                'font-sans min-h-[calc(100vh_-_1px)] overflow-hidden',
                neueMontreal.variable,
            )}
        >
            <SessionProvider session={session}>
                <Component {...pageProps} />
            </SessionProvider>
        </div>
    )
}

export default api.withTRPC(MyApp)
