// billing/cardcom.lowprofile.service.js

const LOW_PROFILE_URL =
  "https://secure.cardcom.solutions/api/v11/LowProfile/Create";

/**
 * Creates a Cardcom Low Profile payment page (ChargeOnly)
 * Expects JSON response: { ResponseCode, LowProfileId, Url, UrlToBit, ... }
 */
async function createLowProfilePayment({
  amount,
  phone,
  plan,
  successRedirectUrl,
  failedRedirectUrl,
  webHookUrl,
}) {
  if (!amount) throw new Error("amount is required");
  if (!phone) throw new Error("phone is required");
  if (!plan) throw new Error("plan is required");
  if (!webHookUrl) throw new Error("webHookUrl is required");

  const payload = {
    TerminalNumber: process.env.CARDCOM_TERMINAL,
    ApiName: process.env.CARDCOM_API_NAME,
    Operation: "ChargeOnly",

    Amount: Number(amount).toFixed(2),
    ISOCoinId: 2, // 2 = USD
    Language: "en",

    SuccessRedirectUrl: successRedirectUrl,
    FailedRedirectUrl: failedRedirectUrl,

    WebHookUrl: webHookUrl,

    ReturnValue: JSON.stringify({
      phone,
      plan,
      amount: Number(amount).toFixed(2),
    }),
  };

  const res = await fetch(LOW_PROFILE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Try JSON, fallback to text for debugging
  const rawText = await res.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Cardcom did not return JSON. Raw: ${rawText}`);
  }

  if (!res.ok) {
    throw new Error(
      `Cardcom request failed (${res.status}): ${rawText}`
    );
  }

  // ResponseCode: 0 = success
  if (Number(data.ResponseCode) !== 0) {
    throw new Error(`Cardcom error: ${rawText}`);
  }

  const lowProfileId = data.LowProfileId;
  const paymentUrl = data.Url || data.UrlToBit || data.UrlToPayPal;

  if (!lowProfileId) {
    throw new Error(`Missing LowProfileId. Raw: ${rawText}`);
  }
  if (!paymentUrl) {
    throw new Error(`Missing payment URL (Url/UrlToBit). Raw: ${rawText}`);
  }

  return {
    lowProfileId,
    paymentUrl,
  };
}

module.exports = {
  createLowProfilePayment,
};
