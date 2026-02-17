import { createE2EMockClassroomClient } from "./e2e-mock"
import { createGoogleClassroomClient } from "./google"
import { ClassroomClient } from "./types"

export type ClassroomClientMode = "google" | "e2e-mock"

let resolvedClassroomClient: ClassroomClient | undefined

export function resolveClassroomClientMode(
    e2eMockFlag: string | undefined = process.env.E2E_MOCK_CLASSROOM,
): ClassroomClientMode {
    return e2eMockFlag === "1" ? "e2e-mock" : "google"
}

export function createClassroomClientForMode(
    mode: ClassroomClientMode,
): ClassroomClient {
    return mode === "e2e-mock"
        ? createE2EMockClassroomClient()
        : createGoogleClassroomClient()
}

export function getClassroomClient(): ClassroomClient {
    if (!resolvedClassroomClient) {
        resolvedClassroomClient = createClassroomClientForMode(
            resolveClassroomClientMode(),
        )
    }

    return resolvedClassroomClient
}

export function resetClassroomClientForTests(): void {
    resolvedClassroomClient = undefined
}
