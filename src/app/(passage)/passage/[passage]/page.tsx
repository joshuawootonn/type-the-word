import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getChapterHistory } from '~/app/api/chapter-history/[passage]/getChapterHistory'
import { getOrCreateTypingSession } from '~/app/api/typing-session/getOrCreateTypingSession'
import { ChapterLog } from '~/components/chapter-log'
import { CopyrightCitation } from '~/components/copyright-citation'
import { Passage } from '~/components/passage'
import { fetchPassage } from '~/lib/api'
import { Translation } from '~/lib/parseEsv'
import { segmentToPassageObject } from '~/lib/passageObject'
import { passageReferenceSchema } from '~/lib/passageReference'
import { PassageSegment, toPassageSegment } from '~/lib/passageSegment'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { TypedVerseRepository } from '~/server/repositories/typedVerse.repository'

import { DEFAULT_PASSAGE_SEGMENT } from './default-passage'

const validTranslations: Translation[] = [
    'esv',
    'bsb',
    'nlt',
    'niv',
    'csb',
    'nkjv',
    'nasb',
    'ntv',
    'msg',
]

function parseTranslation(value: string | undefined | null): Translation {
    if (value && validTranslations.includes(value as Translation)) {
        return value as Translation
    }
    return 'esv'
}

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ passage?: PassageSegment }>
    searchParams: Promise<{ translation?: string }>
}): Promise<Metadata> {
    const passage = (await params).passage
    const { translation: translationParam } = await searchParams
    const translation = parseTranslation(translationParam)
    const a = passageReferenceSchema.parse(passage)
    const translationLabel = translation.toUpperCase()

    return {
        title: `Type the Word - ${a} (${translationLabel})`,
        description: `Practice typing through the Bible passage of ${a} in the ${translationLabel} translation.`,
    }
}

export default async function PassagePage(props: {
    params: Promise<{ passage?: PassageSegment }>
    searchParams: Promise<{
        translation?: string
        classroomAssignment?: string
    }>
}) {
    const session = await getServerSession(authOptions)
    const params = await props.params
    const searchParams = await props.searchParams

    // Middleware guarantees translation param exists and is valid
    const translation = parseTranslation(searchParams.translation)
    const classroomAssignmentId = searchParams.classroomAssignment

    // Always include translation in URL params
    const translationParam = `?translation=${translation}`

    // Classroom CourseWork assignment validation
    if (classroomAssignmentId) {
        if (!session?.user?.id) {
            // Show login prompt instead of auto-redirect
            const returnUrl = `/passage/${params.passage ?? DEFAULT_PASSAGE_SEGMENT}?${new URLSearchParams(searchParams).toString()}`
            return (
                <div className="prose mx-auto pt-8">
                    <h1>Sign In Required</h1>
                    <p>
                        You need to sign in with your school email address to
                        access this classroom assignment.
                    </p>
                    <Link
                        href={`/auth/login?callbackUrl=${encodeURIComponent(returnUrl)}`}
                        className="svg-outline relative mt-4 inline-block border-2 border-primary px-4 py-2 font-medium text-primary no-underline"
                    >
                        Sign In
                    </Link>
                </div>
            )
        }

        // Validate enrollment server-side using teacher token
        const classroomRepo = new (
            await import('~/server/repositories/classroom.repository')
        ).ClassroomRepository(db)
        const assignment = await classroomRepo.getAssignment(
            classroomAssignmentId,
        )

        if (!assignment) {
            return (
                <div className="prose mx-auto pt-8">
                    <h1>Assignment Not Found</h1>
                    <p>This classroom assignment could not be found.</p>
                </div>
            )
        }

        if (assignment.integrationType !== 'coursework') {
            return (
                <div className="prose mx-auto pt-8">
                    <h1>Invalid Assignment</h1>
                    <p>This assignment type is not supported here.</p>
                </div>
            )
        }

        if (!assignment.teacherUserId) {
            return (
                <div className="prose mx-auto pt-8">
                    <h1>Assignment Not Available</h1>
                    <p>
                        The teacher needs to connect their Type the Word account
                        for this assignment to work.
                    </p>
                </div>
            )
        }

        // Get teacher token
        const teacherToken = await classroomRepo.getTeacherToken(
            assignment.teacherUserId,
        )

        if (!teacherToken) {
            return (
                <div className="prose mx-auto pt-8">
                    <h1>Assignment Not Available</h1>
                    <p>
                        The teacher needs to reconnect their Google Classroom
                        account.
                    </p>
                </div>
            )
        }

        // Validate student is enrolled
        const {
            listCourseStudents: listStudents,
            refreshAccessToken: refreshToken,
        } = await import('~/lib/classroom.service')

        let accessToken = teacherToken.accessToken

        // Refresh if expired
        if (
            teacherToken.expiresAt &&
            teacherToken.expiresAt < new Date() &&
            teacherToken.refreshToken
        ) {
            const newTokens = await refreshToken(teacherToken.refreshToken)
            accessToken = newTokens.access_token

            await classroomRepo.upsertTeacherToken({
                userId: assignment.teacherUserId,
                googleId: teacherToken.googleId,
                accessToken: newTokens.access_token,
                refreshToken:
                    newTokens.refresh_token ?? teacherToken.refreshToken,
                expiresAt: newTokens.expires_in
                    ? new Date(Date.now() + newTokens.expires_in * 1000)
                    : null,
                scope: newTokens.scope ?? teacherToken.scope,
            })
        }

        const students = await listStudents(accessToken, assignment.courseId)

        // Get student's Google account to match by Google ID (more reliable than email)
        const userAccounts = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, session.user.id),
            with: {
                accounts: {
                    where: (accounts, { eq }) =>
                        eq(accounts.provider, 'google'),
                },
            },
        })

        const googleAccount = userAccounts?.accounts?.[0]
        const studentGoogleId = googleAccount?.providerAccountId

        console.log('Roster lookup:', {
            courseId: assignment.courseId,
            loggedInEmail: session.user.email,
            studentGoogleId,
            studentCount: students.length,
            rosterUserIds: students.map(s => s.userId),
        })

        // Match by Google ID (more reliable than email)
        let studentMatch = studentGoogleId
            ? students.find(student => student.userId === studentGoogleId)
            : undefined

        // Fallback to email matching if Google ID not available
        if (!studentMatch) {
            studentMatch = students.find(
                student =>
                    student.profile.emailAddress?.toLowerCase() ===
                    session.user.email?.toLowerCase(),
            )
        }

        if (!studentMatch) {
            return (
                <div className="prose mx-auto pt-8">
                    <h1>Not Enrolled</h1>
                    <p>
                        You are not enrolled in this course. Make sure
                        you&apos;re signed in with your school email address.
                    </p>
                    <p className="text-sm text-gray-600">
                        Signed in as: {session.user.email}
                    </p>
                    <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-500">
                            Debug info (click to expand)
                        </summary>
                        <div className="mt-2 rounded bg-gray-100 p-2 text-xs">
                            <p>Course ID: {assignment.courseId}</p>
                            <p>
                                Your Google ID:{' '}
                                {studentGoogleId ?? 'Not signed in with Google'}
                            </p>
                            <p>Students in roster: {students.length}</p>
                            <p>
                                Roster Google IDs:{' '}
                                {students.map(s => s.userId).join(', ')}
                            </p>
                        </div>
                    </details>
                </div>
            )
        }

        // Create submission record with proper Google IDs for progress tracking
        const { listStudentSubmissions: listSubmissions } = await import(
            '~/lib/classroom.service'
        )

        if (assignment.courseWorkId) {
            try {
                const submissions = await listSubmissions(
                    accessToken,
                    assignment.courseId,
                    assignment.courseWorkId,
                )

                const studentSubmission = submissions.find(
                    sub => sub.userId === studentMatch.userId,
                )

                // Calculate total verses
                const bookData = (await import('~/server/bible-metadata.json'))
                    .default
                const chapterData =
                    bookData[assignment.book as keyof typeof bookData]
                        ?.chapters?.[assignment.chapter - 1]
                const chapterVerseCount = chapterData?.length ?? 0

                let totalVerses: number
                if (assignment.firstVerse && assignment.lastVerse) {
                    totalVerses =
                        assignment.lastVerse - assignment.firstVerse + 1
                } else if (assignment.firstVerse) {
                    totalVerses = 1
                } else {
                    totalVerses = chapterVerseCount
                }

                // Create or update submission
                await classroomRepo.upsertSubmission({
                    assignmentId: assignment.id,
                    studentGoogleId: studentMatch.userId,
                    studentUserId: session.user.id,
                    googleSubmissionId: studentSubmission?.id,
                    versesCompleted: 0,
                    totalVerses,
                })
            } catch (error) {
                console.warn('Failed to initialize student submission:', error)
            }
        }
    }

    if (params.passage == null) {
        if (session == null) {
            redirect(`/passage/${DEFAULT_PASSAGE_SEGMENT}${translationParam}`)
        } else {
            const typedVerseRepository = new TypedVerseRepository(db)
            const verse = await typedVerseRepository.getOneOrNull({
                userId: session.user.id,
            })

            if (verse == null) {
                redirect(
                    `/passage/${DEFAULT_PASSAGE_SEGMENT}${translationParam}`,
                )
            }
            redirect(
                `/passage/${toPassageSegment(verse.book, verse.chapter)}${translationParam}`,
            )
        }
    }

    const value: PassageSegment = params.passage

    const [passage, typingSession, chapterHistory] = await Promise.all([
        fetchPassage(value, translation),
        session == null ? undefined : getOrCreateTypingSession(session.user.id),
        session == null
            ? undefined
            : getChapterHistory(
                  session.user.id,
                  segmentToPassageObject(value),
                  translation,
              ),
    ])

    return (
        <>
            <Passage
                autofocus={true}
                passage={passage}
                translation={translation}
                typingSession={typingSession}
                chapterHistory={chapterHistory}
            />
            <div className="not-prose mb-24 mt-8 flex w-full justify-between">
                {passage?.prevChapter ? (
                    <Link
                        href={`/passage/${passage.prevChapter.url}${translationParam}`}
                        className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary"
                    >
                        {passage.prevChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
                {passage?.nextChapter ? (
                    <Link
                        href={`/passage/${passage.nextChapter.url}${translationParam}`}
                        className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary"
                    >
                        {passage.nextChapter.label}
                    </Link>
                ) : (
                    <div />
                )}
            </div>

            {chapterHistory && (
                <ChapterLog
                    passageSegment={value}
                    translation={translation}
                    chapterHistory={chapterHistory}
                />
            )}

            <CopyrightCitation copyright={passage.copyright} />
        </>
    )
}
