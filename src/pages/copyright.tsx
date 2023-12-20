import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { Footer } from '~/components/footer'

export default function Home() {
    return (
        <div className="min-h-screen-1px  container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word - Copyright</title>
                <meta
                    name="description"
                    content="Copyright for Type the Word."
                />
                <meta
                    property="og:image"
                    content="https://typetheword.site/api/og"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <main className="prose dark:prose-invert mx-auto mb-8 w-full flex-grow pt-4 text-lg lg:pt-8">
                <h1>Copyright</h1>
                <p>
                    Scripture quotations are from the ESV® Bible (The Holy
                    Bible, English Standard Version®), © 2001 by Crossway, a
                    publishing ministry of Good News Publishers. Used by
                    permission. All rights reserved. The ESV text may not be
                    quoted in any publication made available to the public by a
                    Creative Commons license. The ESV may not be translated into
                    any other language.
                    <br />
                    <br />
                    Users may not copy or download more than 500 verses of the
                    ESV Bible or more than one half of any book of the ESV
                    Bible.
                </p>
            </main>
            <Footer />
        </div>
    )
}
