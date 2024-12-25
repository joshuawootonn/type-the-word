import { expect, test, describe } from 'vitest'
import { splitLineBySpaceOrNewLine } from './splitBySpaceOrNewLine'

describe('splitLineBySpaceOrNewLine', () => {
    test('works for normal verse number', () => {
        const verseSegment =
            '    [1] Blessed is the man(1)\n        who walks not in the counsel of the wicked,\n    nor stands in the way of sinners,\n        nor sits in the seat of scoffers;\n    [2] but his delight is in the law(2) of the LORD,\n        and on his law he meditates day and night.\n    \n    \n    '

        const result = splitLineBySpaceOrNewLine(verseSegment)
        console.log({ result })

        expect(result.length).toEqual(60)
    })
    test('works brackets in Pslam 145:13c', () => {
        const verseSegment = '  [The LORD is faithful in all his words'

        const result = splitLineBySpaceOrNewLine(verseSegment)

        expect(result.length).toEqual(8)
    })
    test('works brackets in Pslam 145:13d', () => {
        const verseSegment = '    and kind in all his works.]'

        const result = splitLineBySpaceOrNewLine(verseSegment)

        expect(result.length).toEqual(6)
    })
})
