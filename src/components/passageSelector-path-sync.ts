import { toPassageSegment } from "~/lib/passageSegment"
import { Book } from "~/lib/types/book"

export function shouldAutoSyncPassagePath(
    pathname: string | null,
    book: Book,
    chapter: string,
): boolean {
    if (pathname == null || pathname === "/") {
        return false
    }

    if (!pathname.startsWith("/passage/")) {
        return true
    }

    const expectedChapterSegment = toPassageSegment(book, chapter)
    const currentPathSegment = pathname.slice("/passage/".length)

    // Treat verse ranges under the selected chapter as already in sync.
    return !currentPathSegment.startsWith(expectedChapterSegment)
}
