import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return false
  }
}

export async function sendResetPasswordEmail(email: string, code: string): Promise<boolean> {
  const subject = 'Восстановление пароля - Справочник СМП'
  const text = `
Здравствуйте!

Для восстановления пароля используйте следующий код:

${code}

Этот код действителен в течение 1 часа.

Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.

С уважением,
Команда Справочника СМП
`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #3b82f6;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9fafb;
      padding: 30px;
      border-radius: 0 0 5px 5px;
    }
    .code {
      background-color: #fff;
      border: 2px solid #3b82f6;
      border-radius: 5px;
      padding: 20px;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin: 20px 0;
      letter-spacing: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Восстановление пароля</h1>
  </div>
  <div class="content">
    <p>Здравствуйте!</p>
    <p>Для восстановления пароля используйте следующий код:</p>
    <div class="code">${code}</div>
    <p>Этот код действителен в течение <strong>1 часа</strong>.</p>
    <p>Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>
  </div>
  <div class="footer">
    <p>С уважением,<br>Команда Справочника СМП</p>
  </div>
</body>
</html>
`

  return await sendEmail({
    to: email,
    subject,
    text,
    html
  })
}


