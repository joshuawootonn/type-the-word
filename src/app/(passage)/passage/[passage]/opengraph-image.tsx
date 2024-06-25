import { passageSegmentSchema } from '~/lib/passageSegment'

export const runtime = 'edge'

export const contentType = 'image/png'

export default async function Image({
    params,
}: {
    params: { passage: string }
}) {
    const search = new URLSearchParams()
    if (params.passage) {
        search.set('passage', passageSegmentSchema.parse(params.passage))
    }
    return await fetch(`https://typetheword.site/api/og?${search.toString()}`)
}
