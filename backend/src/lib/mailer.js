import nodemailer from 'nodemailer';

const smtpHost = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number.parseInt(process.env.SMTP_PORT || '465', 10);
const smtpSecure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPasswordResetCodeEmail({ code, expiresInMinutes }) {
  const safeCode = escapeHtml(code);
  const safeExpiry = escapeHtml(expiresInMinutes);

  return {
    subject: `Your StockPro password reset code: ${safeCode}`,
    text: [
      'StockPro password reset',
      '',
      `Your verification code is ${safeCode}.`,
      `This code expires in ${safeExpiry} minutes and can be used once.`,
      '',
      'If you did not request this password reset, you can ignore this email. Your password will not be changed.',
      '',
      'StockPro Security',
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>StockPro password reset</title>
  </head>
  <body style="margin:0;background:#f4f7fb;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e9f2;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(23,32,51,0.08);">
            <tr>
              <td style="background:#101828;padding:28px 32px;">
                <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0;">StockPro</div>
                <div style="margin-top:6px;color:#c7d2fe;font-size:13px;">Secure password recovery</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#101828;">Reset your password</h1>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#475467;">
                  We received a request to reset the password for your StockPro account. Enter the verification code below in the reset form to continue.
                </p>
                <div style="margin:26px 0;padding:22px;border-radius:14px;background:#eef4ff;border:1px solid #c7d7fe;text-align:center;">
                  <div style="margin-bottom:10px;font-size:12px;font-weight:700;color:#344054;text-transform:uppercase;letter-spacing:.12em;">Verification code</div>
                  <div style="font-size:34px;line-height:1;font-weight:800;color:#1d4ed8;letter-spacing:.22em;">${safeCode}</div>
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                  <tr>
                    <td style="padding:14px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e4e9f2;color:#475467;font-size:14px;line-height:1.55;">
                      This code expires in <strong style="color:#101828;">${safeExpiry} minutes</strong> and can be used only once. For your security, never share this code with anyone.
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:14px;line-height:1.65;color:#667085;">
                  If you did not request this, you can safely ignore this email. Your password will stay unchanged.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e4e9f2;color:#667085;font-size:12px;line-height:1.5;">
                Sent by StockPro Security. This automated message helps protect access to your workspace.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

export async function sendPasswordResetCodeEmail(email, code, { expiresInMinutes = 15 } = {}) {
  if (process.env.EMAIL_DELIVERY_MODE !== 'SMTP') {
    console.log('[Dev] Password reset code for', email, ':', code);
    return;
  }

  const message = buildPasswordResetCodeEmail({ code, expiresInMinutes });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'StockPro Security <no-reply@stockpro.app>',
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
