import toProperCase from "~/lib/toProperCase"

type ReferenceLabelInput = {
    book: string
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
}

export function formatReferenceLabel({
    book,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
}: ReferenceLabelInput): string {
    const formattedBook = toProperCase(book.split("_").join(" "))
    const sameChapter = startChapter === endChapter
    const sameVerse = sameChapter && startVerse === endVerse
    const verseLabel = sameChapter
        ? `${startChapter}:${startVerse}${sameVerse ? "" : `-${endVerse}`}`
        : `${startChapter}:${startVerse}-${endChapter}:${endVerse}`

    return `${formattedBook} ${verseLabel}`
}
