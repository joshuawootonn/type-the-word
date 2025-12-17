import { describe, expect, it } from 'vitest'

import { formatVerseReference } from './userDailyActivity.repository'

describe('formatVerseReference', () => {
    it('formats simple book names', () => {
        expect(formatVerseReference('genesis', 1, 1)).toBe('Genesis 1:1')
        expect(formatVerseReference('exodus', 20, 3)).toBe('Exodus 20:3')
        expect(formatVerseReference('john', 3, 16)).toBe('John 3:16')
    })

    it('formats book names with underscores (numbered books)', () => {
        expect(formatVerseReference('1_samuel', 17, 47)).toBe('1 Samuel 17:47')
        expect(formatVerseReference('2_kings', 5, 14)).toBe('2 Kings 5:14')
        expect(formatVerseReference('1_corinthians', 13, 4)).toBe(
            '1 Corinthians 13:4',
        )
        expect(formatVerseReference('2_timothy', 3, 16)).toBe('2 Timothy 3:16')
    })

    it('formats multi-word book names', () => {
        expect(formatVerseReference('song_of_solomon', 2, 4)).toBe(
            'Song Of Solomon 2:4',
        )
    })

    it('handles single chapter books', () => {
        expect(formatVerseReference('philemon', 1, 6)).toBe('Philemon 1:6')
        expect(formatVerseReference('jude', 1, 3)).toBe('Jude 1:3')
        expect(formatVerseReference('obadiah', 1, 4)).toBe('Obadiah 1:4')
    })

    it('handles various chapter and verse numbers', () => {
        expect(formatVerseReference('psalm', 119, 105)).toBe('Psalm 119:105')
        expect(formatVerseReference('isaiah', 53, 5)).toBe('Isaiah 53:5')
        expect(formatVerseReference('revelation', 22, 21)).toBe(
            'Revelation 22:21',
        )
    })
})
