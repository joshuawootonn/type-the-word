import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { Button } from "~/components/ui/button"
import { Meter } from "~/components/ui/meter"
import { fetchAssignmentHistory } from "~/lib/api"

import { turnInAssignment } from "./student-actions"

export function StudentAssignmentCompletion({
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

    // Use the same query key as the Passage component for automatic updates
    const { data: liveAssignmentHistory } = useQuery({
        queryKey: ["assignment-history", assignmentId],
        queryFn: () => fetchAssignmentHistory(assignmentId),
        placeholderData: assignmentHistory,
        refetchInterval: false,
    })

    // Use the live data from the query, falling back to the initial prop
    const currentHistory = liveAssignmentHistory ?? assignmentHistory

    const completedVerses = useMemo(
        () => Object.keys(currentHistory?.verses ?? {}).map(Number).length,
        [currentHistory?.verses],
    )
    const completionPercentage =
        totalVerses > 0
            ? Math.min(100, Math.round((completedVerses / totalVerses) * 100))
            : 0
    const isComplete = totalVerses > 0 && completedVerses >= totalVerses

    // Calculate stats from assignment history
    const stats = useMemo(() => {
        if (!currentHistory?.verses) {
            return { averageWpm: null, averageAccuracy: null }
        }

        const verses = Object.values(currentHistory.verses)
        if (verses.length === 0) {
            return { averageWpm: null, averageAccuracy: null }
        }

        // Filter to verses with valid stats
        const versesWithWpm = verses.filter(v => v.wpm != null && v.wpm > 0)
        const versesWithAccuracy = verses.filter(
            v => v.accuracy != null && v.accuracy > 0,
        )

        const averageWpm =
            versesWithWpm.length > 0
                ? Math.round(
                      versesWithWpm.reduce((sum, v) => sum + v.wpm!, 0) /
                          versesWithWpm.length,
                  )
                : null

        const averageAccuracy =
            versesWithAccuracy.length > 0
                ? Math.round(
                      versesWithAccuracy.reduce(
                          (sum, v) => sum + v.accuracy!,
                          0,
                      ) / versesWithAccuracy.length,
                  )
                : null

        return {
            averageWpm,
            averageAccuracy,
        }
    }, [currentHistory?.verses])

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
            <div className="not-prose border-primary bg-secondary space-y-4 border-2 p-6">
                <div className="space-y-1">
                    <p className="text-primary text-sm tracking-wide uppercase">
                        Classroom Assignment
                    </p>
                    <h1 className="text-primary text-2xl font-semibold">
                        {assignmentTitle}
                    </h1>
                    <p className="text-primary text-sm">{referenceLabel}</p>
                </div>
                <div className="space-y-3">
                    <Meter value={completionPercentage} label="Completion" />
                    <div className="text-primary text-sm">
                        {completedVerses} of {totalVerses} verses completed
                    </div>
                </div>

                {/* Show stats if we have valid data */}
                {(stats.averageWpm !== null ||
                    stats.averageAccuracy !== null) && (
                    <div className="border-primary grid grid-cols-2 gap-3 border-t-2 pt-3 text-sm">
                        {stats.averageWpm !== null && (
                            <div>
                                <span className="opacity-75">Average WPM:</span>{" "}
                                <span className="font-semibold">
                                    {stats.averageWpm}
                                </span>
                            </div>
                        )}
                        {stats.averageAccuracy !== null && (
                            <div>
                                <span className="opacity-75">Accuracy:</span>{" "}
                                <span className="font-semibold">
                                    {stats.averageAccuracy}%
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isComplete && (
                <>
                    <div className="not-prose border-success bg-secondary space-y-4 border-2 p-6">
                        <div className="flex items-center gap-3">
                            <svg
                                className="text-success mt-0.5 h-5 w-5 shrink-0"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-success shrink-0 grow text-sm">
                                Nice work! Assignment completed.
                            </div>
                            {isTurnedIn ? (
                                <div className="text-success text-sm">
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
                    <div className="mb-32!">
                        {turnInError && (
                            <div className="not-prose text-error text-sm">
                                {turnInError}
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    )
}
