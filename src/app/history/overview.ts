import { passageReferenceSchema } from '~/lib/passageReference'
import { Book, bookSchema } from '~/lib/types/book'
import { BookMetadata, getBibleMetadata } from '~/server/bibleMetadata'
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
}

export type BookOverview = {
    book: string
    label: string
    prestige: number
    percentage: number
    chapters: ChapterOverview[]
    verses: number
    typedVerses: number
}

type AggregatedChapterData = {
    typedVersesInCurrentPrestige: number
    totalVerses: number
    verses: Record<number, boolean>
}

type AggregatedBookData = {
    prestige: number
    typedVersesInCurrentPrestige: number
    totalVerses: number
    chapters: Record<number, AggregatedChapterData>
}

type AggregatedData = Record<
    (typeof bookSchema.options)[number],
    AggregatedBookData
>

function getInitialAggregatedBookData(
    bookData: BookMetadata,
    prestige = 0,
): AggregatedBookData {
    return {
        prestige,
        typedVersesInCurrentPrestige: 0,
        totalVerses: bookData.chapters.reduce(
            (acc, chapter) => acc + chapter.length,
            0,
        ),
        chapters: bookData.chapters.reduce(
            (acc, chapter, i) => ({
                ...acc,
                [i + 1]: {
                    typedVersesInCurrentPrestige: 0,
                    totalVerses: chapter.length,
                    verses: {},
                },
            }),
            {} as Record<number, AggregatedChapterData>,
        ),
    }
}

export function aggregateBookData(
    typingSessions: TypingSession[],
): AggregatedData {
    const bibleMetadata = getBibleMetadata()

    let bookData: AggregatedData = Object.entries(bibleMetadata).reduce(
        (acc, [book, bookData]) => ({
            ...acc,
            [book]: getInitialAggregatedBookData(bookData),
        }),
        {} as AggregatedData,
    )

    const chronologicalTypingSessions = typingSessions.slice().reverse()

    for (const typingSession of chronologicalTypingSessions) {
        for (const typedVerse of typingSession.typedVerses) {
            const bookIsPerfectlyPrestiged = Object.values(
                bookData[typedVerse.book].chapters,
            ).every(
                book => book.typedVersesInCurrentPrestige >= book.totalVerses,
            )

            if (bookIsPerfectlyPrestiged) {
                bookData = {
                    ...bookData,
                    [typedVerse.book]: getInitialAggregatedBookData(
                        bibleMetadata[typedVerse.book]!,
                        bookData[typedVerse.book].prestige,
                    ),
                }
            }
            const book = bookData[typedVerse.book]

            const chapter = book.chapters[typedVerse.chapter]!

            const nextChapterVerses = {
                ...chapter.verses,
                [typedVerse.verse]: true,
            }

            const nextNumberOfVerses = Object.values(nextChapterVerses).length

            const nextChapter = {
                ...chapter,
                verses: nextChapterVerses,
                typedVersesInCurrentPrestige: nextNumberOfVerses,
            }
            const nextBookChapters = {
                ...book.chapters,
                [typedVerse.chapter]: nextChapter,
            }

            const nextBook = {
                ...book,
                prestige: book.prestige,
                chapters: nextBookChapters,
                typedVersesInCurrentPrestige: Object.values(
                    nextBookChapters,
                ).reduce(
                    (sum, chapter) =>
                        sum + chapter.typedVersesInCurrentPrestige,
                    0,
                ),
            }

            const prestigingBook = Object.values(nextBook.chapters).every(
                book => book.typedVersesInCurrentPrestige >= book.totalVerses,
            )

            if (prestigingBook) {
                bookData = {
                    ...bookData,
                    [typedVerse.book]: {
                        ...book,
                        prestige: book.prestige + 1,
                        chapters: nextBookChapters,
                        typedVersesInCurrentPrestige: 0,
                    },
                }
            } else {
                bookData = {
                    ...bookData,
                    [typedVerse.book]: nextBook,
                }
            }

            // if (typedVerse.book === Book['2_timothy']) {
            //     console.log(
            //         bookData[typedVerse.book].totalVerses,
            //         'book',
            //         `${typedVerse.chapter}:${typedVerse.verse}  `,
            //     )
            // }
        }
    }
    return bookData
}

export function formatBookData(bookData: AggregatedData): BookOverview[] {
    const bibleMetadata = getBibleMetadata()
    const result = Object.keys(bibleMetadata)
        .map(bookSlug => {
            const validatedBook = bookSchema.parse(bookSlug)
            const book = bookData[validatedBook]

            if (book == null) return null

            return {
                book: bookSlug,
                chapters: Object.entries(book.chapters).map(
                    ([chapter, chapterData]) => {
                        return {
                            chapter: parseInt(chapter),
                            verses: chapterData.totalVerses,
                            typedVerses:
                                chapterData.typedVersesInCurrentPrestige,
                            percentage: Math.round(
                                (chapterData.typedVersesInCurrentPrestige /
                                    chapterData.totalVerses) *
                                    100,
                            ),
                            alt:
                                Math.floor(
                                    (chapterData.typedVersesInCurrentPrestige /
                                        chapterData.totalVerses) *
                                        10000,
                                ) / 100,
                        }
                    },
                ),
                label: passageReferenceSchema.parse(
                    toPluralBookForm(validatedBook),
                ),
                prestige: book.prestige,
                typedVerses: book.typedVersesInCurrentPrestige,
                verses: book.totalVerses,
                percentage:
                    Math.floor(
                        (book.typedVersesInCurrentPrestige / book.totalVerses) *
                            10000,
                    ) / 100,
            }
        })
        .filter(
            (book: BookOverview | null): book is BookOverview =>
                book != null && (book.percentage !== 0 || book.prestige > 0),
        ) as BookOverview[]

    return result
}

export function getBookOverview(
    typingSessions: TypingSession[],
): BookOverview[] {
    const bookData = aggregateBookData(typingSessions)
    return formatBookData(bookData)
}
