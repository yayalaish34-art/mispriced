// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createVerificationCheck(phoneNumber,code) {
  const verificationCheck = await client.verify.v2
    .services("VAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .verificationChecks.create({
      code,
      to: phoneNumber,
    });

  console.log(verificationCheck.status);
}

module.exports = { createVerificationCheck };
