import { Metadata } from "next"
import { z } from "zod"

import { env } from "~/env.mjs"
import { API_BIBLE_IDS } from "~/lib/api-bible-ids"

export const metadata: Metadata = {
    title: "Type the Word - Copyright",
    description:
        "The Copyright for Type the Word. A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

const bibleSchema = z.object({
    data: z.object({
        id: z.string(),
        name: z.string(),
        abbreviation: z.string(),
        copyright: z.string(),
        info: z.string().optional(),
    }),
})

type BibleCopyright = {
    abbreviation: string
    name: string
    copyright: string
    url?: string
}

// IP Holder websites per Appendix B
const IP_HOLDER_URLS: Record<string, string> = {
    Crossway: "https://www.crossway.org",
    "Biblica, Inc": "https://www.biblica.com",
    Biblica: "https://www.biblica.com",
    "Tyndale House Publishers": "https://www.tyndale.com",
    Tyndale: "https://www.tyndale.com",
    "The Lockman Foundation": "https://www.lockman.org",
    Lockman: "https://www.lockman.org",
    "Lifeway Christian Resources": "https://www.lifeway.com",
    Holman: "https://www.lifeway.com",
    "HarperCollins Publishers": "https://www.harpercollins.com",
    "Thomas Nelson": "https://www.thomasnelson.com",
    NavPress: "https://www.navpress.com",
    "Bible Hub": "https://biblehub.com",
}

function findIpHolderUrl(copyright: string): string | undefined {
    for (const [holder, url] of Object.entries(IP_HOLDER_URLS)) {
        if (copyright.toLowerCase().includes(holder.toLowerCase())) {
            return url
        }
    }
    return undefined
}

async function fetchBibleCopyright(
    bibleId: string,
): Promise<BibleCopyright | null> {
    try {
        const response = await fetch(
            `https://rest.api.bible/v1/bibles/${bibleId}`,
            {
                headers: {
                    "api-key": env.API_BIBLE_API_KEY,
                },
                next: { revalidate: 86400 }, // Revalidate once per day
            },
        )

        if (!response.ok) {
            console.error(
                `Failed to fetch bible ${bibleId}: ${response.status}`,
            )
            return null
        }

        const data = await response.json()
        const parsed = bibleSchema.parse(data)

        return {
            abbreviation: parsed.data.abbreviation,
            name: parsed.data.name,
            copyright: parsed.data.copyright,
            url: findIpHolderUrl(parsed.data.copyright),
        }
    } catch (error) {
        console.error(`Error fetching bible ${bibleId}:`, error)
        return null
    }
}

export default async function CopyrightPage() {
    // Fetch copyright info for all API.Bible translations in parallel
    const apiBibleCopyrights = await Promise.all(
        Object.entries(API_BIBLE_IDS).map(async ([key, bibleId]) => {
            const copyright = await fetchBibleCopyright(bibleId)
            return { key, copyright }
        }),
    )

    // ESV copyright (hardcoded since it uses a different API)
    const esvCopyright: BibleCopyright = {
        abbreviation: "ESV",
        name: "English Standard Version",
        copyright:
            "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated into any other language.",
        url: "https://www.crossway.org",
    }

    // Combine ESV with API.Bible translations
    const allCopyrights = [
        { key: "esv", copyright: esvCopyright },
        ...apiBibleCopyrights.filter(
            (item): item is { key: string; copyright: BibleCopyright } =>
                item.copyright !== null,
        ),
    ]

    return (
        <>
            <h1>Copyright</h1>
            <p className="text-lg">
                Type the Word uses scripture from the following Bible
                translations. Each translation is used in accordance with the
                copyright terms of its respective publisher.
            </p>

            <div className="mt-8 space-y-8">
                {allCopyrights.map(({ key, copyright }) => (
                    <div key={key} className="border-l-4 border-primary pl-4">
                        <h2 className="mb-2 text-xl font-semibold">
                            {copyright.name} ({copyright.abbreviation})
                        </h2>
                        <p
                            className="text-sm text-primary/80"
                            dangerouslySetInnerHTML={{
                                __html: copyright.copyright,
                            }}
                        />
                        {copyright.url && (
                            <a
                                href={copyright.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-sm text-primary underline"
                            >
                                Publisher Website
                            </a>
                        )}
                    </div>
                ))}
            </div>

            <hr className="my-8 border-t-2 border-primary" />

            <h2 className="text-xl font-semibold">Additional Information</h2>
            <p className="mb-16 mt-4 text-sm text-primary">
                Scripture data for non-ESV translations is provided by{" "}
                <a
                    href="https://api.bible"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                >
                    API.Bible
                </a>
                . Users may not copy or download more than 500 verses of any
                copyrighted Bible translation or more than one half of any book
                of any copyrighted Bible.
            </p>
        </>
    )
}
