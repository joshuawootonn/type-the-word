import { ParsedPassage } from './parseEsv'
import { PassageSegment } from './passageSegment'

export type Body<T> = { data: T }

export async function fetchPassage(
    value: PassageSegment,
): Promise<ParsedPassage> {
    const response = await fetch(
        `http://localhost:3000/api/passage/?reference=${value}`,
    )

    const body: Body<ParsedPassage> = await response.json()

    return body.data
}
