import { z } from 'zod'

import metadata from './bible-metadata.json'
import { bookSchema } from '~/lib/types/book'

const bookMetadataSchema = z.object({
    chapters: z.array(z.object({ length: z.number() })),
    testament: z.enum(['OT', 'NT']),
    name: z.string(),
})

export type BookMetadata = z.infer<typeof bookMetadataSchema>

const bibleMetadataSchema = z.record(
    z.enum(bookSchema.options),
    bookMetadataSchema,
)
export type BibleMetadata = z.infer<typeof bibleMetadataSchema>

export function getBibleMetadata(): BibleMetadata {
    return bibleMetadataSchema.parse(metadata)
}
