import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_DEFAULT_WHATSAPP_NUMBER,
} = process.env;

let client = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
  console.warn("⚠️ Twilio credentials missing, WhatsApp sending disabled.");
}

export async function sendWhatsappNotification(submission, notify = {}) {
  if (!client) return;

  const { whatsappTo, whatsappFrom } = notify;
  if (!whatsappTo) {
    console.warn("⚠️ No WhatsApp recipient provided.");
    return;
  }

  const from = whatsappFrom || TWILIO_DEFAULT_WHATSAPP_NUMBER;
  const { site, formType, data } = submission;
  const name = data?.fullName || "לקוח/ה יקר/ה";

  const body = `שלום ${name},  
תודה שפנית ל־${site}.  
הפרטים שלך התקבלו בהצלחה ✅  
צוות ${site} ייצור איתך קשר בהקדם להמשך טיפול.
`;

  try {
    const message = await client.messages.create({
      from,
      to: whatsappTo.startsWith("whatsapp:")
        ? whatsappTo
        : `whatsapp:${whatsappTo}`,
      body,
    });

    console.log(`✅ WhatsApp sent to ${whatsappTo}: ${message.sid}`);
  } catch (err) {
    console.error("❌ Error sending WhatsApp:", err.message);
  }
}
