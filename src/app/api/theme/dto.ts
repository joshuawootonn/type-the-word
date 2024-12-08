import { themeRecordSchema } from '~/server/repositories/theme.repository'

export const themeDTOSchema = themeRecordSchema.omit({
    id: true,
    userId: true,
})
