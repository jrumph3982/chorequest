import { Resend } from 'resend'

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@example.com'
const APP_URL    = process.env.APP_URL ?? 'http://localhost:3002'

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset your Chore Quest password',
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px;border:1px solid #334155;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:12px;">🏚️</div>
      <h1 style="color:#22c55e;font-size:24px;margin:0;">Chore Quest</h1>
      <p style="color:#64748b;font-size:14px;margin-top:8px;">Password Reset</p>
    </div>
    <p style="color:#cbd5e1;margin-bottom:8px;">Hi there,</p>
    <p style="color:#cbd5e1;margin-bottom:24px;">
      We received a request to reset your Chore Quest password. Click the button below to choose a new one.
      This link expires in <strong style="color:#f29d26;">1 hour</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}"
         style="background:#22c55e;color:#0f172a;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;display:inline-block;">
        Reset My Password
      </a>
    </div>
    <p style="color:#64748b;font-size:12px;margin-top:32px;border-top:1px solid #334155;padding-top:24px;">
      If you didn't request this, you can safely ignore this email — your password won't change.<br><br>
      Or copy this link into your browser:<br>
      <span style="color:#3b82f6;word-break:break-all;">${resetUrl}</span>
    </p>
  </div>
</body>
</html>`,
  })
}
