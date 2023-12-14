import clsx from 'clsx'
import { Paragraph, ParsedPassage } from '~/lib/parseEsv'
import React from 'react'
import { currentVerseAtom } from '~/components/arena'
import { useAtom } from 'jotai'
import { CurrentVerse } from '~/components/currentVerse'
import { ReadonlyVerse } from '~/components/readonlyVerse'
import { ibmPlexMono } from '~/pages/_app'

export function Paragraph({
    node,
    passage,
}: {
    passage: ParsedPassage
    node: Paragraph
}) {
    const [currentVerse] = useAtom(currentVerseAtom)
    return (
        <p
            className={clsx(
                'text-lg',
                node.metadata.blockIndent && 'ml-3',
                ibmPlexMono.className,
            )}
        >
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse.value === currentVerse

                if (verse.nodes.length === 0) return null

                return isCurrentVerse ? (
                    <CurrentVerse
                        key={vIndex}
                        verse={verse}
                        isCurrentVerse={isCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                        passage={passage}
                    />
                ) : (
                    <ReadonlyVerse
                        key={vIndex}
                        verse={verse}
                        isCurrentVerse={isCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                    />
                )
            })}
        </p>
    )
}
