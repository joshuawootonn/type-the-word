import { z } from 'zod'

export const passageSegmentSchema = z
    .string()
    .transform(s => s.split(' ').join('_').toLowerCase())
    .brand('PassagSegment')

export type PassageSegment = z.infer<typeof passageSegmentSchema>

export function toPassageSegment(book: string, chapter: string | number) {
    return passageSegmentSchema.parse(`${book}_${chapter}`)
}
