import { env } from '~/env.mjs'

interface SendEmailParams {
    to: string
    subject: string
    htmlbody: string
}

async function sendEmail({ to, subject, htmlbody }: SendEmailParams) {
    const response = await fetch('https://app.mailpace.com/api/v1/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'MailPace-Server-Token': env.MAILPACE_API_TOKEN,
        },
        body: JSON.stringify({
            from: 'noreply@typetheword.site',
            to,
            subject,
            htmlbody,
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to send email: ${error}`)
    }

    return response.json()
}

export async function sendPasswordResetEmail(
    email: string,
    resetToken: string,
): Promise<void> {
    const resetUrl = `${env.DEPLOYED_URL}/auth/reset-password?token=${resetToken}`

    const htmlbody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for Type the Word.</p>
            <p>Click the link below to reset your password. This link will expire in 24 hours.</p>
            <p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">
                    Reset Password
                </a>
            </p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                ${resetUrl}
            </p>
        </div>
    `

    await sendEmail({
        to: email,
        subject: 'Reset Your Password - Type the Word',
        htmlbody,
    })
}
