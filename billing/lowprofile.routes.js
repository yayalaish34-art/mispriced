// billing/lowprofile.routes.js

const express = require("express");
const router = express.Router();

const supabase = require("../supabase"); // ✅ חשוב: אם supabase.js אצלך בשורש הפרויקט
const { createRecurringOrder } = require("./cardcom.recurring.service");
const { createLowProfilePayment } = require("./cardcom.lowprofile.service");

/**
 * Plan → Amount (USD)
 */
function getAmountByPlan(plan) {
  if (plan === "annual") return 239.0;
  if (plan === "monthly") return 39.99;
  throw new Error("Invalid plan");
}

/**
 * dd/MM/yyyy for Cardcom Recurring
 */
function getNextBillingDate(plan) {
  const d = new Date();

  if (plan === "monthly") d.setMonth(d.getMonth() + 1);
  if (plan === "annual") d.setFullYear(d.getFullYear() + 1);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * ISO for DB
 */
function toIsoNowPlus(plan) {
  const d = new Date();
  if (plan === "monthly") d.setMonth(d.getMonth() + 1);
  if (plan === "annual") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

/**
 * POST /api/billing/lowprofile/checkout
 * body: { phone, plan }
 */
router.post("/checkout", async (req, res) => {
  try {
    const { phone, plan } = req.body;

    if (!phone || !plan) {
      return res.status(400).json({ ok: false, error: "phone and plan are required" });
    }

    const amount = getAmountByPlan(plan);

    const result = await createLowProfilePayment({
      phone,
      plan,
      amount,
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
    return res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * Webhook URL you configured in Cardcom:
 * https://www.mispriced-ai.com/api/billing/lowprofile/webhook
 *
 * POST /api/billing/lowprofile/webhook
 */
router.post("/webhook", async (req, res) => {
  try {
    const body = req.body || {};

    const ResponseCode = body.ResponseCode;
    const Description = body.Description;
    const TranzactionId = body.TranzactionId;

    // Cardcom sometimes sends LowProfileDealGuid (GUID) + sometimes LowProfileId
    const LowProfileDealGuid = body.LowProfileDealGuid || body.DealGuid || null;
    const LowProfileId = body.LowProfileId || null;

    const ReturnValue = body.ReturnValue || null;
    const UIValues = body.UIValues || {};

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
      } catch (e) {
        console.error("Failed to parse ReturnValue:", ReturnValue);
      }
    }

    const CardOwnerName = UIValues?.CardOwnerName ?? null;
    const CardOwnerPhone = UIValues?.CardOwnerPhone ?? null;
    const CardOwnerEmail = UIValues?.CardOwnerEmail ?? null;

    // ✅ Cardcom recurring wants dd/MM/yyyy
    const nextDateToBill = getNextBillingDate(plan);
    // ✅ DB best as ISO
    const nextChargeAtIso = toIsoNowPlus(plan);

    // ✅ Prefer GUID if Cardcom sent it, otherwise fallback to LowProfileId
    const dealGuidForRecurring = LowProfileDealGuid || LowProfileId;

    let recurringResp = null;
    if (success && dealGuidForRecurring && amount) {
      recurringResp = await createRecurringOrder({
        lowProfileDealGuid: dealGuidForRecurring,
        companyName: CardOwnerName || "Private Client",
        price: Number(amount).toFixed(2),
        nextDateToBill,
        returnValue: ReturnValue || "",
      });
    }

    // Pull ids if returned
    const accountId = recurringResp?.AccountId || null;
    const recurringId =
      recurringResp?.["Recurring0.RecurringId"] ||
      recurringResp?.RecurringId ||
      null;

    // ✅ Fix: upsert payload must be ONE object
    if (phone) {
      const { error } = await supabase
        .from("billing")
        .upsert(
          {
            subscription_id: phone,
            plan,
            next_charge_at: nextChargeAtIso,

          },
          { onConflict: "subscription_id" }
        );

      if (error) console.error("Supabase upsert failed:", error);
    }

    console.log("CARDCOM WEBHOOK", {
      success,
      ResponseCode,
      Description,
      TranzactionId,
      LowProfileId,
      LowProfileDealGuid,
      phone,
      plan,
      amount,
      CardOwnerName,
      CardOwnerPhone,
      CardOwnerEmail,
      recurringResp,
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(200).send("OK");
  }
});

module.exports = router;
