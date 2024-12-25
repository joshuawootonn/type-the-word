import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { Passage } from '~/components/passage'
import { fetchPassage } from '~/lib/api'
import { segmentToPassageObject } from '~/lib/passageObject'
import { authOptions } from '~/server/auth'
import { getChapterHistory } from '../api/chapter-history/[passage]/getChapterHistory'
import { getOrCreateTypingSession } from '../api/typing-session/getOrCreateTypingSession'
import { passageSegmentSchema } from '~/lib/passageSegment'
import { PassageSelector } from '~/components/passageSelector'

export const metadata: Metadata = {
    title: 'Type the Word',
    description:
        "A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

export default async function PassagePage() {
    const session = await getServerSession(authOptions)

    const value = passageSegmentSchema.parse('psalm 23:1-2')

    const [passage, typingSession, chapterHistory] = await Promise.all([
        fetchPassage(value),
        session == null ? undefined : getOrCreateTypingSession(session.user.id),
        session == null
            ? undefined
            : getChapterHistory(session.user.id, segmentToPassageObject(value)),
    ])

    return (
        <div
            className={
                'prose-h2:text-3xl prose-p:text-xl prose-code:before:content-none prose-code:after:content-none prose-li:text-xl'
            }
        >
            <h1>Welcome to Type the Word</h1>
            <p>
                Type the Word is a tool for Typing through the Bible. It keeps
                track of what verses and books of the Bible you have typed, and
                helps you improve your typing skills while meditating on
                God&apos;s word.
            </p>
            <p>
                As you type, TTW highlights correct letters in green and
                incorrect letters in red. Here is an example from Psalm 23:
            </p>
            <div className="relative z-0 flex flex-col items-end justify-end border-2 border-primary px-4 pb-5 pt-1">
                <Passage
                    autofocus={true}
                    passage={passage}
                    typingSession={typingSession}
                    chapterHistory={chapterHistory}
                    passageSegmentOverride={value}
                />
                <div className="absolute bottom-0 right-0 translate-x-0.5 translate-y-0.5 border-2 border-primary px-3">
                    Example of typing experience with Psalm 23
                </div>
            </div>

            <p>
                {session == null ? 'Once you create an account, your' : 'Your'}{' '}
                <a
                    className="svg-outline-sm relative text-primary"
                    href="/history"
                >
                    typing history
                </a>{' '}
                will be saved automatically so that you can see statistics about
                how much of each book you have typed and how many verses you
                have typed in the last month.
            </p>

            <p>
                There are a bunch of little details to help you type through the
                Bible, but you can discover those along the way.
            </p>

            <ol>
                <li>Create an account so your typing history is saved</li>
                <li>
                    <div className="flex flex-col items-start justify-start space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
                        <PassageSelector label="Find your favorite scripture: " />
                    </div>
                </li>
                <li>and start typing!</li>
            </ol>
        </div>
    )
}
