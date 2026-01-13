// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const supabase = require("./supabase");



app.use(
  cors({
    origin: "*", // בפיתוח: פתוח לכולם
    methods: ["GET", "POST", "OPTIONS"],
  })
);


app.use(express.json());


const smsRoutes = require("./sms");
const dev = require("./devscreen");
const billingRoutes = require("./billing/billing.routes");


app.use("/sms", smsRoutes);
app.use("/devscreen", dev);
app.use("/api/billing", billingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});