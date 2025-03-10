import { PassageObject } from '~/lib/passageObject'

export function createESVURL(passageData: PassageObject): string {
    const chapterVerseDelimiter = passageData.book === 'jude' ? '' : ':'
    const verseSegment =
        passageData.firstVerse && passageData.lastVerse
            ? passageData.firstVerse === passageData.lastVerse
                ? `${chapterVerseDelimiter}${passageData.firstVerse}`
                : `${chapterVerseDelimiter}${passageData.firstVerse}-${passageData.lastVerse}`
            : ''

    const chapterSegment =
        passageData.book === 'jude' ? '' : passageData.chapter

    return `https://api.esv.org/v3/passage/html/?q=${passageData.book
        .split('_')
        .join(' ')} ${chapterSegment}${verseSegment}`.trim()
}
