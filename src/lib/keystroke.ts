import { Inline } from '~/lib/parseEsv'
import { validEnter, validQuotes, validSingleQuotes } from '~/lib/isEqual'
import { KnownNativeInputEvent } from '~/components/currentVerse'

export type Keystroke = {
    type:
        | 'deleteContentBackward'
        | 'deleteSoftLineBackward'
        | 'deleteWordBackward'
        | 'insertText'
    key: string
}

export function cleanInputKey(key: string): string {
    if (validQuotes.includes(key)) {
        return '"'
    }

    if (validSingleQuotes.includes(key)) {
        return "'"
    }

    if (validEnter.includes(key)) {
        return '\n'
    }

    return key
}
export function getPosition(keystrokes: Keystroke[] = []): Inline[] {
    return keystrokes.reduce((acc, keystroke) => {
        const last = acc.at(-1)
        if (keystroke.type === 'insertText' && keystroke.key) {
            if (last && last.type === 'word' && !isAtomComplete(last)) {
                return [
                    ...acc.slice(0, -1),
                    {
                        ...last,
                        letters: [
                            ...last.letters,
                            cleanInputKey(keystroke.key),
                        ],
                    },
                ]
            }

            return [...acc, { type: 'word', letters: [keystroke.key] }]
        } else if (keystroke.type === 'deleteContentBackward') {
            if (last?.type === 'word' && last.letters.length > 1) {
                return [
                    ...acc.slice(0, -1),
                    { ...last, letters: last.letters.slice(0, -1) },
                ]
            }

            return acc.slice(0, -1)
        } else if (keystroke.type === 'deleteWordBackward') {
            return acc.slice(0, -1)
        } else if (keystroke.type === 'deleteSoftLineBackward') {
            return []
        }
        return [...acc]
    }, [] as Inline[])
}

function lastLetter(atom: Inline | undefined): string | undefined {
    if (atom == null || atom.type !== 'word') {
        return
    }

    return atom.letters.at(-1)
}

export function isAtomComplete(atom: Inline | undefined): boolean {
    if (atom == null) {
        return false
    }

    if (atom.type !== 'word') {
        return true
    }

    const lastLetter = atom.letters.at(-1)

    return lastLetter
        ? /\s/.test(lastLetter) || lastLetter === '\n' || lastLetter === 'Enter'
        : false
}

export function isValidKeystroke(e: KnownNativeInputEvent, prev: Keystroke[]) {
    const prevPosition = getPosition(prev)
    const prevCurrentTyped = prevPosition.at(-1)

    if (
        e.inputType === 'insertText' &&
        e.data === ' ' &&
        (lastLetter(prevCurrentTyped) === ' ' ||
            lastLetter(prevCurrentTyped) === '\n')
    )
        return

    return prev.concat({
        type: e.inputType,
        key: e.data ?? '',
    })
}
