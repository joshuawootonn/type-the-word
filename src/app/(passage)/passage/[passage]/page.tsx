import { Metadata, ResolvingMetadata } from 'next'
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
import { passageReferenceSchema } from '~/lib/passageReference'
import { ChapterLog } from '~/components/chapter-log'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ passage?: PassageSegment }>
}): Promise<Metadata> {
    const passage = (await params).passage
    const a = passageReferenceSchema.parse(passage)

    return {
        title: `Type the Word - ${a}`,
        description: `Practice typing through the Bible passage of ${a}.`,
    }
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
            <div className="not-prose mb-24 mt-8 flex w-full justify-between">
                {passage?.prevChapter ? (
                    <Link
                        href={`/passage/${passage.prevChapter.url}`}
                        className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary"
                    >
                        {passage.prevChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
                {passage?.nextChapter ? (
                    <Link
                        href={`/passage/${passage.nextChapter.url}`}
                        className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary"
                    >
                        {passage.nextChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
            </div>

            {chapterHistory && (
                <ChapterLog
                    passageSegment={value}
                    chapterHistory={chapterHistory}
                />
            )}
        </>
    )
}
