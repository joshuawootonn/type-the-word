import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"

export function isVerseTypedInHistory(
    history: ChapterHistory | AssignmentHistory | undefined,
    chapter: number,
    verse: number,
): boolean {
    if (!history) {
        return false
    }

    const chapterVerseKey = `${chapter}:${verse}`
    if (Object.prototype.hasOwnProperty.call(history.verses, chapterVerseKey)) {
        return true
    }

    const verseOnlyKey = `${verse}`
    return Object.prototype.hasOwnProperty.call(history.verses, verseOnlyKey)
}
