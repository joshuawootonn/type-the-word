import { Metadata } from 'next'
import { Passage } from '~/components/passage'
import { DEFAULT_PASSAGE_SEGMENT } from './default-passage'
import Link from 'next/link'
import { fetchPassage } from '~/lib/api'
import { PassageSegment, toPassageSegment } from '~/lib/passageSegment'
import { redirect } from 'next/navigation'
import { getOrCreateTypingSession } from '~/app/api/typing-session/getOrCreateTypingSession'
import { getChapterHistory } from '~/app/api/chapter-history/[passage]/getChapterHistory'
import { segmentToPassageObject } from '~/lib/passageObject'
import { authOptions } from '~/server/auth'
import { getServerSession } from 'next-auth'
import { TypedVerseRepository } from '~/server/repositories/typedVerse.repository'
import { db } from '~/server/db'

export const metadata: Metadata = {
    title: 'Type the Word',
    description:
        "A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

export default async function PassagePage(props: {
    params: { passage?: PassageSegment }
}) {
    const session = await getServerSession(authOptions)

    if (props.params.passage == null) {
        if (session == null) redirect(`/passage/${DEFAULT_PASSAGE_SEGMENT}`)
        else {
            const typedVerseRepository = new TypedVerseRepository(db)
            const verse = await typedVerseRepository.getOneOrNull({
                userId: session.user.id,
            })

            if (verse == null) {
                redirect(`/passage/${DEFAULT_PASSAGE_SEGMENT}`)
            }
            redirect(`/passage/${toPassageSegment(verse.book, verse.chapter)}`)
        }
    }

    const value = props.params.passage

    const [passage, typingSession, chapterHistory] = await Promise.all([
        fetchPassage(value),
        session == null ? undefined : getOrCreateTypingSession(session.user.id),
        session == null
            ? undefined
            : getChapterHistory(session.user.id, segmentToPassageObject(value)),
    ])

    return (
        <>
            <Passage
                autofocus={true}
                passage={passage}
                typingSession={typingSession}
                chapterHistory={chapterHistory}
            />
            <div className="mb-24 mt-8 flex w-full justify-between">
                {passage?.prevChapter ? (
                    <Link
                        href={`/passage/${passage.prevChapter.url}`}
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white"
                    >
                        {passage.prevChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
                {passage?.nextChapter ? (
                    <Link
                        href={`/passage/${passage.nextChapter.url}`}
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white"
                    >
                        {passage.nextChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
            </div>
        </>
    )
}
