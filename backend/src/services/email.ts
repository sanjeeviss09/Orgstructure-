import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a mock transport by default if SMTP is not fully configured,
// but support Gmail SMTP (since user wants sanjeevinick09@gmail.com)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'sanjeevinick09@gmail.com',
    pass: process.env.SMTP_PASS || 'mock-password-replace-me'
  }
});

export const sendReminderEmail = async (internEmail: string, internName: string, daysLeft: number) => {
  const subject = `Reminder: Your Internship Ends in ${daysLeft} Days`;
  const text = `Hi ${internName},\n\nThis is a friendly reminder that your internship ends in ${daysLeft} days. Please ensure all your daily learnings and reports are submitted.\n\nThank you,\nAdmin`;
  
  try {
    if (process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_EMAIL || 'sanjeevinick09@gmail.com',
        to: internEmail,
        subject,
        text
      });
      console.log(`[Email Service] Sent reminder to ${internEmail}`);
    } else {
      console.log(`[Email Service - MOCK] Email would be sent to ${internEmail} from sanjeevinick09@gmail.com. Subject: ${subject}`);
    }
  } catch (e) {
    console.error(`[Email Service] Failed to send email to ${internEmail}:`, e);
  }
};
