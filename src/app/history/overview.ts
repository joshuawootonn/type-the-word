import { passageReferenceSchema } from '~/lib/passageReference'
import { Book, bookSchema } from '~/lib/types/book'
import { getBibleMetadata } from '~/server/bibleMetadata'
import { TypingSession } from '~/server/repositories/typingSession.repository'

function toPluralBookForm(book: Book) {
    if (book === 'psalm') {
        return 'psalms'
    }

    return book
}

export type ChapterOverview = {
    chapter: number
    verses: number
    typedVerses: number
    percentage: number
    prestige: number
}

export type BookOverview = {
    book: string
    label: string
    prestige: number
    percentage: number
    alt: number
    chapters: ChapterOverview[]
    verses: number
    typedVerses: number
}

export function getBookOverview(
    typingSessions: TypingSession[],
): BookOverview[] {
    const bibleMetadata = getBibleMetadata()

    let bookVerses: Record<
        Partial<(typeof bookSchema.options)[number]>,
        Record<number, Record<number, number>>
    > = {} as never
    for (const typingSession of typingSessions) {
        for (const verse of typingSession.typedVerses) {
            if (bookVerses[verse.book] == null) {
                bookVerses[verse.book] = {}
            }
            if (bookVerses[verse.book][verse.chapter] == null) {
                bookVerses[verse.book][verse.chapter] = {}
            }
            if (bookVerses[verse.book][verse.chapter]) {
                const current =
                    bookVerses[verse.book]?.[verse.chapter]?.[verse.verse] ?? 0
                const next = current + 1
                bookVerses = {
                    ...bookVerses,
                    [verse.book]: {
                        ...bookVerses[verse.book],
                        [verse.chapter]: {
                            ...bookVerses[verse.book][verse.chapter],
                            [verse.verse]: next,
                        },
                    },
                }
            }
        }
    }

    return Object.entries(bibleMetadata)
        .map(([book, content]) => ({ book, content }))
        .map(({ book, content }) => {
            const validatedBook = bookSchema.parse(book)
            const bookPrestigeCount = Math.min(
                ...content.chapters.map(
                    ({ length: chapterLength }, chapterIndex) => {
                        const typedVerses =
                            bookVerses[validatedBook]?.[chapterIndex + 1]
                        const prestigeCount =
                            typedVerses == null
                                ? 0
                                : Object.keys(typedVerses).length <
                                    chapterLength
                                  ? 0
                                  : Math.min(...Object.values(typedVerses))
                        return prestigeCount
                    },
                ),
            )
            return { book, content, bookPrestigeCount }
        })
        .map(({ book, content, bookPrestigeCount }) => {
            const validatedBook = bookSchema.parse(book)
            let totalVersesCount = 0
            let typedVersesInPrestige = 0
            return {
                book,
                chapters: content.chapters.map(
                    ({ length: chapterLength }, chapterIndex) => {
                        const typedVerses =
                            bookVerses[validatedBook]?.[chapterIndex + 1]
                        const numberOfTypedVerses = Object.keys(
                            typedVerses ?? {},
                        ).length
                        const prestigeCount =
                            typedVerses == null
                                ? 0
                                : Object.keys(typedVerses).length <
                                    chapterLength
                                  ? 0
                                  : Math.min(...Object.values(typedVerses))
                        const numberOfTypedVersesInPrestige = Math.min(
                            numberOfTypedVerses -
                                bookPrestigeCount * chapterLength,
                            chapterLength,
                        )
                        totalVersesCount += chapterLength
                        typedVersesInPrestige += numberOfTypedVersesInPrestige
                        return {
                            chapter: chapterIndex + 1,
                            verses: chapterLength,
                            typedVerses: numberOfTypedVersesInPrestige,
                            percentage: Math.round(
                                (numberOfTypedVersesInPrestige /
                                    chapterLength) *
                                    100,
                            ),
                            prestige: prestigeCount,
                            alt:
                                Math.floor(
                                    (numberOfTypedVersesInPrestige /
                                        chapterLength) *
                                        10000,
                                ) / 100,
                        }
                    },
                ),
                label: passageReferenceSchema.parse(
                    toPluralBookForm(validatedBook),
                ),
                prestige: bookPrestigeCount,
                typedVerses: typedVersesInPrestige,
                verses: totalVersesCount,
                percentage: Math.round(
                    (typedVersesInPrestige / totalVersesCount) * 100,
                ),
                alt:
                    Math.floor(
                        (typedVersesInPrestige / totalVersesCount) * 10000,
                    ) / 100,
            }
        })
        .filter(book => book.alt !== 0 || book.prestige >= 0)
}
