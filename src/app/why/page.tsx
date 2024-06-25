import { Passage } from '~/components/passage'
import Link from 'next/link'
import { EmailLink } from '~/components/emailLink'
import { fetchPassage } from '~/lib/api'
import { passageSegmentSchema } from '~/lib/passageSegment'
import { ParsedPassage } from '~/lib/parseEsv'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Why I created Type the Word',
    description:
        'Why did I create Type the Word? Why should we meditate on the Bible?',
}

// property="og:image"
// content="https://typetheword.site/api/og?"

export default async function Home() {
    const passages: [
        ParsedPassage,
        ParsedPassage,
        ParsedPassage,
        ParsedPassage,
        ParsedPassage,
        ParsedPassage,
        ParsedPassage,
    ] = await Promise.all([
        fetchPassage(passageSegmentSchema.parse('john 8:31-32')),
        fetchPassage(passageSegmentSchema.parse('deuteronomy 17:18-20')),
        fetchPassage(passageSegmentSchema.parse('joshua 1:8')),
        fetchPassage(passageSegmentSchema.parse('psalm 1:1-3')),
        fetchPassage(passageSegmentSchema.parse('matthew 4:4')),
        fetchPassage(passageSegmentSchema.parse('psalm 119:9-11')),
        fetchPassage(passageSegmentSchema.parse('psalm 19:7-11')),
    ])

    return (
        <>
            <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                <h1>Why?</h1>
                <hr className="mx-0 w-full border-t-2  border-black dark:border-white" />
                <h2>Why did I make typetheword.site?</h2>
                <p>
                    A couple of years ago, I typed out Psalms 1 to 137 over a 6
                    month period. Not only did this improve my typing, but it
                    also encouraged me daily. When I later discovered{' '}
                    <a
                        href={'https://monkeytype.com'}
                        className="svg-outline-sm relative"
                    >
                        monkeytype
                    </a>
                    , it made sense to combine the two ideas. Typing the Bible
                    makes you look at every word and see the passage anew. When
                    I was developing this site, I used{' '}
                    <Link
                        href={'/passage/john_11:34-36'}
                        className="svg-outline-sm relative dark:text-white"
                    >
                        John 11:35
                    </Link>{' '}
                    as the edgecase since its the shortest verse in the Bible.
                    Typing it over and over made me realize that Jesus wept
                    because he loved Lazarus. He died for us because he loves us
                    with the same love.
                    <br />
                    <br />
                    My hope is that by typing the word you will also see the
                    Bible in a deeper way.
                </p>
                <hr className="mx-0 w-full border-t-2  border-black dark:border-white" />
                <h2>Why meditate on God&apos;s word?</h2>
                <p>
                    In the process of making typetheword.site, these scriptures
                    were great reminders of why we should meditate on God&apos;s
                    word. If you have others, feel free to{' '}
                    <EmailLink className="svg-outline-sm underline">
                        email me
                    </EmailLink>
                    . I would love to make this page a long list of all the
                    scripture pointing to why we should meditate on God&apos;s
                    word.
                </p>
            </div>
            <div className={'prose-h2:text-2xl'}>
                <Passage
                    autofocus={false}
                    autoSelect={false}
                    passage={passages[0]}
                    key={JSON.stringify(passages[0])}
                />
                <Passage
                    autofocus={false}
                    autoSelect={false}
                    passage={passages[1]}
                    key={JSON.stringify(passages[1])}
                />
                <Passage
                    autofocus={false}
                    autoSelect={false}
                    passage={passages[2]}
                    key={JSON.stringify(passages[2])}
                />
                <Passage
                    autofocus={false}
                    autoSelect={false}
                    passage={passages[3]}
                    key={JSON.stringify(passages[3])}
                />
                <Passage
                    autofocus={false}
                    autoSelect={false}
                    passage={passages[4]}
                    key={JSON.stringify(passages[4])}
                />
                <Passage
                    autofocus={false}
                    autoSelect={false}
                    passage={passages[5]}
                    key={JSON.stringify(passages[5])}
                />
                <Passage
                    autofocus={false}
                    autoSelect={false}
                    passage={passages[6]}
                    key={JSON.stringify(passages[6])}
                />
            </div>
        </>
    )
}
