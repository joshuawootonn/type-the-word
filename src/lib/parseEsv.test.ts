import { expect, test } from 'vitest'

import { parseChapter, verseRegex } from './parseEsv'

export function sum(a: number, b: number): number {
    return a + b
}
test('parse genesis 1', () => {
    const genesis1Verse1and2 =
        '  [1] In the beginning, God created the heavens and the earth. [2] The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.'

    const result = parseChapter(genesis1Verse1and2).at(0)

    if (result == undefined || result.type !== 'paragraph') {
        throw new Error('result is undefined or not a paragraph')
    }

    expect(result.type).toBe('paragraph')
    expect(result.nodes.length).toBe(2)
})
test('parse psalm 1', () => {
    const psalm1Verse1and2 =
        '    [1] Blessed is the man(1)\n        who walks not in the counsel of the wicked,\n    nor stands in the way of sinners,\n        nor sits in the seat of scoffers;\n    [2] but his delight is in the law(2) of the LORD,\n        and on his law he meditates day and night.\n    \n    \n    '

    const result = parseChapter(psalm1Verse1and2).at(0)

    if (result == undefined || result.type !== 'paragraph') {
        throw new Error('result is undefined or not a paragraph')
    }

    expect(result.type).toBe('paragraph')
    expect(result.nodes.length).toBe(2)
})

test('verseRegex', () => {
    const psalm1 =
        'Psalm 1\n\nBook One\n\nThe Way of the Righteous and the Wicked\n\n    [1] Blessed is the man(1)\n        who walks not in the counsel of the wicked,\n    nor stands in the way of sinners,\n        nor sits in the seat of scoffers;\n    [2] but his delight is in the law(2) of the LORD,\n        and on his law he meditates day and night.\n    \n    \n    [3] He is like a tree\n        planted by streams of water\n    that yields its fruit in its season,\n        and its leaf does not wither.\n    In all that he does, he prospers.\n    [4] The wicked are not so,\n        but are like chaff that the wind drives away.\n    \n    \n    [5] Therefore the wicked will not stand in the judgment,\n        nor sinners in the congregation of the righteous;\n    [6] for the LORD knows the way of the righteous,\n        but the way of the wicked will perish.\n    \n\nFootnotes\n\n(1) 1:1 The singular Hebrew word for *man* (*ish*) is used here to portray a representative example of a godly person; see Preface\n\n(2) 1:2 Or *instruction*\n (ESV)'

    expect(psalm1.match(verseRegex)?.length).toEqual(6)
})
