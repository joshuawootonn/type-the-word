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
    test('happy path with verses', () => {
        const result = createESVURL({
            book: 'jude',
            chapter: 1,
            firstVerse: 1,
            lastVerse: 5,
        })

        expect(result).toBe('https://api.esv.org/v3/passage/html/?q=jude 1-5')
    })
})
