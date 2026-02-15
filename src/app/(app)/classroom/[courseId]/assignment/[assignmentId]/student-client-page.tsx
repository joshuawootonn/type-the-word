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
    courseId,
    courseName,
}: StudentClientPageProps) {
    const router = useRouter()
    const activeChapter = chapterSegments[activeChapterIndex]
    const hasMultipleChapters = chapterSegments.length > 1
    const canGoToPreviousChapter = activeChapterIndex > 0
    const canGoToNextChapter = activeChapterIndex < chapterSegments.length - 1

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
                    autofocus
                    passage={passage}
                    translation={translation}
                    typingSession={typingSession}
                    classroomAssignmentId={assignmentId}
                    assignmentHistory={assignmentHistory}
                    historyType="assignment"
                />

                {hasMultipleChapters && activeChapter && (
                    <div className="not-prose border-primary bg-secondary flex items-center justify-between gap-3 border-2 p-4">
                        <Button
                            type="button"
                            onClick={() =>
                                navigateToChapter(activeChapterIndex - 1)
                            }
                            disabled={!canGoToPreviousChapter}
                        >
                            Previous Chapter
                        </Button>
                        <div className="text-primary text-center text-sm">
                            <div className="font-semibold">
                                Chapter {activeChapter.chapter} of{" "}
                                {chapterSegments.length}
                            </div>
                            <div className="opacity-75">
                                {activeChapter.referenceLabel}
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={() =>
                                navigateToChapter(activeChapterIndex + 1)
                            }
                            disabled={!canGoToNextChapter}
                        >
                            Next Chapter
                        </Button>
                    </div>
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
                <CopyrightCitation copyright={passage.copyright} />
            </div>
        </div>
    )
}
