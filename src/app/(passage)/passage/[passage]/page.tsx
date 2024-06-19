import { PassageReference } from '~/lib/passageReference'
import { Metadata } from 'next'
import { ParsedPassage } from '~/lib/parseEsv'
import { Passage } from '~/components/passage'
import { DEFAULT_PASSAGE_REFERENCE } from './default-passage'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Type the Word',
    description:
        "A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

type Body<T> = { data: T }

export default async function PassagePage(props: {
    params: { passage?: PassageReference }
}) {
    const value = props.params.passage ?? DEFAULT_PASSAGE_REFERENCE

    const response = await fetch(
        `http://localhost:3000/api/passage/?reference=${value}`,
    )

    const body: Body<ParsedPassage> = await response.json()

    return (
        <>
            <Passage autofocus={true} passage={body.data} />
            <div className="mb-24 mt-8 flex w-full justify-between">
                {body.data?.prevChapter ? (
                    <Link
                        href={`/passage/${body.data.prevChapter.url}`}
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white"
                    >
                        {body.data.prevChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
                {body.data?.nextChapter ? (
                    <Link
                        href={`/passage/${body.data.nextChapter.url}`}
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white"
                    >
                        {body.data.nextChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
            </div>
        </>
    )
}
