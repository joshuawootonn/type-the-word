import clsx from 'clsx'
import { Paragraph, ParsedPassage } from '~/lib/parseEsv'
import React from 'react'
import { currentVerseAtom } from '~/components/arena'
import { useAtom } from 'jotai'
import { CurrentVerse } from '~/components/currentVerse'
import { ReadonlyVerse } from '~/components/readonlyVerse'

export function Paragraph({
    node,
    passage,
}: {
    passage: ParsedPassage
    node: Paragraph
}) {
    const [currentVerse] = useAtom(currentVerseAtom)
    return (
        <p className={clsx('text-lg', node.metadata.blockIndent && 'ml-3')}>
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse.value === currentVerse

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
