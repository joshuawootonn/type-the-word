import { format } from 'date-fns'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Image from 'next/image'

import { EmailLink } from '~/components/emailLink'
import HotkeyLabel from '~/components/hotkey-label'
import { authOptions } from '~/server/auth'

import { UpdateLastVisitedChangelog } from './update-last-visited-changelog'
import { changelogUpdatedAt } from './updated-at'

function Link({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            className="svg-outline-sm relative cursor-pointer whitespace-nowrap underline outline-none"
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

export default async function Changelog() {
    const session = await getServerSession(authOptions)

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
            {session != null && (
                <p>
                    These changelogs are batched into monthly update emails with
                    more details and usages stats. If you&apos;re interested
                    search your email for &quot;Type the Word newsletter
                    subscription&quot; and click &quot;Confirm.&quot;
                </p>
            )}
            <hr className="mx-0 w-full border-t-2 border-primary" />
            <ul>
                <li>
                    <DateComponent date={new Date('01/03/2026')} /> - Added{' '}
                    <a href="/copyright" className="underline">
                        copyright information
                    </a>{' '}
                    for all new Bible translations.
                </li>
                <li>
                    <DateComponent date={new Date('12/29/2025')} /> - Improved
                    parsing for new Bible translations:
                    <ul>
                        <li>
                            Section headers and speaker labels (e.g.,
                            &quot;She&quot;, &quot;Friends&quot;, &quot;The
                            Banquet&quot; in Song of Solomon) are now displayed
                            as headings instead of typeable content.
                        </li>
                        <li>
                            Poetry verses split across multiple lines are now
                            merged into single sections, reducing the number of
                            buttons per verse.
                        </li>
                        <li>
                            Indentation for poetry and quoted sections is now
                            preserved in the parsed text.
                        </li>
                        <li>
                            There are now 1000+ tests for the new parsing logic,
                            validating all verses are shown among other things.
                        </li>
                    </ul>
                    <br />
                    If you run into any other issues with the new translations.
                    Please <EmailLink className="underline">
                        email me
                    </EmailLink>{' '}
                    and I&apos;ll be happy to take a look.
                </li>
                <li>
                    <DateComponent date={new Date('12/24/2025')} /> - Fixed a
                    bug in Song of Solomon chapter 1 where you couldn&apos;t
                    type past certain words. The issue was caused by text in the
                    HTML source being split across lines, which embedded newline
                    characters into words like &quot;Let&quot; and
                    &quot;his&quot;. When you typed a space after these words,
                    it didn&apos;t match the expected newline character, making
                    it impossible to advance.
                </li>
                <li>
                    <DateComponent date={new Date('12/19/2025')} /> - Added
                    support for new Bible translations! This is in super early
                    access and you can try it by toggling the &quot;New Bible
                    Translations&quot; early access flag in your settings.
                    <Image
                        src={'/assets/2025-12-24-translation-selector.png'}
                        alt={'Screenshot of the new translation selector'}
                        className="mt-3 border-2 border-primary"
                        width={800}
                        height={400}
                    />
                    <ul>
                        <li>
                            New translations include: NIV, NLT, CSB, NKJV, NASB,
                            MSG, BSB, and our first non-English translation NTV!
                        </li>
                        <li>
                            This was made possible by integrating with{' '}
                            <Link href="https://api.bible/">api.bible</Link>.
                        </li>
                        <li>
                            Note: This is &quot;super early access&quot; - I
                            currently don&apos;t have the right attribution
                            being shown, and there are known issues with how
                            I&apos;m parsing and formatting the text. Keep an
                            eye on the changelog as I stabilize each
                            translation.
                        </li>
                        <li>
                            If you speak another language and have thoughts on
                            what the best translations for that language are,
                            check{' '}
                            <Link href="https://api.bible/bibles">
                                this list of translations
                            </Link>{' '}
                            and{' '}
                            <EmailLink className="underline">
                                email me
                            </EmailLink>{' '}
                            a recommendation!
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('12/18/2025')} /> - Added an
                    early access feature section for opting yourself into new
                    features. The first feature that you can opt into is the
                    recent WPM and Accuracy UI I created for the{' '}
                    <Link href="/history">/history</Link>&nbsp; page.
                    <Image
                        src={'/assets/early-access-features.png'}
                        alt={
                            'Screenshot of the new early access features section'
                        }
                        className="mt-3 border-2 border-primary"
                        width={800}
                        height={400}
                    />
                </li>
                <li>
                    <DateComponent date={new Date('12/5/2025')} /> - Started a
                    beta for WPM and accuracy stats on the history page. If
                    you&apos;re interested in joining, reach out at{' '}
                    <EmailLink className="underline" />.
                    <Image
                        src={'/assets/2025-12-05-WPM.png'}
                        alt={'Screenshot of the new WPM and accuracy chart'}
                        className="mt-3 border-2 border-primary"
                        width={800}
                        height={400}
                    />
                </li>
                <li>
                    <DateComponent date={new Date('12/3/2025')} /> - Added a
                    global shortcut for focusing the passage selector:{' '}
                    <HotkeyLabel mac="⌘+P" mobile="⌘+P" nonMac="^+P" />
                </li>
                <li>
                    <DateComponent date={new Date('12/1/2025')} /> - I&apos;m
                    working on adding WPM stats to Type the Word and while I was
                    doing a small migration I accidentally ran some SQL against
                    the prod database. I restored to a backup point at 1:02pm,
                    but I wanted to move quickly and I may have lost the data
                    within the window of 1:02 pm and 1:22 pm CST. Sorry for the
                    inconvenience everyone!
                </li>
                <li>
                    <DateComponent date={new Date('11/23/2025')} />{' '}
                    <ul>
                        <li>
                            When you navigate to a chapter TTW will now find and
                            focus on the next verse to type based on your typing
                            history.
                        </li>
                        <li>
                            <span className="line-through">
                                - I&apos;m performing a scheduled database
                                upgrade right now. Feel free to keep typing, but
                                your progress will not be saved.
                            </span>
                            <br />
                            <br />
                            This migration is completed. This database instance
                            is slighly cheaper, and should be faster than the
                            previous one.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('11/21/2025')} /> - TTW will
                    be down for maintenance from 10pm to 11pm CST on Sunday,
                    11/23 for a database upgrade. Feel free to keep typing, but
                    your progress will not be saved.
                    <br />
                    <br />
                    Note: I attempted to do this upgrade today, but ran out of
                    time before work. No data was lost during this attempt.
                </li>
                <li>
                    <DateComponent date={new Date('10/18/2025')} /> - Added
                    email/password auth so you no longer have to sign in with
                    Google. You can now{' '}
                    <Link href="/auth/signup">create an account</Link> with just
                    your email and password.
                    <ul>
                        <li>
                            If you want to create multiple accounts with the
                            same email you can use email aliases. For example,
                            if I wanted to create an additional account for{' '}
                            <code>josh@typetheword.site</code> I could sign up
                            with <code>josh+2@typetheword.site</code> and it
                            would be treated as a different account. Note the{' '}
                            <code>+2</code> is just an example and you can use
                            any text after the <code>+</code>.
                        </li>
                        <li>
                            If you already have an account with Google and want
                            to move to an email/password account: Create a new
                            email/password account and email me both the old and
                            new email addresses and I can migrate your data for
                            you.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('8/14/2025')} /> - Added a new
                    <Link href="/donate"> donate</Link> page and a donate link
                    in the footer. Any help paying hosting costs is greatly
                    appreciated.
                </li>
                <li>
                    <DateComponent date={new Date('5/31/2025')} /> - Fixed a bug
                    preventing you from completing{' '}
                    <Link href="www.typetheword.site/passage/1_kings_4">
                        1 Kings 4:20
                    </Link>{' '}
                    and{' '}
                    <Link href="https://www.typetheword.site/passage/2_chronicles_2">
                        2 Chronicles 2:1
                    </Link>
                    .
                </li>
                <li>
                    <DateComponent date={new Date('4/18/2025')} />

                    <ul>
                        <li>
                            Fixed a bug with how the overview section looked for
                            2 Timothy. If you typed the second chapter more than
                            once each verse past the first time through was
                            causing the overview section to indicate you had
                            typed the entire book again.
                        </li>
                        <li>
                            Fixed a bug where only the first verse in{' '}
                            <Link href="/passage/2_john">2 John</Link> and{' '}
                            <Link href="/passage/3_john">3 John</Link> were
                            available to be typed.
                            <br />
                            This is related to the issue I solved for Philemon
                            and Obadiah on March 11th. The ESV API has been
                            transitioning how to reference books with a single
                            chapter. Before &quot;Obadiah 1&quot; pulled the
                            chapter of Obadiah, but now it only pulls the first
                            verse.
                        </li>
                    </ul>
                </li>{' '}
                <li>
                    <DateComponent date={new Date('3/11/2025')} />

                    <ul>
                        <li>
                            Fixed a bug shipped on March 6th similar to an issue
                            I&apos;ve seen before where I was depending on the
                            number of verses in a chapter to download the entire
                            chapter. Since many chapters skip verses this means
                            TTW was not downloading the last verse.{' '}
                            <Link href="/passage/mark_11">Mark 11</Link>,{' '}
                            <Link href="/passage/mark_15">Mark 15</Link>, and{' '}
                            <Link href="/passage/luke_17">Luke 17</Link> were
                            the effected passages.
                        </li>
                        <li>
                            Fixed a bug where only the first verse in{' '}
                            <Link href="/passage/obadiah">Obadiah</Link> and{' '}
                            <Link href="/passage/philemon">Philemon</Link> were
                            available to be typed.
                        </li>
                    </ul>
                </li>{' '}
                <li>
                    <DateComponent date={new Date('3/6/2025')} />
                    <ul>
                        <li>
                            Fixed a visual bug in the &quot;Overview&quot;
                            section within <Link href="/history">/history</Link>{' '}
                            where your book progression wasn&apos;t aligned to
                            the right on mobile or safari.
                        </li>
                        <li>
                            Fixed a bug where your the &quot;Log&quot; section
                            within <Link href="/history">/history</Link> was
                            being calculated based on the server&apos;s
                            timezone. This was misleading because sometimes your
                            typed verses would show up in the next or previous
                            day.
                        </li>
                    </ul>
                </li>{' '}
                <li>
                    <DateComponent date={new Date('3/5/2025')} /> - Fixed a bug
                    where only the first verse in{' '}
                    <Link href="/passage/jude_1">Jude</Link> was being loaded
                    preventing you from typing the chapter.
                </li>{' '}
                <li>
                    <DateComponent date={new Date('2/2/2025')} /> - Did a small
                    batch of updates to optimize for retyping through sections
                    of the Bible.{' '}
                    <ul>
                        <li>
                            The passage text being dimmed now means something
                            different.{' '}
                            <ul>
                                <li>
                                    Before the text was dimmed when you had
                                    previously typed it.
                                </li>
                                <li>
                                    Now the text is only dimmed when you have
                                    started typing this chapter and have typed
                                    this verse. When you complete the chapter
                                    the dimming is reset.
                                </li>
                            </ul>
                            This change allows you to type through a chapter
                            multiple times and see your building progress each
                            time.
                        </li>
                        <li>
                            Since chapters can now reset,
                            <ul>
                                <li>
                                    I added a Log section to the bottom of each
                                    chapter. Unlike the Log within
                                    <Link href="/history">
                                        <code> /history</code>
                                    </Link>{' '}
                                    this Log is specific to this chapter.
                                    <Image
                                        src={'/assets/chapter-log.png'}
                                        alt={
                                            'Screen shot of the new "Log" section for each chapter'
                                        }
                                        className="mt-3 border-2 border-primary"
                                        width={2454}
                                        height={2252}
                                    />
                                </li>
                                <li>
                                    And I removed the dimming on that would
                                    automatically happen for the current verse.
                                </li>
                            </ul>
                        </li>
                        <li>
                            I also updated the overview section within{' '}
                            <Link href="/history">
                                <code> /history</code>
                            </Link>{' '}
                            to reset once you have finished typing through a
                            book.
                            <br />
                            <br />
                            Your progress through a book is now shown with a
                            box. Similar to chapter progression, this box will
                            fill up until you completely type the book and then
                            it will be checked and another box will appear.
                            <Image
                                src={'/assets/overview-with-reset.png'}
                                alt={
                                    'Screen shot of the new "Log" section for each chapter'
                                }
                                className="mt-3 border-2 border-primary"
                                width={2226}
                                height={1842}
                            />
                        </li>
                        <li>
                            Lastly I fixed some incorrect verse counts in 2
                            Timothy 3 and 4 that were allowing you to have over
                            100% completion.
                        </li>{' '}
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('1/7/2025')} />
                    <ul>
                        <li>
                            Increased the contrast of the built in
                            &quot;Light&quot; and &quot;Dark&quot; themes.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('1/6/2024')} />

                    <ul>
                        <li>
                            Fixed a bug where TTW was not downloading the last
                            verse of chapters in the ESV translation where
                            verses are omitted.
                        </li>
                        <ul>
                            <li>
                                <Link href="/passage/matthew_12">
                                    Matthew 12
                                </Link>
                            </li>
                            <li>
                                <Link href="/passage/matthew_17">
                                    Matthew 17
                                </Link>
                            </li>
                            <li>
                                <Link href="/passage/matthew_18">
                                    Matthew 18
                                </Link>
                            </li>
                            <li>
                                <Link href="/passage/matthew_23">
                                    Matthew 23
                                </Link>
                            </li>
                            <li>
                                <Link href="/passage/mark_9">Mark 9</Link>
                            </li>
                            <li>
                                <Link href="/passage/luke_17">Luke 17</Link>
                            </li>
                            <li>
                                <Link href="/passage/luke_23">Luke 23</Link>
                            </li>
                            <li>
                                <Link href="/passage/john_5">John 5</Link>
                            </li>
                            <li>
                                <Link href="/passage/acts_15">Acts 15</Link>
                            </li>
                            <li>
                                <Link href="/passage/acts_24">Acts 24</Link>
                            </li>
                            <li>
                                <Link href="/passage/romans_16">Romans 16</Link>
                            </li>
                        </ul>
                        <div>
                            If you have typed these chapters and are not seeing
                            100% completion I would navigate to them now and
                            check the last verse.{' '}
                        </div>
                        <li>
                            Fixed a bug where{' '}
                            <Link href="/passage/2_timothy_1">2 Timothy 1</Link>{' '}
                            was incorrectly counting the number of verses on the{' '}
                            <Link href="/history">history</Link> page.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('12/25/2024')} />
                    <ul>
                        <li>
                            Fixed an edge case in theming where changing your
                            theme on one device wouldn&apos;t inject the new
                            theme styles on other devices.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('12/24/2024')} />
                    <ul>
                        <li>
                            Fixed some parsing issues that prevented typing
                            through{' '}
                            <Link href="/passage/psalm_145">Psalm 145:13</Link>.
                        </li>
                        <li>
                            Fixed an a bug in the color input where it
                            wouldn&apos;t allow you to select completely
                            desaturated colors.
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
                                mac="⌘+←"
                                mobile="⌘+←"
                                nonMac="⌘+←"
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
                            <HotkeyLabel mac="←" mobile="←" nonMac="←" />) where
                            it would delete an entire word. This was a bug in
                            Chrome that would happen after the shortcut for
                            deleting the previous word was used (
                            <HotkeyLabel mac="⌥+←" mobile="⌥+←" nonMac="^+←" />)
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
                    with <HotkeyLabel value="^+↑+←" /> . The MacOS shortcut is
                    still <HotkeyLabel value="⌘+←" /> .
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
                                mac="⌘+↑+Y"
                                mobile="⌘+↑+Y"
                                nonMac="^+↑+Y"
                            />{' '}
                            navigates to history
                        </li>
                        <li>
                            <HotkeyLabel
                                mac="⌘+↑+,"
                                mobile="⌘+↑+,"
                                nonMac="^+↑+,"
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
                            <HotkeyLabel mac="⌥+←" mobile="⌥+←" nonMac="^+←" />{' '}
                            deletes the previous word
                        </li>
                        <li>
                            <HotkeyLabel
                                mac="⌘+←"
                                mobile="⌘+←"
                                nonMac="^+↑+←"
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
