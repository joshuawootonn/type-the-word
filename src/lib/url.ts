import { z } from 'zod'

export const encodedUrlSchema = z.string().brand('EncodedUrl')
export type EncodedUrl = z.infer<typeof encodedUrlSchema>

export function encodeUrl(passage: string): EncodedUrl {
    return encodedUrlSchema.parse(passage.split(' ').join('_').toLowerCase())
}

export const decodedUrlSchema = z.string().brand('DecodedUrl')
export type DecodedUrl = z.infer<typeof decodedUrlSchema>

export function decodeUrl(passage: string): DecodedUrl {
    return decodedUrlSchema.parse(passage.split('_').join(' ').toLowerCase())
}
