import { env } from '~/env.mjs'
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

    return await fetch(
        new URL(`/api/og?${search.toString()}`, env.DEPLOYED_URL),
    )
}
