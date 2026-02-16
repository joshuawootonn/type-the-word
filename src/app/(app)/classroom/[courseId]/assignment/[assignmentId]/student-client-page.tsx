"use client"

import { useRouter } from "next/navigation"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { CopyrightCitation } from "~/components/copyright-citation"
import { Passage } from "~/components/passage"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import { ParsedPassage, Translation } from "~/lib/parseEsv"
import { TypingSession } from "~/server/repositories/typingSession.repository"

import { StudentAssignmentCompletion } from "./student-assignment-completion"

interface StudentClientPageProps {
    typingSession?: TypingSession
    assignmentHistory?: AssignmentHistory
    assignmentChapterHistory?: AssignmentHistory
    assignmentId: string
    assignmentTitle: string
    referenceLabel: string
    translation: Translation
    passage: ParsedPassage
    chapterSegments: Array<{
        chapter: number
        startVerse: number
        endVerse: number
        referenceLabel: string
    }>
    activeChapterIndex: number
    totalVerses: number
    submission: {
        id: string
        submissionId: string | null
        isTurnedIn: boolean
    }
    courseId: string
    courseName: string
}

export function StudentClientPage({
    assignmentId,
    assignmentTitle,
    referenceLabel,
    translation,
    passage,
    chapterSegments,
    activeChapterIndex,
    totalVerses,
    submission,
    typingSession,
    assignmentHistory,
    assignmentChapterHistory,
    courseId,
    courseName,
}: StudentClientPageProps) {
    const router = useRouter()
    const activeChapter = chapterSegments[activeChapterIndex]
    const hasMultipleChapters = chapterSegments.length > 1
    const canGoToPreviousChapter = activeChapterIndex > 0
    const canGoToNextChapter = activeChapterIndex < chapterSegments.length - 1
    const passageRenderKey = `${assignmentId}:${activeChapter?.chapter ?? "default"}`

    function navigateToChapter(index: number): void {
        const chapter = chapterSegments[index]
        if (!chapter) {
            return
        }
        router.push(
            `/classroom/${courseId}/assignment/${assignmentId}?chapter=${chapter.chapter}`,
        )
    }

    return (
        <div>
            {/* Breadcrumbs */}
            <nav className="not-prose mb-6 text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <Link href={`/classroom/${courseId}`} variant="text">
                    {courseName}
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>{assignmentTitle}</span>
            </nav>

            <div className="space-y-8">
                <Passage
                    key={passageRenderKey}
                    autofocus
                    passage={passage}
                    translation={translation}
                    typingSession={typingSession}
                    classroomAssignmentId={assignmentId}
                    assignmentHistory={assignmentChapterHistory}
                    historyType="assignment"
                />

                <div className="bg-secondary sticky right-0 bottom-0 left-0 -mx-16 flex flex-col gap-4 px-16 py-4 pt-0 pb-8">
                    {hasMultipleChapters && activeChapter && (
                        <>
                            <hr className="border-primary my-0" />
                            <div className="not-prose flex items-center justify-between gap-3">
                                {canGoToPreviousChapter ? (
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            navigateToChapter(
                                                activeChapterIndex - 1,
                                            )
                                        }
                                    >
                                        Chapter{" "}
                                        {
                                            chapterSegments[
                                                activeChapterIndex - 1
                                            ]?.chapter
                                        }
                                    </Button>
                                ) : (
                                    <div />
                                )}
                                <div className="text-primary absolute left-1/2 -translate-x-1/2 text-center text-sm">
                                    <div className="font-semibold">
                                        Chapter {activeChapter.chapter} of{" "}
                                        {chapterSegments.length}
                                    </div>
                                    <div className="opacity-75">
                                        {activeChapter.referenceLabel}
                                    </div>
                                </div>
                                {canGoToNextChapter ? (
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            navigateToChapter(
                                                activeChapterIndex + 1,
                                            )
                                        }
                                    >
                                        Chapter{" "}
                                        {
                                            chapterSegments[
                                                activeChapterIndex + 1
                                            ]?.chapter
                                        }
                                    </Button>
                                ) : (
                                    <div />
                                )}
                            </div>
                        </>
                    )}

                    <StudentAssignmentCompletion
                        submission={submission}
                        assignmentHistory={assignmentHistory}
                        totalVerses={totalVerses}
                        referenceLabel={referenceLabel}
                        assignmentTitle={assignmentTitle}
                        assignmentId={assignmentId}
                        courseId={courseId}
                    />
                </div>
                <CopyrightCitation copyright={passage.copyright} />
            </div>
        </div>
    )
}
