import { z } from "zod"

export const adminUserSearchItemSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
})

export const adminUserSearchResponseSchema = z.object({
    users: z.array(adminUserSearchItemSchema),
})

export type AdminUserSearchItem = z.infer<typeof adminUserSearchItemSchema>
export type AdminUserSearchResponse = z.infer<
    typeof adminUserSearchResponseSchema
>
