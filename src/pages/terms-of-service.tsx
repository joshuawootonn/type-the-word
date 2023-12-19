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

            <main className="prose dark:prose-invert relative mx-auto w-full flex-grow pt-4 text-lg  lg:pt-8">
                <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                    <h1 >Terms of Service</h1>
                    <hr className="mx-0 w-full border-t-2  border-black dark:border-white" />
                    <p>
                        These terms of service were last updated on December 13,
                        2023.
                    </p>
                    <h2 >Agreement</h2>
                    <p>
                        By accessing this Website, accessible from
                        typetheword.site, you are agreeing to be bound by these
                        Website Terms of Service and agree that you are
                        responsible for the agreement in accordance with any
                        applicable local laws. IF YOU DO NOT AGREE TO ALL THE
                        TERMS AND CONDITIONS OF THIS AGREEMENT, YOU ARE NOT
                        PERMITTED TO ACCESS OR USE OUR SERVICES.
                    </p>
                    <h2 >Limitations</h2>
                    <p>
                        You are responsible for your account&apos;s security and
                        all activities on your account. You must not, in the use
                        of this site, violate any applicable laws, including,
                        without limitation, copyright laws, or any other laws
                        regarding the security of your personal data, or
                        otherwise misuse this site. I reserve the right to
                        remove or disable any account or any other content on
                        this site at any time for any reason, without prior
                        notice to you, if we believe that you have violated this
                        agreement.
                    </p>
                    <h2 >Limitations on Automated Use</h2>
                    <p>
                        You shouldn&apos;t use bots or access Type the Word. If
                        you do, I&apos;ll block you, and delete your account.
                    </p>
                    <h2 >Contact</h2>
                    <p>
                        <EmailLink className="underline">Contact me</EmailLink> if you have any
                        questions about Type the Words&apos; terms of service.
                    </p>
                    <p>
                        Terms based on MonkeyType&apos;s terms which were
                        evidently based on Glitch&apos;s terms.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    )
}
