import { test, expect, describe } from 'vitest'

import { KnownNativeInputEvent } from '~/components/currentVerse'

import { isValidKeystroke, Keystroke, getPosition } from './keystroke'

function createKeystroke(
    key: string,
    type: Keystroke['type'] = 'insertText',
): Keystroke {
    return {
        type,
        key,
        datetime: new Date().toISOString(),
    }
}

function createInsertEvent(data: string): KnownNativeInputEvent {
    return { inputType: 'insertText', data }
}

function createDeleteEvent(
    inputType:
        | 'deleteContentBackward'
        | 'deleteWordBackward'
        | 'deleteSoftLineBackward',
): KnownNativeInputEvent {
    return { inputType, data: null }
}

describe('isValidKeystroke - space handling', () => {
    test('WHEN double space at the end of a word THEN second space prevented', () => {
        const prev: Keystroke[] = [
            createKeystroke('"'),
            createKeystroke('Y'),
            createKeystroke('o'),
            createKeystroke('u'),
            createKeystroke(' '),
        ]

        const result = isValidKeystroke(createInsertEvent(' '), prev)

        expect(result).toBeUndefined()
    })

    test('WHEN space after newline THEN prevented', () => {
        const prev: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('e'),
            createKeystroke('l'),
            createKeystroke('l'),
            createKeystroke('o'),
            createKeystroke('\n'),
        ]

        const result = isValidKeystroke(createInsertEvent(' '), prev)

        expect(result).toBeUndefined()
    })

    test('WHEN space mid-word THEN valid', () => {
        const prev: Keystroke[] = [createKeystroke('"'), createKeystroke('Y')]

        const result = isValidKeystroke(createInsertEvent(' '), prev)

        expect(result).toBeDefined()
        expect(result?.at(-1)?.key).toBe(' ')
    })

    test('WHEN space after complete word (no trailing space) THEN valid', () => {
        const prev: Keystroke[] = [
            createKeystroke('"'),
            createKeystroke('Y'),
            createKeystroke('o'),
            createKeystroke('u'),
        ]

        const result = isValidKeystroke(createInsertEvent(' '), prev)

        expect(result).toBeDefined()
        expect(result?.at(-1)?.key).toBe(' ')
    })
})

describe('isValidKeystroke - character insertion', () => {
    test('WHEN inserting character at start THEN valid', () => {
        const result = isValidKeystroke(createInsertEvent('H'), [])

        expect(result).toBeDefined()
        expect(result?.length).toBe(1)
        expect(result?.at(-1)?.key).toBe('H')
    })

    test('WHEN inserting character after space THEN valid', () => {
        const prev: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('i'),
            createKeystroke(' '),
        ]

        const result = isValidKeystroke(createInsertEvent('t'), prev)

        expect(result).toBeDefined()
        expect(result?.at(-1)?.key).toBe('t')
    })

    test('WHEN inserting newline THEN valid', () => {
        const prev: Keystroke[] = [createKeystroke('H'), createKeystroke('i')]

        const result = isValidKeystroke(createInsertEvent('\n'), prev)

        expect(result).toBeDefined()
        expect(result?.at(-1)?.key).toBe('\n')
    })
})

describe('isValidKeystroke - delete handling', () => {
    test('WHEN deleteContentBackward with keystrokes THEN valid', () => {
        const prev: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('e'),
            createKeystroke('l'),
        ]

        const result = isValidKeystroke(
            createDeleteEvent('deleteContentBackward'),
            prev,
        )

        expect(result).toBeDefined()
        expect(result?.at(-1)?.type).toBe('deleteContentBackward')
    })

    test('WHEN deleteWordBackward THEN valid', () => {
        const prev: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('e'),
            createKeystroke('l'),
            createKeystroke('l'),
            createKeystroke('o'),
        ]

        const result = isValidKeystroke(
            createDeleteEvent('deleteWordBackward'),
            prev,
        )

        expect(result).toBeDefined()
        expect(result?.at(-1)?.type).toBe('deleteWordBackward')
    })

    test('WHEN deleteSoftLineBackward THEN valid', () => {
        const prev: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('i'),
            createKeystroke(' '),
            createKeystroke('t'),
            createKeystroke('h'),
            createKeystroke('e'),
            createKeystroke('r'),
            createKeystroke('e'),
        ]

        const result = isValidKeystroke(
            createDeleteEvent('deleteSoftLineBackward'),
            prev,
        )

        expect(result).toBeDefined()
        expect(result?.at(-1)?.type).toBe('deleteSoftLineBackward')
    })
})

describe('getPosition - builds position from keystrokes', () => {
    test('WHEN empty keystrokes THEN empty position', () => {
        const result = getPosition([])

        expect(result).toEqual([])
    })

    test('WHEN single word THEN one word atom', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('i'),
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({ type: 'word', letters: ['H', 'i'] })
    })

    test('WHEN word with space THEN word is complete', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('i'),
            createKeystroke(' '),
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({ type: 'word', letters: ['H', 'i', ' '] })
    })

    test('WHEN two words THEN two word atoms', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('i'),
            createKeystroke(' '),
            createKeystroke('y'),
            createKeystroke('o'),
            createKeystroke('u'),
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ type: 'word', letters: ['H', 'i', ' '] })
        expect(result[1]).toEqual({ type: 'word', letters: ['y', 'o', 'u'] })
    })

    test('WHEN deleteContentBackward mid-word THEN removes last letter', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('e'),
            createKeystroke('l'),
            createKeystroke('', 'deleteContentBackward'),
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({ type: 'word', letters: ['H', 'e'] })
    })

    test('WHEN deleteContentBackward on single letter word THEN removes word', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('', 'deleteContentBackward'),
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(0)
    })

    test('WHEN deleteWordBackward THEN removes last word atom', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('i'),
            createKeystroke(' '),
            createKeystroke('t'),
            createKeystroke('h'),
            createKeystroke('e'),
            createKeystroke('r'),
            createKeystroke('e'),
            createKeystroke('', 'deleteWordBackward'),
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({ type: 'word', letters: ['H', 'i', ' '] })
    })

    test('WHEN deleteSoftLineBackward THEN clears all', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('H'),
            createKeystroke('i'),
            createKeystroke(' '),
            createKeystroke('t'),
            createKeystroke('h'),
            createKeystroke('e'),
            createKeystroke('r'),
            createKeystroke('e'),
            createKeystroke('', 'deleteSoftLineBackward'),
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(0)
    })

    test('WHEN quote characters THEN normalized to standard quote', () => {
        const keystrokes: Keystroke[] = [
            createKeystroke('"'), // fancy quote
            createKeystroke('H'),
            createKeystroke('i'),
            createKeystroke('"'), // fancy quote
        ]

        const result = getPosition(keystrokes)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
            type: 'word',
            letters: ['"', 'H', 'i', '"'],
        })
    })
})
