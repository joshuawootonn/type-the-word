import { Inline } from '~/lib/parseEsv'
import React from 'react'
import {
    isAtomEqual,
    isAtomTyped,
    validEmDash,
    validEnter,
    validQuotes,
    validSingleQuotes,
} from '~/lib/isEqual'

export type Keystroke = { type: 'backspace' | 'insert'; key: string }

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

    if (validEmDash.includes(key)) {
        return '—'
    }

    return key
}
export function getPosition(keystrokes: Keystroke[] = []): Inline[] {
    return keystrokes.reduce((acc, keystroke) => {
        const last = acc.at(-1)
        if (keystroke.type === 'insert' && keystroke.key) {
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
        } else if (keystroke.type === 'backspace') {
            if (last?.type === 'word' && last.letters.length > 1) {
                return [
                    ...acc.slice(0, -1),
                    { ...last, letters: last.letters.slice(0, -1) },
                ]
            }

            return acc.slice(0, -1)
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

export function isValidKeystroke(
    key: React.KeyboardEvent<HTMLInputElement>['key'],
    currentVerse: Inline[],
    prev: Keystroke[],
) {
    const correctAtomNodes = currentVerse.filter(isAtomTyped)
    const prevPosition = getPosition(prev)
    const prevCurrentCorrect = correctAtomNodes.at(prevPosition.length - 1)
    const prevCurrentTyped = prevPosition.at(-1)
    const isPrevCurrentCorrect = isAtomEqual(
        prevCurrentTyped,
        prevCurrentCorrect,
    )

    /**
     * When you complete a correct word you can't undo it.
     */
    if (
        (key === 'Backspace' && prevPosition.length === 0) ||
        (key === 'Backspace' &&
            isAtomComplete(prevCurrentTyped) &&
            isPrevCurrentCorrect)
    )
        return

    if (
        (key === ' ' || key === 'Enter') &&
        (lastLetter(prevCurrentTyped) === ' ' ||
            lastLetter(prevCurrentTyped) === '\n')
    )
        return

    /**
     * If the correct word cap is a newline then prevent a space.
     */

    if (
        (lastLetter(prevCurrentCorrect) === ' ' && key === 'Enter') ||
        (lastLetter(prevCurrentCorrect) === '\n' && key === ' ')
    ) {
        return
    }

    return prev.concat({
        type: key === 'Backspace' ? 'backspace' : 'insert',
        key,
    })
}
