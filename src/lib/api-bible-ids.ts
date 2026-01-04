import { Translation } from '~/lib/parseEsv'

/**
 * Translations that use API.Bible (excludes ESV which uses ESV API).
 */
export type ApiBibleTranslation = Exclude<Translation, 'esv'>

/**
 * API.Bible IDs for each translation we support.
 * ESV is excluded because it uses a different API (ESV API).
 *
 * @see https://rest.api.bible/
 */
export const API_BIBLE_IDS: Record<ApiBibleTranslation, string> = {
    bsb: 'bba9f40183526463-01', // Berean Standard Bible
    nlt: 'd6e14a625393b4da-01', // New Living Translation
    niv: '78a9f6124f344018-01', // New International Version 2011
    csb: 'a556c5305ee15c3f-01', // Christian Standard Bible
    nkjv: '63097d2a0a2f7db3-01', // New King James Version
    nasb: 'a761ca71e0b3ddcf-01', // New American Standard Bible 2020
    ntv: '826f63861180e056-01', // Nueva Traducción Viviente
    msg: '6f11a7de016f942e-01', // The Message
}
