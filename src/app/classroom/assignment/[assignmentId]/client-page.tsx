"use client"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { Passage } from "~/components/passage"
import { ParsedPassage, Translation } from "~/lib/parseEsv"
import { TypingSession } from "~/server/repositories/typingSession.repository"

import { AssignmentCompletion } from "./assignement-completion"

interface ClientPageProps {
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
}

export function ClientPage({
    assignmentId,
    assignmentTitle,
    referenceLabel,
    translation,
    passage,
    totalVerses,
    submission,
    typingSession,
    assignmentHistory,
}: ClientPageProps) {
    return (
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

            <AssignmentCompletion
                submission={submission}
                assignmentHistory={assignmentHistory}
                totalVerses={totalVerses}
                referenceLabel={referenceLabel}
                assignmentTitle={assignmentTitle}
                assignmentId={assignmentId}
            />
        </div>
    )
}
