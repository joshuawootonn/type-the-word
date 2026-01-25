import { ReactNode } from "react"

export default function Classroomlayout({ children }: { children: ReactNode }) {
    return (
        <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg text-primary marker:text-primary prose-headings:text-primary prose-p:text-pretty prose-p:text-primary lg:pt-8">
            {children}
        </main>
    )
}
