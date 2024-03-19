import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { Footer } from '~/components/footer'
import { EmailLink } from '~/components/emailLink'

export default function Home() {
    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word - Privacy Policy</title>
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

            <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg dark:prose-invert  lg:pt-8">
                <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                    <h1>Privacy Policy</h1>
                    <hr className="mx-0 w-full border-t-2  border-black dark:border-white" />

                    <h2>What data does Type the Word collect?</h2>
                    <p>
                        Type the Word collects the following data:
                        <ul>
                            <li>Email</li>
                            <li>First and last name</li>
                            <li>Passages you have typed</li>
                        </ul>
                    </p>
                    <h2>How will Type the Word use your data?</h2>
                    <p>
                        Type the Word collects your data so that it can:
                        <ul>
                            <li>
                                Track your progress typing through the Bible
                            </li>
                            <li>
                                Send occasional update emails - no more than 6 a
                                year
                            </li>
                        </ul>
                    </p>
                    <h2>How does Type the Word store your data?</h2>
                    <p>
                        Type the Word securely stores your data in a planetscale
                        database.
                    </p>
                    <h2>Does Type the Word share data</h2>
                    <p>
                        I (Josh Wootonn) have no intention of ever sharing or
                        selling the data collected. If the usage of Type the
                        Word starts to outpace the free tiers of the products I
                        am using, then my monetization strategy will be donation
                        based.
                    </p>

                    <h2>Contact</h2>
                    <p>
                        <EmailLink className="svg-outline-sm underline">
                            Contact me
                        </EmailLink>{' '}
                        if you have any questions about Type the Words&apos;
                        privacy policy, the data it holds on you, or you would
                        like to exercise one of your data protection rights.
                    </p>
                    <p>Terms based on MonkeyType&apos;s privacy policy.</p>
                </div>
            </main>
            <Footer />
        </div>
    )
}
