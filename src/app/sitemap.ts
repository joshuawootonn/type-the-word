import { MetadataRoute } from 'next'
import { getBaseUrl } from '~/lib/api'

export default function sitemap(): MetadataRoute.Sitemap {
    const urls = [
        '/',
        '/changelog',
        '/copyright',
        '/history',
        '/privacy-policy',
        '/terms-of-service',
        '/why',
    ]

    const baseUrl = getBaseUrl()

    return urls.map(url => ({
        url: new URL(url, baseUrl).href,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    }))
}
