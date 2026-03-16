import { getServerSession } from "next-auth"
import NextLink from "next/link"
import { redirect } from "next/navigation"

import { Link } from "~/components/ui/link"
import { toPassageSegment } from "~/lib/passageSegment"
import toProperCase from "~/lib/toProperCase"
import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import { TypedVerseRepository } from "~/server/repositories/typedVerse.repository"

export default async function HomePage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/auth/login?callbackUrl=%2Fhome")
    }

    const typedVerseRepository = new TypedVerseRepository(db)
    const recentLocations = await typedVerseRepository.getRecentTypingLocations(
        {
            userId: session.user.id,
            limit: 5,
        },
    )

    return (
        <main className="typo:prose text-primary dark:typo:prose-invert typo:prose-headings:text-primary typo:prose-p:text-primary mx-auto mb-8 w-full grow pt-4 text-lg lg:pt-8">
            <h1>Recent Typing Locations</h1>
            <p>
                Keep track of the last places you typed, so it is easy to jump
                back in if a location gets overwritten.
            </p>

            {recentLocations.length === 0 ? (
                <p>
                    You have not typed any verses yet. Start at{" "}
                    <NextLink
                        href="/passage/genesis_1?translation=esv"
                        className="svg-outline-sm text-primary relative"
                    >
                        Genesis 1
                    </NextLink>{" "}
                    and this page will show your recent locations.
                </p>
            ) : (
                <ol className="not-prose mt-6 space-y-3">
                    {recentLocations.map(location => {
                        const bookName = toProperCase(
                            location.book.split("_").join(" "),
                        )
                        const label = `${bookName} ${location.chapter}:${location.verse} (${location.translation.toUpperCase()})`
                        const href = `/passage/${toPassageSegment(location.book, location.chapter)}?translation=${location.translation}`

                        return (
                            <li key={href}>
                                <Link href={href}>{label}</Link>
                            </li>
                        )
                    })}
                </ol>
            )}
        </main>
    )
}
