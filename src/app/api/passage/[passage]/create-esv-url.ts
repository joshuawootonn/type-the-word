import { PassageObject } from '~/lib/passageObject'

export function createESVURL(passageData: PassageObject): string {
    const isSingleBookChapter =
        passageData.book === 'obadiah' ||
        passageData.book === 'philemon' ||
        passageData.book === 'jude'
    const chapterVerseDelimiter = isSingleBookChapter ? '' : ':'
    const verseSegment =
        passageData.firstVerse && passageData.lastVerse
            ? passageData.firstVerse === passageData.lastVerse
                ? `${chapterVerseDelimiter}${passageData.firstVerse}`
                : `${chapterVerseDelimiter}${passageData.firstVerse}-${passageData.lastVerse}`
            : ''

    const chapterSegment = isSingleBookChapter ? '' : passageData.chapter

    const url = `https://api.esv.org/v3/passage/html/?q=${passageData.book
        .split('_')
        .join(' ')} ${chapterSegment}${verseSegment}`.trim()

    return url
}
