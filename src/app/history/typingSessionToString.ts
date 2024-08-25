import toProperCase from '~/lib/toProperCase'
import { getBibleMetadata } from '~/server/bibleMetadata'
import { TypedVerse } from '~/server/repositories/typingSession.repository'

export function typingSessionToString(
    typedVerses: TypedVerse[],
    { seperator }: { seperator?: string } = { seperator: ',' },
) {
    const bibleMetadata = getBibleMetadata()

    const books = Array.from(new Set(typedVerses.map(verse => verse.book)))
        .sort(function (a, b) {
            const biblicalOrder = Object.keys(bibleMetadata)

            const aIndex = biblicalOrder.findIndex(book => book === a)
            const bIndex = biblicalOrder.findIndex(book => book === b)

            if (aIndex === -1 || bIndex === -1) {
                throw new Error('Book not found in typing session to string')
            }

            return aIndex - bIndex
        })
        .map(book => {
            const typedVersesInThisBook = typedVerses.filter(
                verse => verse.book === book,
            )

            const chapters: Record<number, number[]> = {}

            typedVersesInThisBook.forEach(verse => {
                chapters[verse.chapter] = [
                    ...(chapters[verse.chapter] ?? []),
                    verse.verse,
                ]
            })

            const chaptersString = Object.entries(chapters)

                .map(([chapter, verses]) => {
                    const uniqueVerses = Array.from(new Set(verses)).sort(
                        function (a, b) {
                            return a - b
                        },
                    )

                    if (
                        bibleMetadata[book]?.chapters?.at(parseInt(chapter) - 1)
                            ?.length === uniqueVerses.length
                    ) {
                        return chapter
                    }

                    const sortedVerseSegments = uniqueVerses.reduce<number[][]>(
                        (acc, verse) => {
                            const lastNumberInLastSegment = acc?.at(-1)?.at(-1)

                            if (lastNumberInLastSegment === undefined) {
                                return [[verse]]
                            }

                            if (verse === lastNumberInLastSegment + 1) {
                                acc.at(-1)?.push(verse)
                            } else {
                                acc.push([verse])
                            }

                            return acc
                        },
                        [[]],
                    )

                    return `${chapter}:${sortedVerseSegments
                        .map(segment => {
                            if (segment.length === 1) {
                                return segment[0]
                            }
                            return `${segment[0]}-${segment.at(-1)}`
                        })
                        .join(`, `)}`
                })
                .join(`, `)

            return `${toProperCase(
                book.split('_').join(' '),
            )} ${chaptersString}`
        })

    return `${books.join(`${seperator} `)} `
}
