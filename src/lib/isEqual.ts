import { Inline, Paragraph } from './parseEsv'
import { isAtomComplete } from '~/lib/keystroke'

export const validQuotes = [
    '“', // U+201c
    '”', // U+201d
    '"',
    // '«', // U+00AB
    // '»', // U+00BB
    // '„', // U+201E
    // '“', // U+201C
    // '‟', // U+201F
    // '”', // U+201D
    // '❝', // U+275D
    // '❞', // U+275E
    // '〝', // U+301D
    // '〞', // U+301E
    // '〟', // U+301F
    // '＂', // U+FF02
]

export const validSingleQuotes = ["'", '‘', '’', '‛', '❛', '❜', '']

export const validEnter = ['Enter', '\n']

export const validEmDash = ['-', '–', '—']

export function isAtomTyped(atom: Inline | Paragraph): boolean {
    switch (atom.type) {
        case 'verseNumber':
        case 'paragraph':
        case 'space':
        case 'newLine':
            return false

        default:
            return true
    }
}

export function isLetterEqual(a?: string, b?: string): boolean {
    if (a === undefined || b === undefined) return a === b

    if (validQuotes.includes(b)) {
        return validQuotes.includes(a)
    }

    if (validSingleQuotes.includes(b)) {
        return validSingleQuotes.includes(a)
    }

    return a === b
}

export function isAtomEqual(a?: Inline, b?: Inline): boolean {
    if (a === undefined || b === undefined) return a === b

    if (a.type !== b.type) return false

    if (a.type === 'word' && b.type === 'word') {
        if (b.letters.length !== a.letters.length) return false

        if (b.letters.length > a.letters.length) {
            return b.letters.every((letter, i) =>
                isLetterEqual(letter, a.letters[i]),
            )
        }
        return a.letters.every((letter, i) =>
            isLetterEqual(letter, b.letters[i]),
        )
    }
    return true
}

export function isVerseSameShape(a: Inline[], b: Inline[]) {
    const aTyped = a.filter(isAtomTyped)
    const bTyped = b.filter(isAtomTyped)
    if (aTyped.length !== bTyped.length) {
        return false
    }
    return aTyped.every(
        (atom, i) =>
            isAtomComplete(atom) &&
            isAtomComplete(bTyped[i]) &&
            atom.type === bTyped[i]?.type,
    )
}
