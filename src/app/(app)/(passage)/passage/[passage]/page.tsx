import { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"

import { getChapterHistory } from "~/app/api/chapter-history/[passage]/getChapterHistory"
import { getOrCreateTypingSession } from "~/app/api/typing-session/getOrCreateTypingSession"
import { AssignmentProgressWarningDialog } from "~/components/assignment-progress-warning-dialog"
import { ChapterLog } from "~/components/chapter-log"
import { CopyrightCitation } from "~/components/copyright-citation"
import { Passage } from "~/components/passage"
import { fetchPassage } from "~/lib/api"
import { Translation } from "~/lib/parseEsv"
import { segmentToPassageObject } from "~/lib/passageObject"
import { passageReferenceSchema } from "~/lib/passageReference"
import { PassageSegment, toPassageSegment } from "~/lib/passageSegment"
import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import { getStudentPassageAssignmentMatch } from "~/server/repositories/classroom.repository"
import { TypedVerseRepository } from "~/server/repositories/typedVerse.repository"

import { DEFAULT_PASSAGE_SEGMENT } from "./default-passage"

const validTranslations: Translation[] = [
    "esv",
    "bsb",
    "nlt",
    "niv",
    "csb",
    "nkjv",
    "nasb",
    "ntv",
    "msg",
]

function parseTranslation(value: string | undefined | null): Translation {
    if (value && validTranslations.includes(value as Translation)) {
        return value as Translation
    }
    return "esv"
}

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ passage?: PassageSegment }>
    searchParams: Promise<{ translation?: string }>
}): Promise<Metadata> {
    const passage = (await params).passage
    const { translation: translationParam } = await searchParams
    const translation = parseTranslation(translationParam)
    const a = passageReferenceSchema.parse(passage)
    const translationLabel = translation.toUpperCase()

    return {
        title: `Type the Word - ${a} (${translationLabel})`,
        description: `Practice typing through the Bible passage of ${a} in the ${translationLabel} translation.`,
    }
}

export default async function PassagePage(props: {
    params: Promise<{ passage?: PassageSegment }>
    searchParams: Promise<{ translation?: string }>
}) {
    const session = await getServerSession(authOptions)
    const params = await props.params
    const searchParams = await props.searchParams

    // Middleware guarantees translation param exists and is valid
    const translation = parseTranslation(searchParams.translation)

    // Always include translation in URL params
    const translationParam = `?translation=${translation}`

    if (params.passage == null) {
        if (session == null) {
            redirect(`/passage/${DEFAULT_PASSAGE_SEGMENT}${translationParam}`)
        } else {
            const typedVerseRepository = new TypedVerseRepository(db)
            const verse = await typedVerseRepository.getOneOrNull({
                userId: session.user.id,
            })

            if (verse == null) {
                redirect(
                    `/passage/${DEFAULT_PASSAGE_SEGMENT}${translationParam}`,
                )
            }
            redirect(
                `/passage/${toPassageSegment(verse.book, verse.chapter)}${translationParam}`,
            )
        }
    }

    const value: PassageSegment = params.passage
    const passageObject = segmentToPassageObject(value)

    const [passage, typingSession, chapterHistory, matchingAssignment] =
        await Promise.all([
        fetchPassage(value, translation),
        session == null ? undefined : getOrCreateTypingSession(session.user.id),
        session == null
            ? undefined
            : getChapterHistory(
                  session.user.id,
                  passageObject,
                  translation,
              ),
        session == null
            ? undefined
            : getStudentPassageAssignmentMatch({
                  studentUserId: session.user.id,
                  book: passageObject.book,
                  chapter: passageObject.chapter,
              }),
    ])

    return (
        <>
            {matchingAssignment && (
                <AssignmentProgressWarningDialog assignment={matchingAssignment} />
            )}
            <Passage
                autofocus={true}
                passage={passage}
                translation={translation}
                typingSession={typingSession}
                chapterHistory={chapterHistory}
            />
            <div className="not-prose mt-8 mb-24 flex w-full justify-between">
                {passage?.prevChapter ? (
                    <Link
                        href={`/passage/${passage.prevChapter.url}${translationParam}`}
                        className="svg-outline border-primary text-primary relative border-2 px-3 py-1 font-semibold"
                    >
                        {passage.prevChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
                {passage?.nextChapter ? (
                    <Link
                        href={`/passage/${passage.nextChapter.url}${translationParam}`}
                        className="svg-outline border-primary text-primary relative border-2 px-3 py-1 font-semibold"
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
                    translation={translation}
                    chapterHistory={chapterHistory}
                />
            )}

            <CopyrightCitation copyright={passage.copyright} />
        </>
    )
}
