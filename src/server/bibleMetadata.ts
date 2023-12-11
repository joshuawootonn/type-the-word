import { z } from 'zod'

import metadata from './bible-metadata.json'
import { bookSchema } from '~/lib/types/book'

const bibleMetadataSchema = z.record(
    z.enum(bookSchema.options),
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
