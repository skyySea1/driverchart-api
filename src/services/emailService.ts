import { Resend } from "resend";
import { env } from "../utils/env";
import { logger } from "../services/logger-service";

const resend = new Resend(env.RESEND_API_KEY);

const SENDER_EMAIL = "onboarding@resend.dev"; // For testing without domain
const TEST_RECIPIENT = "henrir1020@gmail.com"; // User mandated test email

// Helper to determine recipient
function getRecipient(originalTo: string): string {
  // In production with verified domain, use originalTo.
  // BUT user explicitly asked to use this specific restricted setup for now.
  // We will log the original intended recipient.
  if (process.env.NODE_ENV !== 'production' || !env.RESEND_DOMAIN_VERIFIED) {
     logger.info(`[Email Test Mode] Redirecting email from ${originalTo} to ${TEST_RECIPIENT}`);
     return TEST_RECIPIENT;
  }
  return originalTo;
}

export const emailService = {
  async sendExpirationNotification(
    to: string,
    driverName: string,
    documentType: string,
    expiryDate: string,
    daysLeft: number
  ) {
    if (!env.RESEND_API_KEY) {
      logger.warn("RESEND_API_KEY is not set. Skipping email sending.");
      return;
    }

    try {
      const isExpired = daysLeft < 0;
      const statusText = isExpired ? "expired" : "is expiring soon";
      const subject = `Attention: Your ${documentType} ${statusText}`;
      const recipient = getRecipient(to);

      const { data, error } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [recipient],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #334155;">
            <h1 style="color: #1e293b;">Document Notification</h1>
            <p>Hello <strong>${driverName}</strong>,</p>
            <p>This is an automated notification regarding your <strong>${documentType}</strong>.</p>
            <p>Status: <span style="color: ${isExpired ? "#b91c1c" : "#b45309"}; font-weight: bold;">
              ${isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : `Expiring in ${daysLeft} days`}
            </span></p>
            <p>Expiration Date: <strong>${expiryDate}</strong></p>
            <p>Please update your document as soon as possible to maintain compliance.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 0.875rem; color: #64748b;">This is an automated message from CharterSafe Compliance System.</p>
            <p style="font-size: 0.7rem; color: #94a3b8; margin-top: 20px;">Intended Recipient: ${to}</p>
          </div>
        `,
      });

      if (error) {
        logger.error({ error }, "Error sending email via Resend");
        throw error;
      }

      return data;
    } catch (err) {
      logger.error({ err }, "Failed to send expiration notification email");
      throw err;
    }
  },

  async sendUploadRequest(
    to: string,
    driverName: string,
    requestType: string,
    magicLink: string,
    customMessage?: string
  ) {
    if (!env.RESEND_API_KEY) return;

    try {
      const recipient = getRecipient(to);
      const { data, error } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [recipient],
        subject: `Document Request: ${requestType}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #334155;">
            <h2 style="color: #1e293b;">Hello ${driverName},</h2>
            <p>We need you to provide a copy of your <strong>${requestType}</strong> to maintain your compliance records.</p>
            ${
              customMessage
                ? `<div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; font-style: italic; color: #475569;">
                     "${customMessage.replace(/\n/g, '<br/>')}"
                   </div>`
                : ""
            }
            <p>You can upload it directly by clicking the secure link below:</p>
            <div style="margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Upload ${requestType}
              </a>
            </div>
            <p style="font-size: 0.875rem; color: #64748b;">This link is secure and unique to your profile. If you have any questions, please contact the dispatcher.</p>
            <p style="font-size: 0.7rem; color: #94a3b8; margin-top: 20px;">Intended Recipient: ${to}</p>
          </div>
        `,
      });

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to send upload request email");
      throw err;
    }
  },

  async sendMemo(
    to: string,
    driverName: string,
    memoTitle: string,
    memoLinks: string[]
  ) {
    if (!env.RESEND_API_KEY) return;

    try {
      const linksHtml = memoLinks
        .map(
          (link, i) =>
            `<li style="margin-bottom: 8px;"><a href="${link}" style="color: #2563eb;">View Document ${i + 1}</a></li>`
        )
        .join("");

      const recipient = getRecipient(to);
      const { data, error } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [recipient],
        subject: `New Memo: ${memoTitle}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #334155;">
            <h2 style="color: #1e293b;">Important Memo for ${driverName}</h2>
            <p>A new memo or policy has been issued for your review:</p>
            <ul style="margin: 20px 0; padding-left: 20px;">
              ${linksHtml}
            </ul>
            <p>Please review these documents at your earliest convenience. You can also find them in your driver profile registry.</p>
            <p style="font-size: 0.7rem; color: #94a3b8; margin-top: 20px;">Intended Recipient: ${to}</p>
          </div>
        `,
      });

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to send memo email");
      throw err;
    }
  },
};
