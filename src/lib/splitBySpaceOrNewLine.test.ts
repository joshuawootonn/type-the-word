import { expect, test } from 'vitest'

import { splitBySpaceOrNewLine } from './splitBySpaceOrNewLine'

test('splitBySpaceOrNewLine', () => {
    const psalm1Verse1and2 =
        '    [1] Blessed is the man(1)\n        who walks not in the counsel of the wicked,\n    nor stands in the way of sinners,\n        nor sits in the seat of scoffers;\n    [2] but his delight is in the law(2) of the LORD,\n        and on his law he meditates day and night.\n    \n    \n    '

    const result = psalm1Verse1and2.split(splitBySpaceOrNewLine)

    expect(result.length).toEqual(146)
})
