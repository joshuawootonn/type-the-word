import { passageReferenceSchema } from '~/lib/passageReference'
import { Book, bookSchema } from '~/lib/types/book'
import { getBibleMetadata } from '~/server/bibleMetadata'
import {
    TypingSession,
    TypedVerse,
} from '~/server/repositories/typingSession.repository'

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
}

export type BookOverview = {
    book: string
    label: string
    percentage: number
    chapters: ChapterOverview[]
}

export function getBookOverview(
    typingSessions: TypingSession[],
): BookOverview[] {
    const bibleMetadata = getBibleMetadata()

    let bookVerses: Record<
        Partial<(typeof bookSchema.options)[number]>,
        Record<number, Record<number, TypedVerse>>
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
                bookVerses = {
                    ...bookVerses,
                    [verse.book]: {
                        ...bookVerses[verse.book],
                        [verse.chapter]: {
                            ...bookVerses[verse.book][verse.chapter],
                            [verse.verse]: verse,
                        },
                    },
                }
            }
        }
    }

    return Object.entries(bibleMetadata).map(([book, content]) => {
        const validatedBook = bookSchema.parse(book)
        let totalVersesCount = 0
        let typedVersesCount = 0
        return {
            book,
            chapters: content.chapters.map(
                ({ length: chapterLength }, chapterIndex) => {
                    const typedVerses =
                        bookVerses[validatedBook]?.[chapterIndex + 1]
                    const numberOfTypedVerses = Object.keys(
                        typedVerses ?? {},
                    ).length
                    totalVersesCount += chapterLength
                    typedVersesCount += numberOfTypedVerses
                    return {
                        chapter: chapterIndex + 1,
                        verses: chapterLength,
                        typedVerses: numberOfTypedVerses,
                        percentage: Math.round(
                            (numberOfTypedVerses / chapterLength) * 100,
                        ),
                        alt:
                            Math.floor(
                                (numberOfTypedVerses / chapterLength) * 10000,
                            ) / 100,
                    }
                },
            ),
            label: passageReferenceSchema.parse(
                toPluralBookForm(validatedBook),
            ),
            percentage: Math.round((typedVersesCount / totalVersesCount) * 100),
            alt:
                Math.floor((typedVersesCount / totalVersesCount) * 10000) / 100,
        }
    })
}
