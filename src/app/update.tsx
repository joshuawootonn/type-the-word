'use client'

import { formatDistance } from 'date-fns'

export function Update({ className }: { className?: string }) {
    const duration = formatDistance(new Date(2024, 5, 30, 8, 0, 0), new Date())

    return (
        <div className={className}>
            Hey there! I just did a major overhaul of how type the word works
            behind the scenes. These changes went into affect {duration} ago.
            Please email me if you find any issues. I just fixed one issue for
            books starting with a number like &quot;2 Thessalonians.&quot;
            Exciting things are coming!
        </div>
    )
}
