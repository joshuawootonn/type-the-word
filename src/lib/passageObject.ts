// todo: shitty name but I got nothing

import { z } from 'zod'
import { getBibleMetadata } from '~/server/bibleMetadata'
import { bookSchema } from '~/lib/types/book'

export const passageObjectSchema = z.object({
    book: bookSchema,
    chapter: z.number().optional(),
    verses: z.number().optional(),
})

export type PassageObject = z.infer<typeof passageObjectSchema>

export const stringToPassageObject = z.string().transform(text => {
    const trimmedText = text.trim().toLowerCase()
    const book = Array.from(
        trimmedText.matchAll(/([0-9])*([A-Za-z ])+(?!([0-9:]))/g),
        m => m[0],
    )
        ?.at(0)
        ?.split(' ')
        .join('_')
    const chapter = parseInt(
        Array.from(
            trimmedText.matchAll(/(?<=[0-9a-zA-Z]) ([0-9: -])*/g),
            m => m[0],
        )
            .at(-1)
            ?.trim() ?? '1',
    )

    if (book === undefined) throw new Error(`Could not parse book from ${text}`)

    const bookResult = bookSchema.safeParse(book)
    if (!bookResult.success) {
        throw new Error(
            `Could not parse book from ${text}. Book was found to be ${book} but ${bookResult.error.message}.`,
        )
    }

    const metadata = getBibleMetadata()

    return passageObjectSchema.parse({
        book: bookResult.data,
        chapter: chapter,
        verses: chapter
            ? metadata[bookResult.data]?.chapters?.at(chapter - 1)?.length
            : undefined,
    })
})