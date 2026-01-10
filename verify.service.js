
const twilio = require("twilio"); 


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createVerification(phoneNumber) {
  const verification = await client.verify.v2
    .services(process.env.SERVICE_SID)
    .verifications.create({
      channel: "sms",
      to: phoneNumber, // מספר דינמי
    });

  console.log(verification.status);
}


module.exports = { createVerification };
