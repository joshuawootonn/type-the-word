import { Atom } from './parseEsv'

const validQuotes = [
    '“', // U+201c
    '”', // U+201d
    '«', // U+00AB
    '»', // U+00BB
    '„', // U+201E
    '“', // U+201C
    '‟', // U+201F
    '”', // U+201D
    '❝', // U+275D
    '❞', // U+275E
    '〝', // U+301D
    '〞', // U+301E
    '〟', // U+301F
    '＂', // U+FF02
]

const validSingleQuotes = ['‘', '’', '‛', '❛', '❜', '']

export function isAtomTyped(atom: Atom): boolean {
    switch (atom.type) {
        case 'newLine':
        case 'space':
            return atom.typed

        default:
            return true
    }
}

export function isLetterEqual(a?: string, b?: string): boolean {
    if (a === undefined || b === undefined) return a === b

    if (b === '"') {
        return a === b || validQuotes.includes(a)
    }

    if (b === "'") {
        return a === b || validSingleQuotes.includes(a)
    }

    return a === b
}

export function isAtomEqual(a?: Atom, b?: Atom): boolean {
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

export function isVerseEqual(a: Atom[], b: Atom[]) {
    const aTyped = a.filter(isAtomTyped)
    const bTyped = b.filter(isAtomTyped)
    if (aTyped.length !== bTyped.length) {
        return false
    }
    return aTyped.every((atom, i) => isAtomEqual(atom, bTyped[i]))
}
