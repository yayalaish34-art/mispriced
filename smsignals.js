// smsignals.js
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

/**
 * שולח הודעה אינפורמטיבית למערך של מספרים
 * one-way, same message, while loop
 */
async function sendScanAlertToMany(recipients, url) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("Recipients must be a non-empty array");
  }

  if (!MESSAGING_SERVICE_SID) {
    throw new Error("Missing MESSAGING_SERVICE_SID");
  }

  const body = `Mispriced market detected.

Our system flagged a market where current pricing may not reflect reality.
View the signal:
${url}`;

  const results = {
    success: [],
    failed: [],
  };

  let i = 0;

  while (i < recipients.length) {
    const to = recipients[i];

    try {
      const message = await client.messages.create({
        to,
        messagingServiceSid: MESSAGING_SERVICE_SID,
        body,
      });

      results.success.push({
        to,
        sid: message.sid,
        status: message.status, // queued / sent
      });

      console.log(`SMS sent to ${to}`);
    } catch (err) {
      results.failed.push({
        to,
        error: err.message,
        code: err.code || null,
      });

      console.error(`Failed to send SMS to ${to}`, err.message);
    }

    i++;
  }

  return results;
}

const conversionsms1 = `Free access complete.

You’ve reached the limit of free mispricing alerts.
To keep receiving signals, unlock full access here:
https://mispriced-ai.com/plans`;

const conversionsms2 = `Our system continues monitoring markets,
but alerts are paused without full access.

unlock full access:
https://mispriced-ai.com/plans`;

const conversionsms3 = `Final reminder.

If you’d like to resume mispricing alerts,
you can activate full access here:
https://mispriced-ai.com/plans

No further messages will be sent.`;

async function sendConversionSms(phoneNumber, step) {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    throw new Error("Invalid phone number");
  }

  if (!MESSAGING_SERVICE_SID) {
    throw new Error("Missing MESSAGING_SERVICE_SID");
  }

  let body;

  switch (step) {
    case 1:
      body = conversionsms1;
      break;
    case 2:
      body = conversionsms2;
      break;
    case 3:
      body = conversionsms3;
      break;
    default:
      throw new Error("Invalid step. Must be 1, 2, or 3");
  }

  try {
    await client.messages.create({
      to: phoneNumber,
      messagingServiceSid: MESSAGING_SERVICE_SID,
      body,
    });

    console.log(`Conversion SMS ${step} sent to ${phoneNumber}`);
  } catch (err) {
    console.error(
      `Failed to send conversion SMS ${step} to ${phoneNumber}`,
      err.message
    );
  }
}

module.exports = {
  sendScanAlertToMany,
  sendConversionSms,
};
