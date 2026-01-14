// billing/cardcom.lowprofile.service.js

const LOW_PROFILE_URL =
  "https://secure.cardcom.solutions/api/v11/LowProfile/Create";

async function createLowProfilePayment({ amount, phone, plan }) {
  if (!amount) throw new Error("amount is required");
  if (!phone) throw new Error("phone is required");
  if (!plan) throw new Error("plan is required");

  const numericAmount = Number(amount).toFixed(2);

  const payload = {
    TerminalNumber: process.env.CARDCOM_TERMINAL,
    ApiName: process.env.CARDCOM_API_NAME,
    Operation: "ChargeAndCreateToken",

    Amount: numericAmount,
    ISOCoinId: 2, // USD
    Language: "en",

    SuccessRedirectUrl: "https://www.mispriced-ai.com?success=1",
    FailedRedirectUrl: "https://www.mispriced-ai.com?failure=1",

    WebHookUrl: "https://www.mispriced-ai.com/api/billing/webhook",

    Document: {
      DocumentTypeToCreate: "Receipt",
      Name: "לקוח פרטי",
      Email: "yairlaish19@gmail.com",
      IsSendByEmail: true,
      IsVatFree: true,
      Products: [
        { Description: "Subscription", UnitCost: numericAmount, IsVatFree: true },
      ],
    },

    ReturnValue: JSON.stringify({
      phone,
      plan,
      amount: numericAmount,
    }),
  };

  const res = await fetch(LOW_PROFILE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();

  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Cardcom did not return JSON. Raw: ${rawText}`);
  }

  if (!res.ok) throw new Error(`Cardcom request failed (${res.status}): ${rawText}`);
  if (Number(data.ResponseCode) !== 0) throw new Error(`Cardcom error: ${rawText}`);

  const lowProfileId = data.LowProfileId;
  const paymentUrl = data.Url || data.UrlToBit || data.UrlToPayPal;

  if (!lowProfileId) throw new Error(`Missing LowProfileId. Raw: ${rawText}`);
  if (!paymentUrl) throw new Error(`Missing payment URL (Url/UrlToBit). Raw: ${rawText}`);

  return { lowProfileId, paymentUrl };
}

module.exports = { createLowProfilePayment };
