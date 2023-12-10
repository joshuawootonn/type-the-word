import { describe, expect, test } from 'vitest'
import { stringToPassageObject } from '~/lib/passageObject'

describe('Enter/space are valid keystrokes', () => {
    test('WHEN  double space at the end of a word THEN second space  prevented', () => {
        const result = stringToPassageObject.parse('Song of Solomon 1')

        expect(result).toEqual({
            book: 'song_of_solomon',
            chapter: 1,
            verses: 17,
        })
    })
    test('WHEN  double space at the end of a word THEN second space  prevented', () => {
        const result = stringToPassageObject.parse('John 3')

        expect(result).toEqual({
            book: 'john',
            chapter: 3,
            verses: 36,
        })
    })
})
