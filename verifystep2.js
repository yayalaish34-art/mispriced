// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const servicesid = process.env.SERVICE_SID;
const client = twilio(accountSid, authToken);

async function createVerificationCheck(phoneNumber,code) {
  const verificationCheck = await client.verify.v2
    .services(servicesid)
    .verificationChecks.create({
      code: code,
      to: phoneNumber,
    });

     if (verificationCheck.status === "approved") {
    return { ok: true };
  }

  return {
    ok: false,
    reason: verificationCheck.status, // pending / expired / canceled
  };

}

module.exports = { createVerificationCheck };
