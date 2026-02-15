export function getLatestVerseByChapter<
    T extends { chapter: number; verse: number; createdAt: Date },
>(verseRows: T[], options?: { chapterOnly?: boolean }): Map<string, T> {
    const latestVersesByLocation = new Map<string, T>()
    verseRows.forEach(row => {
        const key = options?.chapterOnly
            ? `${row.verse}`
            : `${row.chapter}:${row.verse}`
        const existing = latestVersesByLocation.get(key)
        if (!existing || row.createdAt > existing.createdAt) {
            latestVersesByLocation.set(key, row)
        }
    })

    return latestVersesByLocation
}
