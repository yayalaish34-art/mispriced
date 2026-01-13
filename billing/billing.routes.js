// billing/billing.routes.js

const express = require("express");
const { createCheckout } = require("./checkout.service");
const { cardcomWebhook } = require("./webhook.controller");

const router = express.Router();

/**
 * POST /api/billing/checkout
 * body: { subscription_id, plan }
 * מחזיר payUrl
 */
router.post("/checkout", async (req, res) => {
  try {
    const { subscription_id, plan } = req.body;

    // תעדכן את ה-URLs שלך
const successUrl = "https://mispriced-production.up.railway.app/billing/success";
const failedUrl = "https://mispriced-production.up.railway.app/billing/failed";
const webhookUrl = "https://mispriced-production.up.railway.app/api/billing/cardcom/webhook";


    const data = await createCheckout({
      subscription_id,
      plan,
      successUrl,
      failedUrl,
      webhookUrl,
    });

    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/billing/cardcom/webhook
 */
router.post("/cardcom/webhook", cardcomWebhook);

module.exports = router;
