const twilio = require("twilio");
const supabase = require("./supabase");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const servicesid = process.env.SERVICE_SID;

const client = twilio(accountSid, authToken);

async function createVerificationCheck(phoneNumber, code) {
  const verificationCheck = await client.verify.v2
    .services(servicesid)
    .verificationChecks.create({
      code,
      to: phoneNumber,
    });

  if (verificationCheck.status === "approved") {
    const { error } = await supabase
      .from("sms_subscribers")
      .upsert({ phone: phoneNumber }, { onConflict: "phone" });

    if (error) {
      console.error("Supabase write failed:", error);
      return { ok: false, reason: "db_write_failed" };
    }

    return { ok: true };
  }

  return { ok: false, reason: verificationCheck.status };
}

module.exports = { createVerificationCheck };
