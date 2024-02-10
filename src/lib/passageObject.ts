// todo: shitty name but I got nothing

import { z } from 'zod'
import { getBibleMetadata } from '~/server/bibleMetadata'
import { bookSchema } from '~/lib/types/book'

export const passageObjectSchema = z.object({
    book: bookSchema,
    chapter: z.number(),
    firstVerse: z.number().optional(),
    lastVerse: z.number().optional(),
})

export type PassageObject = z.infer<typeof passageObjectSchema>

export const stringToPassageObject = z.string().transform(text => {
    const trimmedText = text.trim().toLowerCase()

    const includesVerses = trimmedText.includes(':')
    const includesRangeOfVerses = includesVerses && trimmedText.includes('-')

    const bookText = Array.from(
        trimmedText.matchAll(/([0-9])*([A-Za-z ])+(?!([0-9:]))/g),
        m => m[0],
    )?.at(0)

    const book = bookText?.split(' ').join('_')

    const textWithoutBook = trimmedText.replace(bookText ?? '', '')

    const chapter = parseInt(
        Array.from(textWithoutBook.matchAll(/([0-9])+/g), m => m[0])
            .at(0)
            ?.trim() ?? '1',
    )
    const textWithoutChapter = textWithoutBook.replace(chapter.toString(), '')

    const verseText = Array.from(
        textWithoutChapter.matchAll(/([0-9\-])+/g),
        m => m[0],
    )
        .at(-1)
        ?.trim()

    if (book === undefined) throw new Error(`Could not parse book from ${text}`)

    const bookResult = bookSchema.safeParse(book)
    if (!bookResult.success) {
        throw new Error(
            `Could not parse book from ${text}. Book was found to be ${book} but ${bookResult.error.message}.`,
        )
    }

    const metadata = getBibleMetadata()

    try {
        if (includesRangeOfVerses) {
            const verses = verseText?.split('-')
            const firstVerse = z.number().parse(parseInt(verses?.at(0) ?? ''))
            const lastVerse = z.number().parse(parseInt(verses?.at(-1) ?? ''))

            return passageObjectSchema.parse({
                book: bookResult.data,
                chapter: chapter,
                firstVerse,
                lastVerse,
            })
        }

        if (includesVerses) {
            const verse = z.number().parse(parseInt(verseText ?? ''))

            return passageObjectSchema.parse({
                book: bookResult.data,
                chapter: chapter,
                firstVerse: verse,
                lastVerse: verse,
            })
        }
    } catch (e) {
        console.log(
            'Failed to parse passage in url. Falling back to full chapter',
        )
    }
    return passageObjectSchema.parse({
        book: bookResult.data,
        chapter: chapter,
        firstVerse: chapter ? 1 : undefined,
        lastVerse: chapter
            ? metadata[bookResult.data]?.chapters?.at(chapter - 1)?.length
            : undefined,
    })
})
