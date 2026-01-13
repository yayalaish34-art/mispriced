// billing/recurring.cron.js

const db = require("./billing.db");
const { chargeSubscriptionOnce, computeNextChargeAt } = require("./recurring.service");

async function runRecurringBilling() {
  const due = await db.listSubscriptionsDue(new Date());

  for (const sub of due) {
    try {
      if (sub.amount == null) {
        throw new Error("Missing amount in billing row (amount is required for recurring charge)");
      }

      const result = await chargeSubscriptionOnce(sub);

      // פה אפשר לבדוק result.ResponseCode אם קארדקום מחזירים כזה בפועל אצלך
      // ואם לא הצליח - throw

      const next_charge_at = computeNextChargeAt(sub.plan, new Date());
      await db.updateNextChargeAt(sub.subscription_id, next_charge_at);

      console.log(`✔ charged ${sub.subscription_id}`);
    } catch (e) {
      console.error(`✖ charge failed ${sub.subscription_id}:`, e.response?.data || e.message);
      // אין לנו עמודת status בטבלה, אז לא שומרים "past_due" כרגע.
    }
  }
}

module.exports = { runRecurringBilling };
