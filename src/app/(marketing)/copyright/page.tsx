import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Type the Word - Copyright',
    description:
        "The Copyright for Type the Word. A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

// property="og:image"
// content="https://typetheword.site/api/og"
export default function Home() {
    return (
        <>
            <h1>Copyright</h1>
            <p>
                Scripture quotations are from the ESV® Bible (The Holy Bible,
                English Standard Version®), © 2001 by Crossway, a publishing
                ministry of Good News Publishers. Used by permission. All rights
                reserved. The ESV text may not be quoted in any publication made
                available to the public by a Creative Commons license. The ESV
                may not be translated into any other language.
                <br />
                <br />
                Users may not copy or download more than 500 verses of the ESV
                Bible or more than one half of any book of the ESV Bible.
            </p>
        </>
    )
}
