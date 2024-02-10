import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { Footer } from '~/components/footer'
import { format } from 'date-fns'

function Link({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            className="svg-outline-sm relative cursor-pointer no-underline outline-none"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    )
}

function DateComponent({ date }: { date: Date }) {
    return (
        <time
            className={'font-bold text-black dark:text-white'}
            dateTime={format(date, 'yyyy-MM-dd')}
        >
            {format(date, 'LLLL do')}
        </time>
    )
}

export default function Changelog() {
    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word - Changelog</title>
                <meta
                    name="description"
                    content="All the changes happening in your favorite typing game"
                />
                <meta
                    property="og:image"
                    content="https://typetheword.site/api/og/changelog"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />

            <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg dark:prose-invert lg:pt-8">
                <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                    <div className="mb-10 flex items-center justify-between">
                        <h1 className="m-0">Changelog</h1>
                        <span>
                            (Updated{' '}
                            <DateComponent date={new Date('2/9/2024')} />)
                        </span>
                    </div>
                    <p>New updates and improvements to Type the Word</p>
                    <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />
                    <ul>
                        <li>
                            <DateComponent date={new Date('2/9/2024')} /> -{' '}
                            Update the <code>/history</code> page with an
                            overview section to see what passages you've typed.
                            <div className="px-8 pb-8 pt-4">
                                <video
                                    className="m-0 rounded-lg"
                                    autoPlay={true}
                                    playsInline
                                    muted
                                    loop
                                    style={{
                                        maxWidth: '100%',
                                    }}
                                >
                                    <source
                                        src={'/assets/overview-section-3.mp4'}
                                    />
                                </video>
                            </div>
                        </li>
                        <li>
                            <DateComponent date={new Date('2/6/2024')} />
                            <ul>
                                <li>
                                    Updated the passage selection state to work
                                    with native browser navigation.
                                </li>
                                <li>Created this changelog</li>
                            </ul>
                        </li>
                        <li>
                            <DateComponent date={new Date('1/15/2024')} /> -{' '}
                            Wrote{' '}
                            <Link
                                href={
                                    'https://www.joshuawootonn.com/type-the-word'
                                }
                            >
                                a blog post
                            </Link>{' '}
                            about all the little details
                        </li>
                        <li>
                            <DateComponent date={new Date('12/20/2023')} /> -
                            Added Dark Mode (Thanks to{' '}
                            <Link
                                href={
                                    'https://github.com/joshuawootonn/type-the-word/pull/2'
                                }
                            >
                                @IsaacHatton
                            </Link>
                            )
                        </li>
                        <li>
                            <DateComponent date={new Date('12/19/2023')} /> -{' '}
                            <Link
                                href={
                                    'https://github.com/joshuawootonn/type-the-word/commit/bbe35e3e3a669679f7a8669fc7cc568ffc78e50f'
                                }
                            >
                                Added smooth scrolling
                            </Link>
                            <div className="px-8 pb-8 pt-4">
                                <video
                                    className="m-0 rounded-lg"
                                    autoPlay={true}
                                    playsInline
                                    muted
                                    loop
                                    style={{
                                        maxWidth: '100%',
                                    }}
                                >
                                    <source
                                        src={'/assets/smooth-scrolling.mp4'}
                                    />
                                </video>
                            </div>
                        </li>
                        <li>
                            <DateComponent date={new Date('12/15/2023')} /> -
                            Released Type the Word
                        </li>
                    </ul>
                </div>
            </main>
            <Footer />
        </div>
    )
}
