import { z } from 'zod'

export const passageReferenceSchema = z
    .string()
    .transform(s => s.split(' ').join('_').toLowerCase())
    .brand('PassageReference')

export type PassageReference = z.infer<typeof passageReferenceSchema>

export function toPassageUrl(book: string, chapter: string) {
    return passageReferenceSchema.parse(`${book} ${chapter}`)
}
