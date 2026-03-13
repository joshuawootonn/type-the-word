import { ReactNode } from "react"

import { ClassroomProviders } from "~/app/(classroom)/classroom/providers"

export default function ClassroomLayout({ children }: { children: ReactNode }) {
    return <ClassroomProviders>{children}</ClassroomProviders>
}
