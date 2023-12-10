import { z } from 'zod'
import toProperCase from '~/lib/toProperCase'

export const passageReferenceSchema = z
    .string()
    .transform(s => toProperCase(s.split('_').join(' ')))
    .brand('PassageReference')

export type PassageReference = z.infer<typeof passageReferenceSchema>
