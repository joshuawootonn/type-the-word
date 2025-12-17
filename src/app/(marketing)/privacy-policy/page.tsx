import { Metadata } from 'next'

import { EmailLink } from '~/components/emailLink'

export const metadata: Metadata = {
    title: 'Type the Word - Privacy Policy',
    description:
        "The Privacy Policy for Type the Word. A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

export default function Home() {
    return (
        <>
            <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                <h1>Privacy Policy</h1>
                <hr className="mx-0 w-full border-t-2 border-primary" />

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
                        <li>Track your progress typing through the Bible</li>
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
                    selling the data collected. If the usage of Type the Word
                    starts to outpace the free tiers of the products I am using,
                    then my monetization strategy will be donation based.
                </p>

                <h2>Contact</h2>
                <p>
                    <EmailLink className="svg-outline-sm underline">
                        Contact me
                    </EmailLink>{' '}
                    if you have any questions about Type the Words&apos; privacy
                    policy, the data it holds on you, or you would like to
                    exercise one of your data protection rights.
                </p>
                <p>Terms based on MonkeyType&apos;s privacy policy.</p>
            </div>
        </>
    )
}
