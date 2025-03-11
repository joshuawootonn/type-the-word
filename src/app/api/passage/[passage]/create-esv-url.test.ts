import { describe, expect, test } from 'vitest'
import { createESVURL } from './create-esv-url'

describe('createESVURL', () => {
    test('happy path chapter only with includeVerses', () => {
        const result = createESVURL({ book: 'matthew', chapter: 1 }, true)

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=matthew 1')
    })
    test('happy path chapter only with includeVerses false', () => {
        const result = createESVURL({ book: 'matthew', chapter: 1 }, false)

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=matthew 1')
    })
    test('happy path with verses with includeVerses', () => {
        const result = createESVURL(
            {
                book: 'matthew',
                chapter: 1,
                firstVerse: 1,
                lastVerse: 5,
            },
            true,
        )

        expect(result).toBe(
            'https://api.esv.org/v3/passage/html/?q=matthew 1:1-5',
        )
    })
    test('happy path with verses with includeVerses false', () => {
        const result = createESVURL(
            {
                book: 'matthew',
                chapter: 1,
                firstVerse: 1,
                lastVerse: 5,
            },
            false,
        )

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=matthew 1')
    })
    test('jude chapter only with includeVerses', () => {
        const result = createESVURL({ book: 'jude', chapter: 1 }, true)

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=jude')
    })
    test('jude chapter only with includeVerses false', () => {
        const result = createESVURL({ book: 'jude', chapter: 1 }, false)

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=jude')
    })
    test('happy path with verses with includeVerses', () => {
        const result = createESVURL(
            {
                book: 'jude',
                chapter: 1,
                firstVerse: 1,
                lastVerse: 5,
            },
            true,
        )

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=jude 1-5')
    })
    test('happy path with verses with includeVerses false', () => {
        const result = createESVURL(
            {
                book: 'jude',
                chapter: 1,
                firstVerse: 1,
                lastVerse: 5,
            },
            false,
        )

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=jude')
    })
})
