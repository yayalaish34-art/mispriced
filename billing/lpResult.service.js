// billing/lpResult.service.js

const axios = require("axios");
const {
  GET_LP_RESULT_URL,
  TERMINAL_NUMBER,
  API_NAME,
} = require("./cardcom.config");

const db = require("./billing.db");
const { toMMYY, computeNextChargeAt, parseReturnValue } = require("./billing.utils");

async function verifyLowProfileAndSaveSubscription({ lowProfileId, returnValue }) {
  if (!lowProfileId) throw new Error("lowProfileId is required");

  const parsed = parseReturnValue(returnValue);
  if (!parsed.subscription_id) throw new Error("Missing subscription_id in ReturnValue");
  if (parsed.plan !== "monthly" && parsed.plan !== "annual") {
    throw new Error("Missing/invalid plan in ReturnValue");
  }

  const res = await axios.post(
    GET_LP_RESULT_URL,
    {
      TerminalNumber: TERMINAL_NUMBER,
      ApiName: API_NAME,
      LowProfileId: lowProfileId,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  if (res.data?.ResponseCode !== 0) {
    throw new Error(`GetLpResult failed: ${res.data?.Description || "unknown"}`);
  }

  const token = res.data?.TokenInfo?.Token;
  const cardMonth = res.data?.TokenInfo?.CardMonth;
  const cardYear = res.data?.TokenInfo?.CardYear;

  if (!token || !cardMonth || !cardYear) {
    throw new Error("TokenInfo missing (token/card month/year). Make sure Operation=ChargeAndCreateToken");
  }

  const card_exp_mmyy = toMMYY(cardMonth, cardYear);

  // amount: אפשר למשוך מהתשובה אם קיים אצלך; אם לא, קח ממה שהחלטת לפי plan
  const amount =
    typeof res.data?.TranzactionInfo?.Amount === "number"
      ? res.data.TranzactionInfo.Amount
      : undefined;

  const next_charge_at = computeNextChargeAt(parsed.plan, new Date());

  await db.upsertSubscription({
    subscription_id: parsed.subscription_id,
    token,
    card_exp_mmyy,
    amount: amount ?? null,
    plan: parsed.plan,
    next_charge_at,
  });
  await db.deleteSmsSubscriberByPhone(parsed.subscription_id);

  return { ok: true };
}

module.exports = { verifyLowProfileAndSaveSubscription };
