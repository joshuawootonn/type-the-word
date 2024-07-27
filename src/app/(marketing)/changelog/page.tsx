import { format } from 'date-fns'
import { Metadata } from 'next'
import Image from 'next/image'
import { UpdateLastVisitedChangelog } from './update-last-visited-changelog'
import { changelogUpdatedAt } from './updated-at'

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

export const metadata: Metadata = {
    title: 'Type the Word - Changelog',
    description:
        'All the product changes happening to Type the Word. A typing practice tool that tracks your progress through the Bible.',
}

export default function Changelog() {
    return (
        <div className={'prose-h2:text-3xl prose-p:text-xl'}>
            <div className="mb-10 flex items-center justify-between">
                <h1 className="m-0">Changelog</h1>
                <span>
                    (Updated <DateComponent date={changelogUpdatedAt} />)
                </span>
            </div>
            <UpdateLastVisitedChangelog />
            <p>New updates and improvements to Type the Word</p>
            <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />
            <ul>
                <li>
                    <DateComponent date={new Date('7/27/2024')} /> - Fixed bug
                    in next chapter button when on the second from last chapter
                    of a book. The next chapter button was linking the next book
                    rather than the last chapter. This link now points to the
                    last chapter.
                </li>
                <li>
                    <DateComponent date={new Date('7/11/2024')} /> - Added a
                    twinkle animation to notify users when there are new updates
                    in the changelog.
                    <Image
                        src={'/assets/changelog-twinkle.png'}
                        alt={
                            'Small animation in the footer notifying the user that there have been updates to Type the Word.'
                        }
                        className="mt-1"
                        width={2232}
                        height={402}
                    />
                    The changelog is one of the ways I communicate with you all
                    as things change. This twinkle animation will be present
                    therenotifying you that there are new updates to read.
                    Visiting the <code>/changelog</code> page dismisses this
                    notification.
                </li>
                <li>
                    <DateComponent date={new Date('7/07/2024')} /> - Updated
                    Type the Word to remember where you last typed.
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
                            <source src={'/assets/remember-last-chapter.mp4'} />
                        </video>
                    </div>
                    <ul>
                        <li>
                            When you are logged in and load the{' '}
                            <Link href="/">home page</Link> (<code>/</code>) TTW
                            redirects you to the last location you typed.{' '}
                        </li>
                        <li>
                            You can also navigate to your last typing location
                            by clicking the TTW logo in the header.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('7/7/2024')} /> - Started
                    managing an email list.
                    <br />
                    <br />
                    I&apos;ve had the privilege of emailing many of you
                    individually, but I want to make sure everyone who wants to
                    be is kept up to date with the project. So in addition to
                    having an email in the footer, I&apos;m starting a
                    newsletter that will round up changes in small batches each
                    month. New users are able to join by confirming their email
                    after sign up (which lands them on this{' '}
                    <Link href={'/welcome'}>snazzy new page</Link>
                    .)
                    <br />
                    <br />
                    All current users were opted into the newsletter, but the
                    first issue will have a big unsubscribe button. The last
                    thing I want to be is another leech on your attention.
                </li>
                <li>
                    <DateComponent date={new Date('7/5/2024')} /> - Migrated
                    Type the Word to{' '}
                    <Link href="https://nextjs.org/docs/app">App Router</Link>{' '}
                    and REST.
                    <br />
                    <br />
                    This was a programming update to how Type the Word works.
                    Originally, I built Type the Word on some new tech so that I
                    could try TRPC and Axiom. Now that it&apos;s growing, I have
                    migrated to more stable platforms to lower the maintenance
                    burden. I am using REST for network communication and Sentry
                    for debugging.
                    <ul>
                        <li>
                            You may have noticed some short outages around this
                            time! Sorry for the disruption. I don&apos;t think
                            there will be{' '}
                            <Link href="https://github.com/joshuawootonn/type-the-word/pull/7">
                                this big
                            </Link>{' '}
                            of an architectural change again.
                        </li>
                        <li>
                            Type the Word is open source. If you are ever
                            curious to see how it works, check out the{' '}
                            <Link href=" https://github.com/joshuawootonn/type-the-word">
                                Github repo here.
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('6/17/2024')} /> - Fix: At
                    some point I broke the ability to access 2 Timothy 😅. 2
                    Timothy is now accessible!{' '}
                </li>
                <li>
                    <DateComponent date={new Date('6/16/2024')} /> - Add links
                    for easily navigating to the previous and next passages.
                    <Image
                        src={'/assets/prev-next-links.png'}
                        alt={
                            'The two links at the end of each passage that make navigation easier'
                        }
                        width={1438}
                        height={612}
                    />
                </li>
                <li>
                    <DateComponent date={new Date('6/04/2024')} />
                    <ul>
                        <li>
                            Remove restriction preventing you from backspacing
                            through correct words. This update makes getting
                            100% accuracy still possible when you have a missed
                            typo.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('2/15/2024')} />
                    <ul>
                        <li>
                            Fix a bug where you couldn&apos;t complete a verse
                            without logging in.
                        </li>
                        <li>
                            Fix the flicker that could happen when completing a
                            verse.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('2/15/2024')} /> - Add some
                    much needed database indexes to speed up the history page.
                    <Image
                        src={'/assets/adding-indexes-for-history-page.png'}
                        alt={
                            'Two devtools of the before and after of adding indexes to the history page'
                        }
                        width={1505}
                        height={1548}
                    />
                </li>

                <li>
                    <DateComponent date={new Date('2/9/2024')} /> - Update the{' '}
                    <code>/history</code> page with an overview section to see
                    what passages you&apos;ve typed.
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
                            <source src={'/assets/overview-section-3.mp4'} />
                        </video>
                    </div>
                    <ul>
                        <li>
                            Fixed weird gap in <i>typed</i> indicator in
                            sections that have quotes like{' '}
                            <Link href={'/passage/hebrews_2'}>Hebrews 2</Link>{' '}
                            verse 13.
                        </li>
                        <li>
                            Fixed the small animation happening between{' '}
                            <code>/passage</code> pages and other pages
                        </li>
                        <li>
                            Fixed flicker that would happen on completing verses
                        </li>
                        <li>
                            Tweaked cursor animation logic to disable vertical
                            cursor animation, but animate for longer words that
                            are completed to early.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('2/6/2024')} />
                    <ul>
                        <li>
                            Updated the passage selection state to work with
                            native browser navigation.
                        </li>
                        <li>Created this changelog</li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('1/15/2024')} /> - Wrote{' '}
                    <Link href={'https://www.joshuawootonn.com/type-the-word'}>
                        a blog post
                    </Link>{' '}
                    about all the little details
                </li>
                <li>
                    <DateComponent date={new Date('12/20/2023')} /> - Added Dark
                    Mode (Thanks to{' '}
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
                            <source src={'/assets/smooth-scrolling.mp4'} />
                        </video>
                    </div>
                </li>
                <li>
                    <DateComponent date={new Date('12/15/2023')} /> - Released
                    Type the Word
                </li>
            </ul>
        </div>
    )
}
