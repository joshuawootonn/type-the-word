import { env } from "~/env.mjs"

export async function createSubscription({
    email,
    name,
}: {
    email: string
    name: string
}) {
    if (process.env.E2E_MOCK_CONVERTKIT === "1") {
        return
    }

    const response = await fetch(
        `https://api.convertkit.com/v3/forms/${env.CONVERTKIT_SUBSCRIBE_FORM_ID}/subscribe`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: env.CONVERTKIT_API_KEY,
                email,
                first_name: name,
            }),
        },
    )

    if (!response.ok) {
        throw new Error(
            `Failed to create subscription with ConvertKit for email: ${email} / name: ${name}.`,
        )
    }

    console.log(
        `Successfully created subscription with ConvertKit for email: ${email} / name: ${name}.`,
    )

    return
}
