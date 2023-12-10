import { z } from 'zod'
import { typedVerses } from '~/server/db/schema'

import metadata from './bible-metadata.json'

const bibleMetadataSchema = z.record(
    z.enum(typedVerses.book.enumValues),
    z.object({
        chapters: z.array(z.object({ length: z.number() })),
        testament: z.enum(['OT', 'NT']),
        name: z.string(),
    }),
)
type BibleMetadata = z.infer<typeof bibleMetadataSchema>

export function getBibleMetadata(): BibleMetadata {
    return bibleMetadataSchema.parse(metadata)
}
