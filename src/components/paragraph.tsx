import clsx from 'clsx'
import { type Paragraph, ParsedPassage } from '~/lib/parseEsv'
import React from 'react'
import { currentVerseAtom } from '~/components/passage'
import { useAtom } from 'jotai'
import { CurrentVerse } from '~/components/currentVerse'
import { ReadonlyVerse } from '~/components/readonlyVerse'
import { TypingSession } from '~/server/repositories/typingSession.repository'
import { ibmPlexMono } from '~/app/fonts'
import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'
import { PassageSegment } from '~/lib/passageSegment'

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
