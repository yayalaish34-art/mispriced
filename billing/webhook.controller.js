// billing/webhook.controller.js

const { verifyLowProfileAndSaveSubscription } = require("./lpResult.service");

async function cardcomWebhook(req, res) {
  // מחזירים 200 מהר כדי שקארדקום לא יעשו retries
  res.sendStatus(200);

  try {
    const lowProfileId = req.body?.LowProfileId || req.body?.lowProfileId;
    const returnValue = req.body?.ReturnValue || req.body?.returnValue;

    if (!lowProfileId) return;

    // אימות אמיתי מול Cardcom + שמירה ל־Supabase
    await verifyLowProfileAndSaveSubscription({ lowProfileId, returnValue });
  } catch (e) {
    console.error("cardcomWebhook failed:", e.message);
  }
}

module.exports = { cardcomWebhook };
