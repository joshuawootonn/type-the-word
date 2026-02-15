import { ReactNode } from "react"

export default function Classroomlayout({ children }: { children: ReactNode }) {
    return (
        <main className="typo:prose text-primary marker:text-primary typo:prose-headings:text-primary typo:prose-p:text-pretty typo:prose-p:text-primary relative mx-auto mb-16 w-full grow pt-4 text-lg lg:pt-8">
            {children}
        </main>
    )
}
