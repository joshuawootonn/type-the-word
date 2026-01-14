import { env } from '~/env.mjs'
import { passageSegmentSchema } from '~/lib/passageSegment'

export const runtime = 'edge'

export const contentType = 'image/png'

export default async function Image({
    params,
}: {
    params: Promise<{ passage: string }>
}) {
    const { passage } = await params
    const search = new URLSearchParams()
    if (passage) {
        search.set('passage', passageSegmentSchema.parse(passage))
    }

    return await fetch(
        new URL(`/api/og?${search.toString()}`, env.DEPLOYED_URL),
    )
}
