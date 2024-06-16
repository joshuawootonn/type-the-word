import { z } from 'zod'

export const passageUrlSchema = z
    .string()
    .transform(s => s.split(' ').join('_').toLowerCase())
    .brand('PassageReference')

export type PassageReference = z.infer<typeof passageUrlSchema>

export function toPassageUrl(book: string, chapter: string) {
    return passageUrlSchema.parse(`${book}_${chapter}`)
}
