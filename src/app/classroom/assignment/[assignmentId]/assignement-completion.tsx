import { useState, useMemo } from "react"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { Button } from "~/components/ui/button"
import { Meter } from "~/components/ui/meter"

import { turnInAssignment } from "./actions"

export function AssignmentCompletion({
    submission,
    assignmentHistory,
    totalVerses,
    referenceLabel,
    assignmentTitle,
    assignmentId,
}: {
    assignmentHistory?: AssignmentHistory
    totalVerses: number
    submission: {
        id: string
        submissionId: string | null
        isTurnedIn: boolean
    }
    referenceLabel: string
    assignmentTitle: string
    assignmentId: string
}) {
    const [isTurningIn, setIsTurningIn] = useState(false)
    const [turnInError, setTurnInError] = useState<string | null>(null)
    const [isTurnedIn, setIsTurnedIn] = useState(submission.isTurnedIn)

    const completedVerses = useMemo(
        () => Object.keys(assignmentHistory?.verses ?? {}).map(Number).length,
        [assignmentHistory?.verses],
    )
    const completionPercentage =
        totalVerses > 0
            ? Math.min(100, Math.round((completedVerses / totalVerses) * 100))
            : 0
    const isComplete = totalVerses > 0 && completedVerses >= totalVerses

    async function handleTurnIn(): Promise<void> {
        setIsTurningIn(true)
        setTurnInError(null)

        try {
            await turnInAssignment(assignmentId)
            setIsTurnedIn(true)
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to turn in assignment."
            setTurnInError(message)
        } finally {
            setIsTurningIn(false)
        }
    }

    return (
        <>
            <div className="not-prose space-y-4 border-2 border-primary bg-secondary p-6">
                <div className="space-y-1">
                    <p className="text-sm uppercase tracking-wide text-primary">
                        Classroom Assignment
                    </p>
                    <h1 className="text-2xl font-semibold text-primary">
                        {assignmentTitle}
                    </h1>
                    <p className="text-sm text-primary">{referenceLabel}</p>
                </div>
                <div className="space-y-3">
                    <Meter value={completionPercentage} label="Completion" />
                    <div className="text-sm text-primary">
                        {completedVerses} of {totalVerses} verses completed
                    </div>
                </div>
            </div>

            {isComplete && (
                <>
                    <div className="not-prose space-y-4 border-2 border-success bg-secondary p-6">
                        <div className="flex items-center gap-3">
                            <svg
                                className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-shrink-0 flex-grow text-sm text-success">
                                Nice work! Assignment completed.
                            </div>
                            {isTurnedIn ? (
                                <div className="text-sm text-success">
                                    This assignment is turned in.
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleTurnIn}
                                    isLoading={isTurningIn}
                                    loadingLabel="Turning in"
                                    className="text-sm"
                                >
                                    Turn in assignment
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="!mb-32">
                        {turnInError && (
                            <div className="not-prose text-sm text-error">
                                {turnInError}
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    )
}
