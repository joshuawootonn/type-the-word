import { format } from 'date-fns'
import { Metadata } from 'next'
import Image from 'next/image'
import { UpdateLastVisitedChangelog } from './update-last-visited-changelog'
import { changelogUpdatedAt } from './updated-at'
import HotkeyLabel from '~/components/hotkey-label'

function Link({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            className="svg-outline-sm relative cursor-pointer whitespace-nowrap no-underline outline-none"
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
            className={'font-bold text-primary '}
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
        <div
            className={
                'marker:text-primary prose-h2:text-3xl prose-p:text-xl prose-a:text-primary prose-kbd:text-primary prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-ul:text-primary prose-li:text-primary'
            }
        >
            <div className="mb-10 flex items-center justify-between">
                <h1 className="m-0">Changelog</h1>
                <span className="text-primary">
                    (Updated <DateComponent date={changelogUpdatedAt} />)
                </span>
            </div>
            <UpdateLastVisitedChangelog />
            <p>New updates and improvements to Type the Word</p>
            <hr className="mx-0 w-full border-t-2 border-primary" />
            <ul>
                <li>
                    <DateComponent date={new Date('12/24/2024')} />
                    <ul>
                        <li>
                            Fixed some parsing issues that prevented typing
                            through{' '}
                            <Link href="/passage/psalm_145">Psalm 145:13</Link>.
                        </li>
                        <li>
                            Fixed an issue where the previous verse button on{' '}
                            <Link href="/passage/titus_1">Titus 1</Link> was
                            pointing to a non existent 2 Timothy 6.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('12/23/2024')} />
                    <ul>
                        <li>
                            Fixed a bug where
                            <HotkeyLabel
                                mac="⌘+⇦"
                                mobile="⌘+⇦"
                                nonMac="⌘+⇦"
                            />{' '}
                            was no longer restarting the verse.
                        </li>
                        <li>
                            Fixed a bug where{' '}
                            <Link href="/passage/romans_16">Romans 16</Link> was
                            mistakenly only showing the first 26 verses.
                        </li>
                        <li>
                            Fixed incorrect spacing in the quote within{' '}
                            <Link href="/passage/matthew_6">
                                Matthew 6:10-13
                            </Link>
                            . This was previously fixed and then reverted.
                            It&apos;s fixed for good now!
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('12/20/2024')} /> - Custom
                    themes are live!
                    <ul>
                        <li>
                            You can now create your own themes for Type the
                            Word.
                            <div className="px-8 pb-4 pt-4">
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
                                        src={
                                            '/assets/themes/creating-changelog.mp4'
                                        }
                                    />
                                </video>
                            </div>
                        </li>
                        <li>
                            Themes are saved in the database and will be
                            available on all devices you are logged in with.
                        </li>
                        <li>
                            When creating a theme, you can minimize the
                            settings, and preview your theme throughout Type the
                            Word, before opening up the Theme Creator again to
                            save it.
                            <div className="px-8 pb-4 pt-4">
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
                                        src={
                                            '/assets/themes/previewing-changelog.mp4'
                                        }
                                    />
                                </video>
                            </div>
                        </li>
                        <li>
                            The &quot;System&quot; theme now allows you to
                            choose what particular light and dark themes you
                            want to use.
                            <div className="px-8 pb-4 pt-4">
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
                                        src={
                                            '/assets/themes/system-changelog.mp4'
                                        }
                                    />
                                </video>
                            </div>
                        </li>
                        <li>
                            And if you match the &quot;Secondary&quot; color and
                            &quot;Success&quot; colors you get this fun
                            disappearing effect.
                            <div className="px-8 pb-4 pt-4">
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
                                        src={
                                            '/assets/themes/mirkwood-changelog.mp4'
                                        }
                                    />
                                </video>
                            </div>
                        </li>
                    </ul>
                    I will be making the best user created themes available by
                    default for everyone, so if you create any themes that you
                    particularly love, share a screenshot in the Discord channel
                    or email me directly. Can&apos;t wait to see what everyone
                    comes up with! 🎨
                </li>{' '}
                <li>
                    <DateComponent date={new Date('12/11/2024')} /> - Fixed a
                    regression where incorrect letters were not highlighted in
                    red.
                </li>{' '}
                <li>
                    <DateComponent date={new Date('11/12/2024')} />
                    <ul>
                        <li>
                            Fixed a bug with backspace (
                            <HotkeyLabel mac="⇦" mobile="⇦" nonMac="⇦" />) where
                            it would delete an entire word. This was a bug in
                            Chrome that would happen after the shortcut for
                            deleting the previous word was used (
                            <HotkeyLabel mac="⌥+⇦" mobile="⌥+⇦" nonMac="^+⇦" />)
                            despite the{' '}
                            <HotkeyLabel mac="⌥" mobile="⌥" nonMac="^" /> being
                            unpressed.{' '}
                        </li>
                        <li>
                            Fixed some incorrect spacing in the quote within{' '}
                            <Link href="/passage/matthew_6">
                                Matthew 6:10-13
                            </Link>
                        </li>
                    </ul>
                </li>{' '}
                <li>
                    <DateComponent date={new Date('11/5/2024')} /> - Fixed a
                    long time bug that prevented access to{' '}
                    <Link href="/passage/song_of_solomon_4">
                        Song of Solomon 4-6{' '}
                    </Link>
                </li>{' '}
                <li>
                    <DateComponent date={new Date('10/13/2024')} /> - Fixed a
                    long time bug where the line indicating what verses you have
                    completed would flicker on verse completion.{' '}
                </li>{' '}
                <li>
                    <DateComponent date={new Date('9/15/2024')} /> - I updated
                    the <Link href="/">home</Link> page with details about how
                    TTW works to improve SEO.
                </li>{' '}
                <li>
                    <DateComponent date={new Date('9/9/2024')} /> - On Windows,
                    the &apos;restart the current verse&apos; keyboard shortcut
                    never actually worked. Thanks for{' '}
                    <Link href="https://discord.com/channels/1197196234595778560/1197196234595778563/1280521079865212939">
                        pointing this out{' '}
                    </Link>
                    @AidenC! You can now restart the current verse on Windows
                    with <HotkeyLabel value="^+⇧+⇦" /> . The MacOS shortcut is
                    still <HotkeyLabel value="⌘+⇦" /> .
                </li>{' '}
                <li>
                    <DateComponent date={new Date('8/25/2024')} />{' '}
                    <ul>
                        <li>
                            Updated the &quot;Log&quot; section{' '}
                            <code>/history</code> so you can more visual see how
                            consistenly you are typing. If there is any summary
                            information you are dying to know. Let me know!
                            <Image
                                src={'/assets/updated-log-v2.png'}
                                alt={'Screen shot of the new "Log" section'}
                                className="mt-3 border-2 border-primary"
                                width={2684}
                                height={3410}
                            />
                        </li>
                        <li>
                            Switched the position of the &quot;History&quot; and
                            &quot;Settings&quot; links in the authed dropdown.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('8/23/2024')} /> - Added
                    global shortcuts for opening settings and going to{' '}
                    <code>/history</code>
                    <ul>
                        <li>
                            <HotkeyLabel
                                mac="⌘+⇧+Y"
                                mobile="⌘+⇧+Y"
                                nonMac="^+⇧+Y"
                            />{' '}
                            navigates to history
                        </li>
                        <li>
                            <HotkeyLabel
                                mac="⌘+⇧+,"
                                mobile="⌘+⇧+,"
                                nonMac="^+⇧+,"
                            />{' '}
                            opens settings
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('8/22/2024')} /> - Created
                    &quot;Settings&quot; section so you can manually change the
                    color scheme
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
                            <source src={'/assets/theme-toggle.mp4'} />
                        </video>
                    </div>
                </li>
                <li>
                    <DateComponent date={new Date('8/19/2024')} /> - Added
                    keyboard shortcuts for deleting the previous word and
                    restarting the verse.
                    <ul>
                        <li>
                            <HotkeyLabel mac="⌥+⇦" mobile="⌥+⇦" nonMac="^+⇦" />{' '}
                            deletes the previous word
                        </li>
                        <li>
                            <HotkeyLabel
                                mac="⌘+⇦"
                                mobile="⌘+⇦"
                                nonMac="^+⇧+⇦"
                            />{' '}
                            restarts the current verse
                        </li>
                    </ul>
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
                                src={'/assets/command-option-backspace.mp4'}
                            />
                        </video>
                    </div>
                </li>
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
