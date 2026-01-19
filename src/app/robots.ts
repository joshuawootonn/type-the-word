import { MetadataRoute } from "next"

import { getBaseUrl } from "~/lib/api"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
        },
        host: getBaseUrl(),
        sitemap: `${getBaseUrl()}/sitemap.xml`,
    }
}
