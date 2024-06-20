import { z } from 'zod'

export const passageSegmentSchema = z
    .string()
    .transform(s => s.split(' ').join('_').toLowerCase())
    .brand('PassagUrl')

export type PassageSegment = z.infer<typeof passageSegmentSchema>

export function toPassageSegment(book: string, chapter: string) {
    return passageSegmentSchema.parse(`${book}_${chapter}`)
}
