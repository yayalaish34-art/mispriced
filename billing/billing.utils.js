// billing/billing.utils.js

function toMMYY(cardMonth, cardYear) {
  const mm = String(cardMonth).padStart(2, "0");
  const yy = String(cardYear).slice(-2);
  return `${mm}${yy}`; // "1226"
}

/**
 * מפתח idempotency קבוע לכל מחזור חיוב:
 * monthly -> sub_{id}_{YYYY-MM}
 * annual  -> sub_{id}_{YYYY}
 */
function buildExternalUniqTranId(subscriptionId, plan, date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");

  if (plan === "annual") return `sub_${subscriptionId}_${y}`;
  return `sub_${subscriptionId}_${y}-${m}`;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function computeNextChargeAt(plan, from = new Date()) {
  return plan === "annual" ? addYears(from, 1) : addMonths(from, 1);
}

function parseReturnValue(rv) {
  // Expect: "{subscription_id}|{plan}"
  const raw = String(rv || "");
  const [subscription_id, plan] = raw.split("|");
  return {
    subscription_id: (subscription_id || "").trim(),
    plan: (plan || "").trim(),
  };
}

module.exports = {
  toMMYY,
  buildExternalUniqTranId,
  computeNextChargeAt,
  parseReturnValue,
};
