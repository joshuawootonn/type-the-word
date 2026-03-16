import { Translation } from "~/lib/parseEsv"
import { Book } from "~/lib/types/book"

import { shouldAutoSyncPassagePath } from "./passageSelector-path-sync"

export function toPassageSelectorTargetKey(
    book: Book,
    chapter: string,
    translation: Translation,
): string {
    return `${book}:${chapter}:${translation}`
}

export function shouldSchedulePassageAutoSync(args: {
    pathname: string | null
    book: Book
    chapter: string
    translation: Translation
    lastSubmittedTargetKey: string | null
}): boolean {
    const targetKey = toPassageSelectorTargetKey(
        args.book,
        args.chapter,
        args.translation,
    )
    if (args.lastSubmittedTargetKey === targetKey) {
        return false
    }
    return shouldAutoSyncPassagePath(args.pathname, args.book, args.chapter)
}
