import { DocsNavItem } from "../../src/lib/docs/types"

export const docsNavigation: DocsNavItem[] = [
    {
        title: "Overview",
        href: "/docs",
    },
    {
        title: "Google Classroom",
        href: "/docs/google-classroom",
        icon: "backpack",
        items: [
            {
                title: "Enable Google Workspace",
                href: "/docs/google-classroom/enable-google-workspace",
            },
            {
                title: "Teachers",
                items: [
                    {
                        title: "Connect Teacher Account",
                        href: "/docs/google-classroom/connect-teacher-account",
                    },
                    {
                        title: "Create Assignment",
                        href: "/docs/google-classroom/create-assignment",
                    },
                    {
                        title: "Track Student Progression",
                        href: "/docs/google-classroom/track-student-progression",
                    },
                ],
            },
            {
                title: "Students",
                items: [
                    {
                        title: "Connect Student Account",
                        href: "/docs/google-classroom/connect-student-account",
                    },
                    {
                        title: "Complete Assignments",
                        href: "/docs/google-classroom/complete-assignments",
                    },
                ],
            },
        ],
    },
]
