'use client'

import { api } from '~/utils/api'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { AppRouter, appRouter } from '~/server/api/root'
import superjson from 'superjson'
import { db } from '~/server/db'
import { Navigation } from '~/components/navigation'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { Loading } from '~/components/loading'
import { PassageSelector } from '~/components/passageSelector'
import {
    PassageReference,
    passageReferenceSchema,
} from '~/lib/passageReference'
import Link from 'next/link'
import { Metadata } from 'next'

// export const DEFAULT_PASSAGE_REFERENCE = 'psalm_23'
//
// export async function getStaticProps() {
//     const helpers = createServerSideHelpers<AppRouter>({
//         router: appRouter,
//         ctx: {
//             session: null,
//             db,
//             repositories: {
//                 typingSession: new TypingSessionRepository(db),
//             },
//         },
//         transformer: superjson,
//     })
//
//     // todo: ideally I wouldn't be saving these to the database, but the `savePassageResponseToDatabase` option has to match the input of the client or there is no server optimization
//     await helpers.passage.passage.prefetch({
//         reference: passageReferenceSchema.parse(DEFAULT_PASSAGE_REFERENCE),
//         savePassageResponseToDatabase: true,
//     })
//
//     return { props: { trpcState: helpers.dehydrate() } }
// }

export const metadata: Metadata = {
    title: 'Type the Word',
    description:
        "A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word.",
}

export default function Passage(props: { passage?: PassageReference }) {
    // const value =
    //     props.passage ?? passageReferenceSchema.parse(DEFAULT_PASSAGE_REFERENCE)
    // const passage = api.passage.passage.useQuery({
    //     reference: value,
    //     savePassageResponseToDatabase: true,
    // })

    return (
        <>
            passage content
            {/* <main className="relative mx-auto w-full flex-grow"> */}
            {/*     {router.isFallback || passage.isLoading ? ( */}
            {/*         <Loading /> */}
            {/*     ) : passage.error ? ( */}
            {/*         <>We hit a whoopsie! :(</> */}
            {/*     ) : ( */}
            {/*         <Passage */}
            {/*             autofocus={true} */}
            {/*             passage={passage.data} */}
            {/*             key={JSON.stringify(passage.data)} */}
            {/*         /> */}
            {/*     )} */}
            {/*     <div className="mb-24 mt-8 flex w-full justify-between"> */}
            {/*         {passage.data?.prevChapter ? ( */}
            {/*             <Link */}
            {/*                 href={`/passage/${passage.data.prevChapter.url}`} */}
            {/*                 className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white" */}
            {/*             > */}
            {/*                 {passage.data.prevChapter.label} */}
            {/*             </Link> */}
            {/*         ) : ( */}
            {/*             <div /> */}
            {/*         )} */}
            {/*         {passage.data?.nextChapter ? ( */}
            {/*             <Link */}
            {/*                 href={`/passage/${passage.data.nextChapter.url}`} */}
            {/*                 className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white" */}
            {/*             > */}
            {/*                 {passage.data.nextChapter.label} */}
            {/*             </Link> */}
            {/*         ) : ( */}
            {/*             <div /> */}
            {/*         )} */}
            {/*     </div> */}
            {/* </main> */}
        </>
    )
}
