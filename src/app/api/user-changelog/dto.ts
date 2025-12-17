import { z } from 'zod'

import { userChangelogRecordSchema } from '~/server/repositories/userChangelog.repository'

export const DTOToRecordSchema = z
    .object({ lastVisitedAt: z.string() })
    .transform(value =>
        userChangelogRecordSchema
            .pick({ lastVisitedAt: true })
            .parse({ lastVisitedAt: new Date(value.lastVisitedAt) }),
    )
