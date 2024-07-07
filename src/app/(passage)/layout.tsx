import { ReactNode } from 'react'

export default function PassageLayout({ children }: { children: ReactNode }) {
    return <main className="relative mx-auto w-full flex-grow">{children}</main>
}
