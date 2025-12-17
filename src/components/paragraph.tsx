import clsx from 'clsx'
import { useAtom } from 'jotai'
import React from 'react'

import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'
import { CurrentVerse } from '~/components/currentVerse'
import { currentVerseAtom } from '~/components/passage'
import { ReadonlyVerse } from '~/components/readonlyVerse'
import { type Paragraph, ParsedPassage } from '~/lib/parseEsv'
import { PassageSegment } from '~/lib/passageSegment'
import { TypingSession } from '~/server/repositories/typingSession.repository'

export function Paragraph({
    node,
    passage,
    typingSession,
    chapterHistory,
    passageSegment,
}: {
    passage: ParsedPassage
    node: Paragraph
    typingSession?: TypingSession
    chapterHistory?: ChapterHistory
    passageSegment: PassageSegment
}) {
    const [currentVerse] = useAtom(currentVerseAtom)
    return (
        <p className={clsx('text-lg', node.metadata.blockIndent && 'ml-3')}>
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse.value === currentVerse

                if (verse.nodes.length === 0) return null

                return isCurrentVerse ? (
                    <CurrentVerse
                        key={vIndex}
                        verse={verse}
                        isCurrentVerse={isCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                        isQuote={node.metadata.type === 'quote'}
                        passage={passage}
                        typingSession={typingSession}
                        chapterHistory={chapterHistory}
                        passageSegment={passageSegment}
                    />
                ) : (
                    <ReadonlyVerse
                        key={vIndex}
                        verse={verse}
                        isCurrentVerse={isCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                        isQuote={node.metadata.type === 'quote'}
                        typingSession={typingSession}
                        chapterHistory={chapterHistory}
                    />
                )
            })}
        </p>
    )
}
