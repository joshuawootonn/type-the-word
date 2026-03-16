import { isAfter, subDays } from "date-fns"
import { and, eq } from "drizzle-orm"
import { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import * as schema from "~/server/db/schema"

import { PassageResponseCacheKey } from "./cache-key"

const DEFAULT_CACHE_FRESHNESS_DAYS = 31

function isMissingOnConflictConstraintError(error: unknown): boolean {
    if (typeof error !== "object" || error == null) {
        return false
    }
    if (!("code" in error)) {
        return false
    }
    const maybeCode = Reflect.get(error, "code")
    return maybeCode === "42P10"
}

export class PassageResponseRepository {
    db: PostgresJsDatabase<typeof schema>

    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    async findByKey(
        key: PassageResponseCacheKey,
    ): Promise<typeof schema.passageResponse.$inferSelect | null> {
        const record = await this.db.query.passageResponse.findFirst({
            where: and(
                eq(schema.passageResponse.translation, key.translation),
                eq(schema.passageResponse.book, key.book),
                eq(schema.passageResponse.chapter, key.chapter),
                eq(schema.passageResponse.firstVerse, key.firstVerse),
                eq(schema.passageResponse.lastVerse, key.lastVerse),
            ),
        })

        return record ?? null
    }

    async findFreshByKey(
        key: PassageResponseCacheKey,
        maxAgeInDays: number = DEFAULT_CACHE_FRESHNESS_DAYS,
    ): Promise<typeof schema.passageResponse.$inferSelect | null> {
        const record = await this.findByKey(key)
        if (record == null) {
            return null
        }
        if (!isAfter(record.updatedAt, subDays(new Date(), maxAgeInDays))) {
            return null
        }
        return record
    }

    async upsertByKey(args: {
        key: PassageResponseCacheKey
        response: unknown
    }): Promise<void> {
        try {
            await this.db
                .insert(schema.passageResponse)
                .values({
                    translation: args.key.translation,
                    book: args.key.book,
                    chapter: args.key.chapter,
                    firstVerse: args.key.firstVerse,
                    lastVerse: args.key.lastVerse,
                    response: args.response,
                })
                .onConflictDoUpdate({
                    target: [
                        schema.passageResponse.translation,
                        schema.passageResponse.book,
                        schema.passageResponse.chapter,
                        schema.passageResponse.firstVerse,
                        schema.passageResponse.lastVerse,
                    ],
                    set: {
                        response: args.response,
                    },
                })
            return
        } catch (error: unknown) {
            if (!isMissingOnConflictConstraintError(error)) {
                throw error
            }
        }

        const existing = await this.findByKey(args.key)
        if (existing == null) {
            await this.db.insert(schema.passageResponse).values({
                translation: args.key.translation,
                book: args.key.book,
                chapter: args.key.chapter,
                firstVerse: args.key.firstVerse,
                lastVerse: args.key.lastVerse,
                response: args.response,
            })
            return
        }

        await this.db
            .update(schema.passageResponse)
            .set({ response: args.response })
            .where(eq(schema.passageResponse.id, existing.id))
    }
}
