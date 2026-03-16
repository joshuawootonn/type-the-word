export function getGoogleClassroomHomeUrl(): string {
    return "https://classroom.google.com"
}

export function getGoogleClassroomCourseUrl(courseId: string): string {
    return `https://classroom.google.com/c/${toGoogleClassroomUrlId(courseId)}`
}

export function getGoogleClassroomCourseWorkUrl(
    courseId: string,
    courseWorkId: string,
): string {
    return `https://classroom.google.com/c/${toGoogleClassroomUrlId(courseId)}/a/${toGoogleClassroomUrlId(courseWorkId)}/details`
}

function toGoogleClassroomUrlId(value: string): string {
    try {
        if (typeof globalThis.btoa === "function") {
            return globalThis.btoa(value).replace(/=+$/g, "")
        }
    } catch (_error) {
        // Fall through to URI encoding if base64 encoding is unavailable.
    }

    return encodeURIComponent(value)
}
