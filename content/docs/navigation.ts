import { DocsNavItem } from "../../src/lib/docs/types"

export const docsNavigation: DocsNavItem[] = [
    {
        title: "Overview",
        href: "/docs",
    },
    {
        title: "Google Classroom",
        icon: "backpack",
        items: [
            {
                title: "Enable Google Workspace",
                href: "/docs/guides/google-classroom/enable-google-workspace",
            },
            {
                title: "Connect Teacher Account",
                href: "/docs/guides/google-classroom/connect-teacher-account",
            },
            {
                title: "Create Assignment",
                href: "/docs/guides/google-classroom/create-assignment",
            },
            {
                title: "Track Student Progression",
                href: "/docs/guides/google-classroom/track-student-progression",
            },
            {
                title: "Connect Student Account",
                href: "/docs/guides/google-classroom/connect-student-account",
            },
            {
                title: "Complete Assignments",
                href: "/docs/guides/google-classroom/complete-assignments",
            },
        ],
    },
]
