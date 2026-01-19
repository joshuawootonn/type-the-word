import { expect, test, describe } from "vitest"

import { splitLineBySpaceOrNewLine } from "./splitBySpaceOrNewLine"

describe("splitLineBySpaceOrNewLine", () => {
    test.concurrent("works brackets in Pslam 145:13c", () => {
        const verseSegment = "  [The LORD is faithful in all his words"

        const result = splitLineBySpaceOrNewLine(verseSegment)

        expect(result.length).toEqual(8)
        expect(result).toEqual([
            "[The ",
            "LORD ",
            "is ",
            "faithful ",
            "in ",
            "all ",
            "his ",
            "words",
        ])
    })
    test.concurrent("works brackets in Pslam 145:13d", () => {
        const verseSegment = "    and kind in all his works.]"

        const result = splitLineBySpaceOrNewLine(verseSegment)

        expect(result.length).toEqual(6)
        expect(result).toEqual([
            "and ",
            "kind ",
            "in ",
            "all ",
            "his ",
            "works.]",
        ])
    })

    test.concurrent("doesn't create single space words with verses ending in double space like 1 Kings 4:20", () => {
        const verseSegment =
            "Judah and Israel were as many as the sand by the sea. They ate and drank and were happy.   "

        const result = splitLineBySpaceOrNewLine(verseSegment)

        expect(result.length).toEqual(19)
        expect(result).toEqual([
            "Judah ",
            "and ",
            "Israel ",
            "were ",
            "as ",
            "many ",
            "as ",
            "the ",
            "sand ",
            "by ",
            "the ",
            "sea. ",
            "They ",
            "ate ",
            "and ",
            "drank ",
            "and ",
            "were ",
            "happy. ",
        ])
    })
})
