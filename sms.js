const express = require("express");
const { createVerification } = require("./verify.service");
const { createVerificationCheck } = require("./verifystep2");

const router = express.Router();


router.post("/sendsms", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return res.status(400).json({ ok: false, error: "phoneNumber is required" });
    }

    await createVerification(phoneNumber);
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /sendsms error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send sms" });
  }
});

router.post("/verification", async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return res.status(400).json({ ok: false, error: "phoneNumber is required" });
    }
    if (!code || typeof code !== "string") {
      return res.status(400).json({ ok: false, error: "code is required" });
    }

    await createVerificationCheck(phoneNumber, code);
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /verification error:", err);
    return res.status(500).json({ ok: false, error: "Failed to verify code" });
  }
});

module.exports = router;