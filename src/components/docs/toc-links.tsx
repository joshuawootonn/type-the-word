"use client"

import { useEffect, useState } from "react"

import { TocItem } from "~/lib/docs/types"

interface TocLinksProps {
    toc: TocItem[]
}

export function TocLinks({ toc }: TocLinksProps) {
    const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null)

    useEffect(() => {
        if (toc.length === 0) {
            setActiveId(null)
            return
        }

        const headingElements = toc
            .map(item => document.getElementById(item.id))
            .filter((el): el is HTMLElement => el != null)

        if (headingElements.length === 0) {
            return
        }

        const viewportOffset = 140
        const hysteresisPx = 18
        let animationFrame = 0

        const pickClosestHeading = () => {
            const positions = headingElements.map(el => ({
                id: el.id,
                top: el.getBoundingClientRect().top,
            }))

            const nearestAbove = positions
                .filter(pos => pos.top <= viewportOffset)
                .sort((a, b) => b.top - a.top)[0]

            if (!nearestAbove) {
                const nearestBelow = positions.sort((a, b) => a.top - b.top)[0]
                setActiveId(nearestBelow?.id ?? null)
                return
            }

            const candidateId = nearestAbove.id

            // Hysteresis: avoid rapid toggling between adjacent headings near boundary.
            setActiveId(prevId => {
                if (!prevId || prevId === candidateId) {
                    return candidateId
                }

                const previous = positions.find(pos => pos.id === prevId)
                const candidate = positions.find(pos => pos.id === candidateId)

                if (!previous || !candidate) {
                    return candidateId
                }

                const previousDistance = Math.abs(previous.top - viewportOffset)
                const candidateDistance = Math.abs(
                    candidate.top - viewportOffset,
                )

                if (candidateDistance + hysteresisPx < previousDistance) {
                    return candidateId
                }

                return prevId
            })
        }

        const schedulePick = () => {
            cancelAnimationFrame(animationFrame)
            animationFrame = requestAnimationFrame(pickClosestHeading)
        }

        window.addEventListener("scroll", schedulePick, { passive: true })
        window.addEventListener("resize", schedulePick)
        schedulePick()

        return () => {
            cancelAnimationFrame(animationFrame)
            window.removeEventListener("scroll", schedulePick)
            window.removeEventListener("resize", schedulePick)
        }
    }, [toc])

    return (
        <aside className="border-primary sticky top-16 hidden h-[calc(100vh-8rem)] w-full max-w-64 pl-4 xl:block">
            <ul className="space-y-2 text-sm">
                {toc.length < 2
                    ? null
                    : toc.map(item => (
                          <li
                              key={item.id}
                              className={`${item.level === 3 ? "ml-3" : ""} relative`}
                          >
                              {activeId === item.id ? (
                                  <span
                                      aria-hidden
                                      className="bg-primary absolute top-1 bottom-1 -left-3 w-0.5"
                                  />
                              ) : null}
                              <a
                                  href={`#${item.id}`}
                                  className={`svg-outline-sm relative block no-underline hover:underline`}
                              >
                                  {item.text}
                              </a>
                          </li>
                      ))}
            </ul>
        </aside>
    )
}
