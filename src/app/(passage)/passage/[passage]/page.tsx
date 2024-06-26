import { Metadata } from 'next'
import { Passage } from '~/components/passage'
import { DEFAULT_PASSAGE_SEGMENT } from './default-passage'
import Link from 'next/link'
import { fetchPassage } from '~/lib/api'
import { PassageSegment } from '~/lib/passageSegment'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'Type the Word',
    description:
        "A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

export default async function PassagePage(props: {
    params: { passage?: PassageSegment }
}) {
    if (props.params.passage == null) {
        redirect(`/passage/${DEFAULT_PASSAGE_SEGMENT}`)
    }

    const value = props.params.passage

    const passage = await fetchPassage(value)

    return (
        <>
            <Passage autofocus={true} passage={passage} />
            <div className="mb-24 mt-8 flex w-full justify-between">
                {passage?.prevChapter ? (
                    <Link
                        href={`/passage/${passage.prevChapter.url}`}
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white"
                    >
                        {passage.prevChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
                {passage?.nextChapter ? (
                    <Link
                        href={`/passage/${passage.nextChapter.url}`}
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white"
                    >
                        {passage.nextChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
            </div>
        </>
    )
}
