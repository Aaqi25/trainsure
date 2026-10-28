import nodemailer from 'nodemailer';

let transporter: any = null;

export function initEmailService() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log('[TrainSure Email] SMTP transporter configured for', host);
    } catch (err: any) {
      console.warn('[TrainSure Email] Failed to initialize SMTP:', err.message);
    }
  } else {
    // App continues normally without SMTP configured
    console.log('[TrainSure Email] SMTP credentials not fully configured; notifications will be in-app only.');
  }
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  if (!transporter) {
    return false;
  }

  try {
    const from = process.env.SMTP_FROM || 'TrainSure Notifications <no-reply@trainsure.internal>';
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    return !!(info && info.messageId);
  } catch (err: any) {
    console.warn(`[TrainSure Email] Could not send email to ${to}:`, err.message);
    return false;
  }
}
