import Head from 'next/head'

import { useRouter } from 'next/router'
import { Navigation } from '~/components/navigation'

export default function Home() {
    const { asPath } = useRouter()
    const finalSlashIndex = asPath.lastIndexOf('/')
    const previousPath = asPath.slice(0, finalSlashIndex)
    console.log('previousPath', previousPath, asPath)

    return (
        <div className="container mx-auto flex min-h-screen max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word - History</title>
                <meta
                    name="description"
                    content="History of all the passages you have typed."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <main className="prose mx-auto mb-8 w-full pt-4 lg:pt-8">
                <h1 className="">History</h1>
                <hr className="mx-0 w-full border-t-2 border-black" />
                <h2>Summary</h2>
                <p>coming soon....</p>
                <hr className="mx-0 w-full border-t-2 border-black" />
                <h2>Log</h2>
                <p>coming soon....</p>
            </main>
        </div>
    )
}
