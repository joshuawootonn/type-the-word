import clsx from "clsx"
import { useAtom } from "jotai"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"
import { CurrentVerse } from "~/components/currentVerse"
import { currentVerseAtom } from "~/components/passage"
import { ReadonlyVerse } from "~/components/readonlyVerse"
import { type Paragraph, ParsedPassage } from "~/lib/parseEsv"
import { TypingSession } from "~/server/repositories/typingSession.repository"

export function Paragraph({
    node,
    passage,
    typingSession,
    history,
    classroomAssignmentId,
    historyQueryKey,
}: {
    passage: ParsedPassage
    node: Paragraph
    typingSession?: TypingSession
    history?: ChapterHistory | AssignmentHistory
    classroomAssignmentId?: string
    historyQueryKey?: (string | number | boolean | null | undefined)[]
}) {
    const [currentVerse] = useAtom(currentVerseAtom)
    return (
        <p className={clsx("text-lg", node.metadata.blockIndent && "ml-3")}>
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse.value === currentVerse

                if (verse.nodes.length === 0) return null

                return isCurrentVerse ? (
                    <CurrentVerse
                        key={vIndex}
                        verse={verse}
                        isCurrentVerse={isCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                        passage={passage}
                        typingSession={typingSession}
                        history={history}
                        classroomAssignmentId={classroomAssignmentId}
                        historyQueryKey={historyQueryKey}
                    />
                ) : (
                    <ReadonlyVerse
                        key={vIndex}
                        verse={verse}
                        isCurrentVerse={isCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                        history={history}
                    />
                )
            })}
        </p>
    )
}
