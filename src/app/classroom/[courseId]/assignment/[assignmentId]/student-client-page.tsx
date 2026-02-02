"use client"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { CopyrightCitation } from "~/components/copyright-citation"
import { Passage } from "~/components/passage"
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
    totalVerses,
    submission,
    typingSession,
    assignmentHistory,
    courseId,
    courseName,
}: StudentClientPageProps) {
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

                <StudentAssignmentCompletion
                    submission={submission}
                    assignmentHistory={assignmentHistory}
                    totalVerses={totalVerses}
                    referenceLabel={referenceLabel}
                    assignmentTitle={assignmentTitle}
                    assignmentId={assignmentId}
                />
                <CopyrightCitation copyright={passage.copyright} />
            </div>
        </div>
    )
}
