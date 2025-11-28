import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️ Email ENV vars missing. Email sending will be disabled.");
}

let transporter = null;

function getTransporter() {
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  return transporter;
}

/**
 * שולח מייל על ליד חדש
 * @param submission - הדוקומנט שנשמר במונגו
 * @param notify - notify מהבקשה, כולל emailTo
 */
export async function sendFormEmail(submission, notify = {}) {
  const tx = getTransporter();
  if (!tx) {
    console.warn("⚠️ Transporter not configured, skipping email send.");
    return;
  }

  const { emailTo } = notify;
  if (!emailTo) {
    console.warn("⚠️ emailTo missing, skipping email send.");
    return;
  }

  const { site, formType, data } = submission;

  const subject = `📩 ליד חדש מהאתר ${site} (${formType})`;
  const textLines = [
    `ליד חדש מהאתר ${site}`,
    `סוג טופס: ${formType}`,
    "",
    "פרטי ההגשה:",
    JSON.stringify(data, null, 2),
  ];

  try {
    await tx.sendMail({
      from: `"${site} Leads" <${EMAIL_USER}>`,
      to: emailTo,
      subject,
      text: textLines.join("\n"),
    });

    console.log(`✅ Email sent to ${emailTo}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}
