// server/src/lib/mailer.ts
import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.MAILTRAP_PORT) || 2525,
  auth: {
    user: process.env.MAILTRAP_USER || '7ca6d7edde4fe5',
    pass: process.env.MAILTRAP_PASS || 'f21d1914741ded',
  },
});

export async function sendPasswordResetEmail(to: string, resetLink: string, userName?: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .logo { font-size: 22px; font-weight: bold; color: #2563eb; margin-bottom: 20px; text-align: center; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">MiniPlane</div>
          <h2>Password Reset Request</h2>
          <p>Hello ${userName || 'there'},</p>
          <p>We received a request to reset your password for your MiniPlane account.</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="btn" target="_blank">Reset My Password</a>
          </p>
          <p>If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <p style="word-break: break-all; font-size: 13px; color: #666;">
            Or copy and paste this URL into your browser:<br>
            <a href="${resetLink}">${resetLink}</a>
          </p>
          <div class="footer">
            This link is valid for 1 hour. &copy; ${new Date().getFullYear()} MiniPlane.
          </div>
        </div>
      </body>
    </html>
  `;

  return mailer.sendMail({
    from: '"MiniPlane Support" <no-reply@miniplane.io>',
    to,
    subject: 'Reset your MiniPlane Password',
    html: htmlContent,
  });
}
