import type { MDXComponents } from "mdx/types"

import { docsMdxComponents } from "~/components/docs/mdx-components"

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...docsMdxComponents,
        ...components,
    }
}
