import { describe, expect, test } from "vitest"

import { stringToPassageObject } from "~/lib/passageObject"

import { passageReferenceSchema } from "./passageReference"

describe("passageObject parsing", () => {
    test("WHEN multiword book THEN success", () => {
        const result = stringToPassageObject.parse("Song of Solomon 1")

        expect(result).toEqual({
            book: "song_of_solomon",
            chapter: 1,
            firstVerse: 1,
        })
    })
    test("WHEN single word book THEN success", () => {
        const result = stringToPassageObject.parse("1 John 3")

        expect(result).toEqual({
            book: "1_john",
            chapter: 3,
            firstVerse: 1,
        })
    })
    test("WHEN verse included THEN success", () => {
        const result = stringToPassageObject.parse("John 3:16")

        expect(result).toEqual({
            book: "john",
            chapter: 3,
            firstVerse: 16,
            lastVerse: 16,
        })
    })
    test("WHEN verses included THEN success", () => {
        const result = stringToPassageObject.parse("John 3:10-12")

        expect(result).toEqual({
            book: "john",
            chapter: 3,
            firstVerse: 10,
            lastVerse: 12,
        })
    })

    test("WHEN using url segment THEN you need to use passageReferenceSchema ", () => {
        const result = stringToPassageObject.parse(
            passageReferenceSchema.parse("2_thessalonians_2"),
        )

        expect(result).toEqual({
            book: "2_thessalonians",
            chapter: 2,
            firstVerse: 1,
        })
    })
})
