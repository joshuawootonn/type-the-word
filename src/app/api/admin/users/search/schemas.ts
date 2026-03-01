import { z } from "zod"

export const adminUserSearchItemSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    accountCreatedAt: z.coerce.date(),
    lastTypingSessionAt: z.coerce.date().nullable(),
    lastTypedVerseAt: z.coerce.date().nullable(),
    typingSessionCount: z.number().int().nonnegative(),
    typedVerseCount: z.number().int().nonnegative(),
    activeDaysLast30: z.number().int().nonnegative(),
    versesTypedLast30: z.number().int().nonnegative(),
    hasClassroomData: z.boolean(),
})

export const adminUserSearchResponseSchema = z.object({
    users: z.array(adminUserSearchItemSchema),
})

export type AdminUserSearchItem = z.infer<typeof adminUserSearchItemSchema>
export type AdminUserSearchResponse = z.infer<
    typeof adminUserSearchResponseSchema
>
