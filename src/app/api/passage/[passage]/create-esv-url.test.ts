import { describe, expect, test } from 'vitest'
import { createESVURL } from './create-esv-url'

describe('createESVURL', () => {
    test('happy path chapter only', () => {
        const result = createESVURL({ book: 'matthew', chapter: 1 })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=matthew 1')
    })
    test('happy path with verses', () => {
        const result = createESVURL({
            book: 'matthew',
            chapter: 1,
            firstVerse: 1,
            lastVerse: 5,
        })

        expect(result).toBe(
            'https://api.esv.org/v3/passage/html/?q=matthew 1:1-5',
        )
    })
    test('jude chapter only', () => {
        const result = createESVURL({ book: 'jude', chapter: 1 })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=jude')
    })
    test('jude with verses', () => {
        const result = createESVURL({
            book: 'jude',
            chapter: 1,
            firstVerse: 1,
            lastVerse: 5,
        })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=jude 1-5')
    })
    test('obadiah chapter only', () => {
        const result = createESVURL({ book: 'obadiah', chapter: 1 })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=obadiah')
    })
    test('obadiah with verses', () => {
        const result = createESVURL({
            book: 'obadiah',
            chapter: 1,
            firstVerse: 1,
            lastVerse: 5,
        })

        expect(result).toBe(
            'https://api.esv.org/v3/passage/html/?q=obadiah 1-5',
        )
    })
    test('philemon chapter only', () => {
        const result = createESVURL({ book: 'philemon', chapter: 1 })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=philemon')
    })
    test('philemon with verses', () => {
        const result = createESVURL({
            book: 'philemon',
            chapter: 1,
            firstVerse: 1,
            lastVerse: 5,
        })

        expect(result).toBe(
            'https://api.esv.org/v3/passage/html/?q=philemon 1-5',
        )
    })
    test('2 john chapter only', () => {
        const result = createESVURL({ book: '2_john', chapter: 1 })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=2 john 1')
    })
    test('2 john with verses', () => {
        const result = createESVURL({
            book: '2_john',
            chapter: 1,
            firstVerse: 1,
            lastVerse: 5,
        })

        expect(result).toBe(
            'https://api.esv.org/v3/passage/html/?q=2 john 1:1-5',
        )
    })
    test('3 john chapter only', () => {
        const result = createESVURL({ book: '3_john', chapter: 1 })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=3 john 1')
    })
    test('3 john with verses', () => {
        const result = createESVURL({
            book: '3_john',
            chapter: 1,
            firstVerse: 1,
            lastVerse: 5,
        })

        expect(result).toBe(
            'https://api.esv.org/v3/passage/html/?q=3 john 1:1-5',
        )
    })
})
