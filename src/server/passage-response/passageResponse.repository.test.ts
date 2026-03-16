import { beforeEach, describe, expect, it, vi } from "vitest"

import { PassageResponseRepository } from "./passageResponse.repository"

describe("PassageResponseRepository", () => {
    const findFirst = vi.fn()
    const insert = vi.fn()
    const update = vi.fn()
    let repository: PassageResponseRepository

    beforeEach(() => {
        findFirst.mockReset()
        insert.mockReset()
        update.mockReset()
        repository = new PassageResponseRepository({
            query: {
                passageResponse: {
                    findFirst,
                },
            },
            insert,
            update,
        } as never)
    })

    it("returns null from findByKey when no entry exists", async () => {
        findFirst.mockResolvedValue(null)

        const result = await repository.findByKey({
            translation: "nkjv",
            book: "romans",
            chapter: 8,
            firstVerse: 0,
            lastVerse: 0,
        })

        expect(result).toBeNull()
    })

    it("returns null from findFreshByKey when entry is stale", async () => {
        vi.spyOn(repository, "findByKey").mockResolvedValue({
            id: "stale-id",
            updatedAt: new Date("2020-01-01T00:00:00.000Z"),
        } as never)

        const result = await repository.findFreshByKey({
            translation: "nkjv",
            book: "romans",
            chapter: 8,
            firstVerse: 38,
            lastVerse: 39,
        })

        expect(result).toBeNull()
    })

    it("falls back when unique constraint is missing", async () => {
        const onConflictDoUpdate = vi
            .fn()
            .mockRejectedValueOnce({ code: "42P10" })
        const values = vi.fn(() => ({ onConflictDoUpdate }))
        insert.mockReturnValue({ values })
        findFirst.mockResolvedValueOnce(null)

        await repository.upsertByKey({
            key: {
                translation: "nkjv",
                book: "romans",
                chapter: 8,
                firstVerse: 0,
                lastVerse: 0,
            },
            response: { data: { reference: "Romans 8" } },
        })

        expect(onConflictDoUpdate).toHaveBeenCalledOnce()
        expect(insert).toHaveBeenCalledTimes(2)
    })
})
