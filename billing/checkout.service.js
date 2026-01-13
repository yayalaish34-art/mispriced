// billing/checkout.service.js

const axios = require("axios");
const {
  CREATE_LP_URL,
  TERMINAL_NUMBER,
  API_NAME,
  ISOCoinId_USD,
} = require("./cardcom.config");

function getAmount(plan) {
  // תעדכן אם תרצה
  return plan === "annual" ? 19.99 : 39.99;
}

async function createCheckout({ subscription_id, plan, successUrl, failedUrl, webhookUrl }) {
  if (!subscription_id) throw new Error("subscription_id is required");
  if (plan !== "monthly" && plan !== "annual") throw new Error("plan must be monthly|annual");

  const amount = getAmount(plan);

  const payload = {
    TerminalNumber: TERMINAL_NUMBER,
    ApiName: API_NAME,
    Operation: "ChargeAndCreateToken",
    Amount: amount,
    ISOCoinId: ISOCoinId_USD,

    // 🔑 זה מה שמאפשר לנו בלי טבלת checkout
    ReturnValue: `${subscription_id}|${plan}`,

    SuccessRedirectUrl: successUrl,
    FailedRedirectUrl: failedUrl,
    WebHookUrl: webhookUrl,
  };

  const res = await axios.post(CREATE_LP_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });

  if (res.data?.ResponseCode !== 0 || !res.data?.Url || !res.data?.LowProfileId) {
    throw new Error(`CreateLowProfile failed: ${res.data?.Description || "unknown"}`);
  }

  return {
    payUrl: res.data.Url,
    lowProfileId: res.data.LowProfileId,
    amount,
    plan,
  };
}

module.exports = { createCheckout };
