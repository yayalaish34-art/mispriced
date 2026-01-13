// billing/recurring.service.js

const axios = require("axios");
const {
  DO_TRANSACTION_URL,
  TERMINAL_NUMBER,
  API_NAME,
  ISOCoinId_USD,
} = require("./cardcom.config");

const { buildExternalUniqTranId, computeNextChargeAt } = require("./billing.utils");

async function chargeSubscriptionOnce(sub) {
  const externalUniqTranId = buildExternalUniqTranId(sub.subscription_id, sub.plan);

  const payload = {
    TerminalNumber: TERMINAL_NUMBER,
    ApiName: API_NAME,
    Amount: sub.amount,
    Token: sub.token,
    CardExpirationMMYY: sub.card_exp_mmyy,
    ExternalUniqTranId: externalUniqTranId,
    ISOCoinId: ISOCoinId_USD,
  };

  const res = await axios.post(DO_TRANSACTION_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });

  return res.data;
}

module.exports = {
  chargeSubscriptionOnce,
  computeNextChargeAt,
};
