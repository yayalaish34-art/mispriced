const express = require("express");
const { sendScanAlertToMany } = require("./smsignals");
const { sendConversionSms } = require("./smsignals");

const router = express.Router();

router.post("/sendtomany", async (req, res) => {
  try {
    const { recipients, url } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "recipients must be a non-empty array",
      });
    }

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        ok: false,
        error: "url is required",
      });
    }

    const data = await sendScanAlertToMany(recipients, url);

    return res.json({
      ok: true,
      sent: data,
    });
  } catch (err) {
    console.error("sendtomany failed:", err.message);

    return res.status(500).json({
      ok: false,
      error: "failed to send messages",
    });
  }
});

router.post("/sendconversion", async (req, res) => {
  try {
    const { phoneNumber, step } = req.body;

    // לא בודקים פורמט של מספר טלפון (כמו שביקשת)
    if (typeof phoneNumber !== "string" || phoneNumber.length === 0) {
      return res.status(400).json({ ok: false, error: "phoneNumber is required" });
    }

    // כן בודקים שזו אחת הספרות 1/2/3
    const stepNum = Number(step);
    if (![1, 2, 3].includes(stepNum)) {
      return res.status(400).json({
        ok: false,
        error: "step must be 1, 2, or 3",
      });
    }

    await sendConversionSms(phoneNumber, stepNum);

    return res.json({ ok: true, phoneNumber, step: stepNum });
  } catch (err) {
    console.error("sendconversion failed:", err.message);
    return res.status(500).json({ ok: false, error: "failed to send conversion sms" });
  }
});

module.exports = router;