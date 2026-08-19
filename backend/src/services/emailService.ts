import { Resend } from 'resend'

interface SendPasswordResetEmailOptions {
  recipientEmail: string
  resetUrl: string
}

const createResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('找不到 RESEND_API_KEY 環境變數')
  }

  return new Resend(apiKey)
}

export const sendPasswordResetEmail = async ({
  recipientEmail,
  resetUrl,
}: SendPasswordResetEmailOptions) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!fromEmail) {
    throw new Error('找不到 RESEND_FROM_EMAIL 環境變數')
  }

  const resend = createResendClient()

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: '重設你的跑者菲迪密碼',
    text: [
      '我們收到了你的密碼重設申請。',
      '',
      `請開啟以下連結設定新密碼：${resetUrl}`,
      '',
      '這個連結將在 30 分鐘後失效。',
      '如果不是你提出申請，可以忽略這封信。',
    ].join('\n'),
    html: `
      <main style="font-family: sans-serif; color: #3c435e; line-height: 1.7;">
        <h1 style="font-size: 24px;">重設你的跑者菲迪密碼</h1>

        <p>我們收到了你的密碼重設申請。</p>

        <p>
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 24px;
              border-radius: 8px;
              background-color: #5bd0d4;
              color: #ffffff;
              font-weight: 700;
              text-decoration: none;
            "
          >
            設定新密碼
          </a>
        </p>

        <p>這個連結將在 30 分鐘後失效。</p>
        <p>如果不是你提出申請，可以忽略這封信。</p>
      </main>
    `,
  })

  if (error) {
    throw new Error(`Resend 寄信失敗：${error.message}`)
  }
}