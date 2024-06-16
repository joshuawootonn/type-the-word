import { test, expect, describe } from 'vitest'

import { Verse } from '~/lib/parseEsv'
import { isValidKeystroke } from './keystroke'

describe.skip('Enter/space are valid keystrokes', () => {
    test('WHEN  double space at the end of a word THEN second space  prevented', () => {
        const next = isValidKeystroke(' ', Matthew513, [
            { type: 'insert', key: '"' },
            { type: 'insert', key: 'Y' },
            { type: 'insert', key: 'o' },
            { type: 'insert', key: 'u' },
            { type: 'insert', key: ' ' },
        ])

        expect(next).toEqual(undefined)
    })
    test('WHEN enter beginning of a word THEN prevented', () => {
        const next = isValidKeystroke('Enter', Matthew513, [
            { type: 'insert', key: '"' },
            { type: 'insert', key: 'Y' },
            { type: 'insert', key: 'o' },
            { type: 'insert', key: 'u' },
            { type: 'insert', key: ' ' },
        ])

        expect(next).toEqual(undefined)
    })
    test('WHEN space early THEN valid', () => {
        const next = isValidKeystroke(' ', Matthew513, [
            { type: 'insert', key: '"' },
            { type: 'insert', key: 'Y' },
        ])

        expect(next).toBeDefined()
    })

    test('WHEN space correctly THEN valid', () => {
        const next = isValidKeystroke(' ', Matthew513, [
            { type: 'insert', key: '"' },
            { type: 'insert', key: 'Y' },
            { type: 'insert', key: 'o' },
            { type: 'insert', key: 'u' },
        ])

        expect(next).toBeDefined()
    })
    test('WHEN enter instead of the valid space THEN prevented', () => {
        const next = isValidKeystroke('Enter', Matthew513, [
            { type: 'insert', key: '"' },
            { type: 'insert', key: 'Y' },
            { type: 'insert', key: 'o' },
            { type: 'insert', key: 'u' },
        ])

        expect(next).toBeUndefined()
    })
})

describe.skip('Backspace is valid keystroke', () => {
    test('WHEN backspace at start of verse THEN prevented', () => {
        const next = isValidKeystroke('Backspace', Matthew513, [])

        expect(next).toBeUndefined()
    })

    test('WHEN backspace mid word THEN valid', () => {
        const next = isValidKeystroke('Backspace', Matthew513, [
            { type: 'insert', key: '"' },
            { type: 'insert', key: 'Y' },
            { type: 'insert', key: 'o' },
        ])

        expect(next).toBeDefined()
    })

    test('WHEN backspace on complete correct word THEN prevented', () => {
        const next = isValidKeystroke('Backspace', Matthew513, [
            { type: 'insert', key: '"' },
            { type: 'insert', key: 'Y' },
            { type: 'insert', key: 'o' },
            { type: 'insert', key: 'u' },
            { type: 'insert', key: ' ' },
        ])

        expect(next).toBeUndefined()
    })

    test('WHEN backspace on complete correct word with new line THEN prevented', () => {
        const next = isValidKeystroke('Backspace', Psalm13, [
            { type: 'insert', key: 'H' },
            { type: 'insert', key: 'e' },
            { type: 'insert', key: ' ' },
            { type: 'insert', key: 'i' },
            { type: 'insert', key: 's' },
            { type: 'insert', key: ' ' },
            { type: 'insert', key: 'l' },
            { type: 'insert', key: 'i' },
            { type: 'insert', key: 'k' },
            { type: 'insert', key: 'e' },
            { type: 'insert', key: ' ' },
            { type: 'insert', key: 'a' },
            { type: 'insert', key: ' ' },
            { type: 'insert', key: 't' },
            { type: 'insert', key: 'r' },
            { type: 'insert', key: 'e' },
            { type: 'insert', key: 'e' },
            { type: 'insert', key: 'Enter' },
        ])

        expect(next).toBeUndefined()
    })
})

const Psalm13: Verse = {
    type: 'verse',
    verse: '3',
    text: '[3] He is like a tree\n        planted by streams of water\n    that yields its fruit in its season,\n        and its leaf does not wither.\n    In all that he does, he prospers.\n    ',
    nodes: [
        {
            type: 'verseNumber',
            number: '3',
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'word',
            letters: ['H', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['i', 's', ' '],
        },
        {
            type: 'word',
            letters: ['l', 'i', 'k', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['a', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'r', 'e', 'e', '\n'],
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'word',
            letters: ['p', 'l', 'a', 'n', 't', 'e', 'd', ' '],
        },
        {
            type: 'word',
            letters: ['b', 'y', ' '],
        },
        {
            type: 'word',
            letters: ['s', 't', 'r', 'e', 'a', 'm', 's', ' '],
        },
        {
            type: 'word',
            letters: ['o', 'f', ' '],
        },
        {
            type: 'word',
            letters: ['w', 'a', 't', 'e', 'r', '\n'],
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'word',
            letters: ['t', 'h', 'a', 't', ' '],
        },
        {
            type: 'word',
            letters: ['y', 'i', 'e', 'l', 'd', 's', ' '],
        },
        {
            type: 'word',
            letters: ['i', 't', 's', ' '],
        },
        {
            type: 'word',
            letters: ['f', 'r', 'u', 'i', 't', ' '],
        },
        {
            type: 'word',
            letters: ['i', 'n', ' '],
        },
        {
            type: 'word',
            letters: ['i', 't', 's', ' '],
        },
        {
            type: 'word',
            letters: ['s', 'e', 'a', 's', 'o', 'n', ',', '\n'],
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'word',
            letters: ['a', 'n', 'd', ' '],
        },
        {
            type: 'word',
            letters: ['i', 't', 's', ' '],
        },
        {
            type: 'word',
            letters: ['l', 'e', 'a', 'f', ' '],
        },
        {
            type: 'word',
            letters: ['d', 'o', 'e', 's', ' '],
        },
        {
            type: 'word',
            letters: ['n', 'o', 't', ' '],
        },
        {
            type: 'word',
            letters: ['w', 'i', 't', 'h', 'e', 'r', '.', '\n'],
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'word',
            letters: ['I', 'n', ' '],
        },
        {
            type: 'word',
            letters: ['a', 'l', 'l', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'h', 'a', 't', ' '],
        },
        {
            type: 'word',
            letters: ['h', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['d', 'o', 'e', 's', ',', ' '],
        },
        {
            type: 'word',
            letters: ['h', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['p', 'r', 'o', 's', 'p', 'e', 'r', 's', '.', '\n'],
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
    ],
}

const Matthew513: Verse = {
    type: 'verse',
    verse: '13',
    text: '  [13] “You are the salt of the earth, but if salt has lost its taste, how shall its saltiness be restored? It is no longer good for anything except to be thrown out and trampled under people’s feet.',
    nodes: [
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'verseNumber',
            number: '13',
        },
        {
            type: 'space',
            typed: false,
        },
        {
            type: 'word',
            letters: ['“', 'Y', 'o', 'u', ' '],
        },
        {
            type: 'word',
            letters: ['a', 'r', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'h', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['s', 'a', 'l', 't', ' '],
        },
        {
            type: 'word',
            letters: ['o', 'f', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'h', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['e', 'a', 'r', 't', 'h', ',', ' '],
        },
        {
            type: 'word',
            letters: ['b', 'u', 't', ' '],
        },
        {
            type: 'word',
            letters: ['i', 'f', ' '],
        },
        {
            type: 'word',
            letters: ['s', 'a', 'l', 't', ' '],
        },
        {
            type: 'word',
            letters: ['h', 'a', 's', ' '],
        },
        {
            type: 'word',
            letters: ['l', 'o', 's', 't', ' '],
        },
        {
            type: 'word',
            letters: ['i', 't', 's', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'a', 's', 't', 'e', ',', ' '],
        },
        {
            type: 'word',
            letters: ['h', 'o', 'w', ' '],
        },
        {
            type: 'word',
            letters: ['s', 'h', 'a', 'l', 'l', ' '],
        },
        {
            type: 'word',
            letters: ['i', 't', 's', ' '],
        },
        {
            type: 'word',
            letters: ['s', 'a', 'l', 't', 'i', 'n', 'e', 's', 's', ' '],
        },
        {
            type: 'word',
            letters: ['b', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['r', 'e', 's', 't', 'o', 'r', 'e', 'd', '?', ' '],
        },
        {
            type: 'word',
            letters: ['I', 't', ' '],
        },
        {
            type: 'word',
            letters: ['i', 's', ' '],
        },
        {
            type: 'word',
            letters: ['n', 'o', ' '],
        },
        {
            type: 'word',
            letters: ['l', 'o', 'n', 'g', 'e', 'r', ' '],
        },
        {
            type: 'word',
            letters: ['g', 'o', 'o', 'd', ' '],
        },
        {
            type: 'word',
            letters: ['f', 'o', 'r', ' '],
        },
        {
            type: 'word',
            letters: ['a', 'n', 'y', 't', 'h', 'i', 'n', 'g', ' '],
        },
        {
            type: 'word',
            letters: ['e', 'x', 'c', 'e', 'p', 't', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'o', ' '],
        },
        {
            type: 'word',
            letters: ['b', 'e', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'h', 'r', 'o', 'w', 'n', ' '],
        },
        {
            type: 'word',
            letters: ['o', 'u', 't', ' '],
        },
        {
            type: 'word',
            letters: ['a', 'n', 'd', ' '],
        },
        {
            type: 'word',
            letters: ['t', 'r', 'a', 'm', 'p', 'l', 'e', 'd', ' '],
        },
        {
            type: 'word',
            letters: ['u', 'n', 'd', 'e', 'r', ' '],
        },
        {
            type: 'word',
            letters: ['p', 'e', 'o', 'p', 'l', 'e', '’', 's', ' '],
        },
        {
            type: 'word',
            letters: ['f', 'e', 'e', 't', '.'],
        },
    ],
}
