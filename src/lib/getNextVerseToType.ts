import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"
import { ParsedPassage } from "~/lib/parseEsv"

export function getNextVerseToType(
    passage: ParsedPassage,
    chapterHistory?: ChapterHistory,
): string {
    // If no history or user not logged in, focus first verse
    if (!chapterHistory) {
        return `${passage.firstVerse.verse}`
    }

    // Extract all verse numbers from the passage
    // We need to collect verse numbers in order as they appear
    const allVerseNumbers: number[] = []

    for (const node of passage.nodes) {
        if (node.type === "paragraph") {
            for (const verse of node.nodes) {
                // Only count the verse if it's not a hanging verse continuation
                // Hanging verses don't have their own verse number
                if (!verse.metadata.hangingVerse) {
                    const verseNumber = verse.verse.verse
                    // Avoid duplicates (shouldn't happen but be safe)
                    if (!allVerseNumbers.includes(verseNumber)) {
                        allVerseNumbers.push(verseNumber)
                    }
                }
            }
        }
    }

    // If no verses found, return first verse (shouldn't happen)
    if (allVerseNumbers.length === 0) {
        return `${passage.firstVerse.verse}`
    }

    // Get the typed verse numbers
    const typedVerseNumbers = Object.keys(chapterHistory.verses)
        .map(Number)
        .filter(num => chapterHistory.verses[num])

    // If no verses have been typed, focus the first verse
    if (typedVerseNumbers.length === 0) {
        return `${passage.firstVerse.verse}`
    }

    // Find the highest typed verse number
    const maxTypedVerse = Math.max(...typedVerseNumbers)

    // Find the next verse after the highest typed verse
    const nextVerseNumber = allVerseNumbers.find(
        verseNum => verseNum > maxTypedVerse,
    )

    // If we found a next verse, return it
    if (nextVerseNumber !== undefined) {
        return `${nextVerseNumber}`
    }

    return `${passage.firstVerse.verse}`
}
