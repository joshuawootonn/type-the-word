import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { Footer } from '~/components/footer'
import { EmailLink } from '~/components/emailLink'

export default function Home() {
    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word</title>
                <meta
                    name="description"
                    content="A typing practice that track you typing through the Bible. Improve your typing skills while exploring biblical passages and verses. Enhance your accuracy and speed as you type through the sacred text."
                />
                <meta
                    property="og:image"
                    content="https://typetheword.site/api/og/why?"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />

            <main className="prose dark:prose-invert relative mx-auto w-full flex-grow pt-4 text-lg  lg:pt-8 dark:text-white">
                <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                    <h1 >Privacy Policy</h1>
                    <hr className="mx-0 w-full border-t-2  border-black dark:border-white" />

                    <h2 >Agreement</h2>
                    <p>
                        What data do I collect? Type the Word collects the
                        following data:
                        <ul>
                            <li>Email</li>
                            <li>First and last name</li>
                            <li>Passages you have typed.</li>
                        </ul>
                    </p>

                    <h2 >Contact</h2>
                    <p>
                        <EmailLink className="underline">Contact me</EmailLink> if you have any
                        questions about Type the Words&apos; privacy policy, the
                        data it holds on you, or you would like to exercise one
                        of your data protection rights.
                    </p>
                    <p>Terms based on MonkeyType&apos;s privacy policy.</p>
                </div>
            </main>
            <Footer />
        </div>
    )
}
