"use client"

import { useQuery } from "@tanstack/react-query"
import { atom, PrimitiveAtom, Provider } from "jotai"
import { useHydrateAtoms } from "jotai/react/utils"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import React, { useCallback, useId, useMemo, useRef, useState } from "react"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"
import { Cursor } from "~/components/cursor"
import {
    fetchAssignmentHistory,
    fetchChapterHistory,
    fetchTypingSessionUpsert,
} from "~/lib/api"
import { getNextVerseToType } from "~/lib/getNextVerseToType"
import { useRect, PassageRectContext } from "~/lib/hooks/passageRectContext"
import { Keystroke } from "~/lib/keystroke"
import { Inline, ParsedPassage, Translation } from "~/lib/parseEsv"
import { PassageSegment, toPassageSegment } from "~/lib/passageSegment"
import { TypingSession } from "~/server/repositories/typingSession.repository"

import { Paragraph } from "./paragraph"
import { TypedVerseLines } from "./typed-verse-lines"

export const positionAtom = atom<Inline[]>([])
export const keystrokesAtom = atom<Keystroke[]>([])

export const isPassageActiveAtom = atom(false)
export const isPassageFocusedAtom = atom(false)

export const currentVerseAtom = atom<string>("")
export const autofocusAtom = atom(false)
export const passageIdAtom = atom<string>("")

type InitialValues<T> = [PrimitiveAtom<T>, T]

function HydrateAtoms({
    initialValues,
    children,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialValues: InitialValues<any>[]
    children: React.ReactNode
}) {
    useHydrateAtoms(initialValues)
    return children
}

export function Passage({
    passage,
    translation = "esv",
    ...props
}: {
    passage: ParsedPassage
    translation?: Translation
    autofocus?: boolean
    typingSession?: TypingSession
    chapterHistory?: ChapterHistory
    assignmentHistory?: AssignmentHistory
    passageSegmentOverride?: PassageSegment
    classroomAssignmentId?: string
    historyType?: "chapter" | "assignment"
}) {
    const passageId = useId()

    const passageRef = useRef<HTMLDivElement>(null)
    const passageRect = useRect(passageRef)
    const [verseRects, setVerseRects] = useState<
        PassageRectContext["verseRects"]
    >({})

    const updateVerseRect = useCallback(
        (verse: string, rect: DOMRect) =>
            setVerseRects(prev => ({ ...prev, [verse]: rect })),
        [],
    )
    const { data: sessionData } = useSession()
    const passageSegementOrOverride =
        props.passageSegmentOverride ??
        toPassageSegment(passage.firstVerse.book, passage.firstVerse.chapter)
    const typingSession = useQuery({
        queryKey: ["typing-session"],
        queryFn: () => fetchTypingSessionUpsert(props.classroomAssignmentId),
        enabled: sessionData?.user?.id != null,
        placeholderData: props.typingSession,
    })
    const historyType = props.historyType ?? "chapter"
    const shouldFetchChapterHistory = historyType === "chapter"
    const chapterHistoryQuery = useQuery({
        queryKey: ["chapter-history", passageSegementOrOverride, translation],
        queryFn: () =>
            fetchChapterHistory(passageSegementOrOverride, translation),
        enabled: sessionData?.user?.id != null && shouldFetchChapterHistory,
        placeholderData: props.chapterHistory,
    })
    const shouldFetchAssignmentHistory = historyType === "assignment"
    const assignmentHistoryChapter = passage.firstVerse.chapter
    const assignmentHistoryQuery = useQuery({
        queryKey: [
            "assignment-history",
            props.classroomAssignmentId,
            assignmentHistoryChapter,
        ],
        queryFn: () =>
            fetchAssignmentHistory(
                props.classroomAssignmentId ?? "",
                assignmentHistoryChapter,
            ),
        enabled:
            sessionData?.user?.id != null &&
            shouldFetchAssignmentHistory &&
            props.classroomAssignmentId != null,
        placeholderData: props.assignmentHistory,
    })
    const history: ChapterHistory | AssignmentHistory | undefined =
        historyType === "assignment"
            ? (assignmentHistoryQuery.data ?? props.assignmentHistory)
            : (chapterHistoryQuery.data ?? props.chapterHistory)
    const historyQueryKey =
        historyType === "assignment"
            ? props.classroomAssignmentId
                ? [
                      "assignment-history",
                      props.classroomAssignmentId,
                      assignmentHistoryChapter,
                  ]
                : undefined
            : ["chapter-history", passageSegementOrOverride, translation]

    const isRootPath = usePathname() === "/"
    const H2Component = isRootPath ? "h2" : "h1"

    const orderedVerses = useMemo(() => {
        return passage.nodes.flatMap(node => {
            if (node.type === "paragraph") {
                return node.nodes
            }
            if (node.type === "verse") {
                return [node]
            }
            return []
        })
    }, [passage.nodes])

    return (
        <Provider>
            <HydrateAtoms
                initialValues={[
                    [
                        currentVerseAtom,
                        props.autofocus
                            ? getNextVerseToType(passage, history)
                            : "",
                    ],
                    [autofocusAtom, props.autofocus],
                    [passageIdAtom, passageId],
                ]}
            >
                <div
                    ref={passageRef}
                    id={passageId}
                    data-testid="passage-root"
                    className="passage typo:prose dark:typo:prose-invert relative z-0 w-full"
                >
                    <PassageRectContext.Provider
                        value={{
                            verseRects,
                            rect: passageRect,
                            updateVerseRect,
                        }}
                    >
                        {passage.nodes.map((node, pIndex) => {
                            switch (node.type) {
                                case "paragraph":
                                    return (
                                        <Paragraph
                                            key={pIndex}
                                            node={node}
                                            passage={passage}
                                            typingSession={typingSession.data}
                                            history={history}
                                            classroomAssignmentId={
                                                props.classroomAssignmentId
                                            }
                                            historyQueryKey={historyQueryKey}
                                        />
                                    )

                                case "h2":
                                    return (
                                        <H2Component
                                            key={pIndex}
                                            className="typo:prose-h2 text-primary mt-2 mb-4 text-2xl"
                                        >
                                            {node.text}
                                        </H2Component>
                                    )
                                case "h3":
                                    return (
                                        <h3
                                            className="typo:prose-h3 text-primary mt-0 text-xl font-semibold tracking-wide"
                                            key={pIndex}
                                        >
                                            {node.text}
                                        </h3>
                                    )
                                case "h4":
                                    return (
                                        <h4
                                            className="typo:prose-h4 text-primary text-lg font-medium tracking-wide"
                                            key={pIndex}
                                        >
                                            {node.text}
                                        </h4>
                                    )

                                default:
                                    break
                            }
                        })}
                        <TypedVerseLines
                            orderedVerses={orderedVerses}
                            passageRect={passageRect}
                            typedVerses={typingSession.data?.typedVerses}
                            verseRects={verseRects}
                        />
                    </PassageRectContext.Provider>
                    <Cursor passageId={passageId} />
                </div>
            </HydrateAtoms>
        </Provider>
    )
}
