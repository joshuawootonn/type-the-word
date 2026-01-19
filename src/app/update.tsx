"use client"

export function Update({ className }: { className?: string }) {
    return (
        <div className={className}>
            Hey there! I just did a major overhaul of how type the word works
            behind the scenes. These changes went into affect this morning.
            Please email me if you find any issues. I just fixed one issue for
            books starting with a number like &quot;2 Thessalonians.&quot;
            Exciting things are coming!
        </div>
    )
}
