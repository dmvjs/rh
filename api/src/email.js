import { ADDRESS_SET_LOWER } from './db/addresses.js'

const SUFFIXES = { court: 'ct', drive: 'dr', road: 'rd', lane: 'ln', circle: 'cir', place: 'pl', way: 'way' }
function normalizeAddress(addr) {
  return addr.toLowerCase().trim().replace(/\b(\w+)$/, w => SUFFIXES[w] ?? w)
}

export async function sendVerificationEmail(toEmail, token, env) {
  if (!env.RESEND_API_KEY) return

  const origin = env.WEB_ORIGIN ?? 'https://ridgeleahills.com'
  const link   = `${origin}/verify/?token=${token}`

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'Ridgelea Hills <noreply@ridgeleahills.com>',
      to:      toEmail,
      subject: 'Confirm your email — Ridgelea Hills',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e2de;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:32px 36px 0;border-bottom:1px solid #e2e2de;">
              <p style="margin:0 0 24px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b6b65;">ridgelea hills</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 16px;font-size:22px;font-weight:300;letter-spacing:-.5px;color:#1a1a18;">Confirm your email</p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#6b6b65;">Click the button below to verify your email address. The link expires in 24 hours. Once verified, your registration will be reviewed by a neighbor before your account is activated.</p>
              <a href="${link}" style="display:inline-block;background:#3a5a40;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:3px;">Confirm email address</a>
              <p style="margin:28px 0 0;font-size:12px;color:#6b6b65;line-height:1.6;">Or copy this link into your browser:<br><span style="color:#3a5a40;word-break:break-all;">${link}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #e2e2de;">
              <p style="margin:0;font-size:12px;color:#6b6b65;">You received this because someone registered with this email address at ridgeleahills.com. If that wasn't you, ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  })
}

export async function sendPasswordResetEmail(toEmail, token, env) {
  if (!env.RESEND_API_KEY) return

  const origin = env.WEB_ORIGIN ?? 'https://ridgeleahills.com'
  const link   = `${origin}/reset/?token=${token}`

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'Ridgelea Hills <noreply@ridgeleahills.com>',
      to:      toEmail,
      subject: 'Reset your password — Ridgelea Hills',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e2de;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:32px 36px 0;border-bottom:1px solid #e2e2de;">
              <p style="margin:0 0 24px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b6b65;">ridgelea hills</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 16px;font-size:22px;font-weight:300;letter-spacing:-.5px;color:#1a1a18;">Reset your password</p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#6b6b65;">Click the button below to choose a new password. This link expires in one hour and can only be used once.</p>
              <a href="${link}" style="display:inline-block;background:#3a5a40;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:3px;">Reset password</a>
              <p style="margin:28px 0 0;font-size:12px;color:#6b6b65;line-height:1.6;">Or copy this link into your browser:<br><span style="color:#3a5a40;word-break:break-all;">${link}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #e2e2de;">
              <p style="margin:0;font-size:12px;color:#6b6b65;">If you didn't request a password reset, ignore this email — your password won't change.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  })
}

export async function notifyNewRegistration(user, env) {
  if (!env.FORMSPREE_URL) return

  const adminUrl  = `${env.WEB_ORIGIN ?? 'https://ridgeleahills.com'}/admin/`
  const known     = ADDRESS_SET_LOWER.has(normalizeAddress(user.address))
  const flag      = known ? '' : ' ⚠️ ADDRESS NOT RECOGNIZED'
  const subject   = `New registration: ${user.name}${flag}`

  await fetch(env.FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      subject,
      name:    user.name,
      address: `${user.address}${flag}`,
      note:    user.note  ?? '—',
      message: `${user.name} at ${user.address} has requested access.${flag}\n\nNote: ${user.note ?? 'none'}\n\nApprove: ${adminUrl}`,
    }),
  })
}
