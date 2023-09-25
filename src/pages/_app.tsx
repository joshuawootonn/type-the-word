import { type Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { type AppType } from 'next/app'
import { Martian_Mono } from 'next/font/google'

import '~/styles/globals.css'
import { api } from '~/utils/api'

const martian = Martian_Mono({ subsets: ['latin'], variable: '--font-martian' })

const MyApp: AppType<{ session: Session | null }> = ({
    Component,
    pageProps: { session, ...pageProps },
}) => {
    return (
        <div className={martian.className}>
            <SessionProvider session={session}>
                <Component {...pageProps} />
            </SessionProvider>
        </div>
    )
}

export default api.withTRPC(MyApp)
