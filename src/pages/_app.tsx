import * as Fathom from 'fathom-client'
import { type Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { type AppType } from 'next/app'
import { Martian_Mono } from 'next/font/google'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { env } from '~/env.mjs'
import '~/styles/globals.css'
import { api } from '~/utils/api'
import clsx from 'clsx'

const martian = Martian_Mono({ subsets: ['latin'], variable: '--font-martian' })

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
            className={clsx('min-h-screen overflow-hidden', martian.className)}
        >
            <SessionProvider session={session}>
                <Component {...pageProps} />
            </SessionProvider>
        </div>
    )
}

export default api.withTRPC(MyApp)
