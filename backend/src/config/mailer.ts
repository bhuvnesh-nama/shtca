import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for compiled Handlebars templates
const templateCache = new Map<string, handlebars.TemplateDelegate>();

/**
 * Resolve and compile Handlebars email templates (.hbs)
 */
function getCompiledTemplate(templateName: string): handlebars.TemplateDelegate {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const possiblePaths = [
    path.resolve(process.cwd(), 'src/templates/emails', `${templateName}.hbs`),
    path.resolve(process.cwd(), 'backend/src/templates/emails', `${templateName}.hbs`),
    path.resolve(__dirname, '../templates/emails', `${templateName}.hbs`),
    path.resolve(__dirname, '../../src/templates/emails', `${templateName}.hbs`),
  ];

  for (const candidatePath of possiblePaths) {
    if (fs.existsSync(candidatePath)) {
      try {
        const source = fs.readFileSync(candidatePath, 'utf-8');
        const compiled = handlebars.compile(source);
        templateCache.set(templateName, compiled);
        return compiled;
      } catch (err) {
        console.warn(`Failed reading template at ${candidatePath}:`, err);
      }
    }
  }

  // Fallback inline template in case file cannot be located on disk
  console.warn(`⚠️ Template "${templateName}.hbs" not found on disk, using adaptive HTML fallback.`);
  const fallbackSource = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0;">
          <h2 style="color: #003366; margin-top: 0;">SHTCA Civic Portal</h2>
          <p>Hello {{name}},</p>
          <p>{{message}}</p>
          {{#if resetLink}}
            <div style="margin: 24px 0;">
              <a href="{{resetLink}}" style="background: #003366; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">Or copy this link: {{resetLink}}</p>
          {{/if}}
          {{#if otpDigits}}
            <div style="margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #003366;">
              {{#each otpDigits}}{{this}}{{/each}}
            </div>
          {{/if}}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8;">SHTCA Municipal & Citizen Redressal System &bull; Official Communication</p>
        </div>
      </body>
    </html>
  `;
  const fallbackCompiled = handlebars.compile(fallbackSource);
  templateCache.set(templateName, fallbackCompiled);
  return fallbackCompiled;
}

/**
 * Primary Email Dispatcher
 * Automatically uses Resend (via RESEND_API_KEY) with seamless Nodemailer SMTP fallback.
 */
async function sendMail(
  emailTo: string,
  subject: string,
  templateName: string,
  context: Record<string, any> = {}
): Promise<any> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress =
    process.env.EMAIL_FROM?.trim() ||
    process.env.EMAIL_ADDRESS?.trim() ||
    'SHTCA Civic Portal <onboarding@resend.dev>';

  const template = getCompiledTemplate(templateName);
  const htmlContent = template({
    ...context,
    subject,
    year: context.year || new Date().getFullYear(),
  });

  // 1. Preferred modern provider: Resend API
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const result = await resend.emails.send({
        from: fromAddress,
        to: emailTo,
        subject,
        html: htmlContent,
      });

      if (result.error) {
        console.error('❌ Resend API Error:', result.error);
        throw new Error(result.error.message || 'Resend failed to deliver email');
      }

      console.log(`✉️ [Resend] Email sent to ${emailTo} (ID: ${result.data?.id})`);
      return result.data;
    } catch (err: any) {
      console.error('❌ Resend sendMail failure:', err.message || err);
      throw err;
    }
  }

  // 2. Fallback provider: Nodemailer SMTP (if EMAIL_HOST is provided)
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to: emailTo,
        subject,
        html: htmlContent,
      });

      console.log(`✉️ [SMTP] Email sent to ${emailTo} (MessageId: ${info.messageId})`);
      return info;
    } catch (smtpErr: any) {
      console.error('❌ SMTP sendMail failure:', smtpErr.message || smtpErr);
      throw smtpErr;
    }
  }

  // 3. Dev / Mock mode if no credentials are configured
  console.warn(
    `⚠️ No RESEND_API_KEY or EMAIL_HOST configured. Simulated email to ${emailTo} with subject "${subject}".`
  );
  return { simulated: true, to: emailTo, subject };
}

export default sendMail;
