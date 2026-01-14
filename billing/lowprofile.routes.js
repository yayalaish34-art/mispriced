// billing/lowprofile.routes.js

const express = require("express");
const router = express.Router();

const {
  createLowProfilePayment,
} = require("./cardcom.lowprofile.service");

/**
 * Plan → Amount (USD)
 */
function getAmountByPlan(plan) {
  if (plan === "annual") return 239.0;
  if (plan === "monthly") return 39.99;
  throw new Error("Invalid plan");
}


router.post("/checkout", async (req, res) => {
  try {
    const { phone, plan } = req.body;

    if (!phone || !plan) {
      return res.status(400).json({
        ok: false,
        error: "phone and plan are required",
      });
    }

    const amount = getAmountByPlan(plan);

    const result = await createLowProfilePayment({
      phone,
      plan,
      amount,
      successRedirectUrl: "https://yourdomain.com/payment/success",
      failedRedirectUrl: "https://yourdomain.com/payment/failed",
      webHookUrl: "https://yourdomain.com/api/billing/lowprofile/webhook",
    });

    return res.json({
      ok: true,
      plan,
      amount,
      paymentUrl: result.paymentUrl,
      lowProfileId: result.lowProfileId,
    });
  } catch (err) {
    console.error("Create low profile failed:", err.message);
    return res.status(400).json({
      ok: false,
      error: err.message,
    });
  }
});

/**
 * ==============================
 * 2️⃣ WebHook / Indicator (JSON)
 * POST /api/billing/lowprofile/webhook
 * ==============================
 */
router.post("/lowprofile/webhook", async (req, res) => {
  try {
    const {
      ResponseCode,
      Description,
      LowProfileId,
      TranzactionId,
      ReturnValue,
      UIValues,
      Operation,
    } = req.body;

    const success = Number(ResponseCode) === 0;

    // Parse ReturnValue (we sent JSON)
    let phone = null;
    let plan = null;
    let amount = null;

    if (ReturnValue) {
      try {
        const parsed = JSON.parse(ReturnValue);
        phone = parsed.phone ?? null;
        plan = parsed.plan ?? null;
        amount = parsed.amount ?? null;
      } catch (err) {
        console.error("Failed to parse ReturnValue:", ReturnValue);
      }
    }

    // Optional UI values (exact keys from docs)
    const CardOwnerName = UIValues?.CardOwnerName ?? null;
    const CardOwnerPhone = UIValues?.CardOwnerPhone ?? null;
    const CardOwnerEmail = UIValues?.CardOwnerEmail ?? null;

    console.log("CARDCOM WEBHOOK", {
      success,
      ResponseCode,
      Description,
      TranzactionId,
      LowProfileId,
      phone,
      plan,
      amount,
      CardOwnerName,
      CardOwnerPhone,
      CardOwnerEmail,
      Operation,
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(200).send("OK");
  }
});


module.exports = router;
