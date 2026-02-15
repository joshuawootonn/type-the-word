import { Translation } from "~/lib/parseEsv"
import { passageSegmentSchema } from "~/lib/passageSegment"
import toProperCase from "~/lib/toProperCase"
import { getBibleMetadata } from "~/server/bibleMetadata"

type ChapterMetadata = {
    length: number
}

type BookMetadata = {
    chapters: ChapterMetadata[]
}

type BibleMetadata = Record<string, BookMetadata>

export type AssignmentChapterSegment = {
    chapter: number
    startVerse: number
    endVerse: number
    passageSegment: ReturnType<typeof passageSegmentSchema.parse>
    referenceLabel: string
}

function buildReferenceLabel(data: {
    book: string
    chapter: number
    startVerse: number
    endVerse: number
}): string {
    const base = toProperCase(data.book)
    const verseSegment =
        data.startVerse === data.endVerse
            ? `${data.chapter}:${data.startVerse}`
            : `${data.chapter}:${data.startVerse}-${data.endVerse}`

    return `${base} ${verseSegment}`
}

export function buildAssignmentChapterSegments(data: {
    book: string
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
    metadata: BibleMetadata
}): AssignmentChapterSegment[] {
    const bookMetadata = data.metadata[data.book]
    if (!bookMetadata) {
        return []
    }

    const chapterCount = bookMetadata.chapters.length
    const rangeStart = Math.max(1, Math.min(data.startChapter, chapterCount))
    const rangeEnd = Math.max(
        rangeStart,
        Math.min(data.endChapter, chapterCount),
    )
    const segments: AssignmentChapterSegment[] = []

    for (let chapter = rangeStart; chapter <= rangeEnd; chapter += 1) {
        const chapterLength = bookMetadata.chapters[chapter - 1]?.length
        if (!chapterLength) {
            continue
        }

        const desiredStart = chapter === rangeStart ? data.startVerse : 1
        const desiredEnd = chapter === rangeEnd ? data.endVerse : chapterLength
        const startVerse = Math.max(1, Math.min(desiredStart, chapterLength))
        const endVerse = Math.max(
            startVerse,
            Math.min(desiredEnd, chapterLength),
        )

        segments.push({
            chapter,
            startVerse,
            endVerse,
            passageSegment: passageSegmentSchema.parse(
                `${data.book} ${chapter}`,
            ),
            referenceLabel: buildReferenceLabel({
                book: data.book,
                chapter,
                startVerse,
                endVerse,
            }),
        })
    }

    return segments
}

export async function buildAssignmentChapterSegmentsFromMetadata(data: {
    book: string
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
    translation: Translation
}): Promise<AssignmentChapterSegment[]> {
    const metadata = await getBibleMetadata(data.translation)

    return buildAssignmentChapterSegments({
        ...data,
        metadata,
    })
}

export function getActiveChapterIndex(
    chapterSegments: AssignmentChapterSegment[],
    chapterParam: string | undefined,
): number {
    if (chapterSegments.length === 0) {
        return 0
    }

    const parsedChapter = Number.parseInt(chapterParam ?? "", 10)
    const firstChapter = chapterSegments[0]?.chapter ?? 1
    const lastChapter =
        chapterSegments[chapterSegments.length - 1]?.chapter ?? 1
    const clampedChapter = Number.isNaN(parsedChapter)
        ? firstChapter
        : Math.min(Math.max(parsedChapter, firstChapter), lastChapter)
    const activeIndex = chapterSegments.findIndex(
        segment => segment.chapter === clampedChapter,
    )

    return activeIndex === -1 ? 0 : activeIndex
}
