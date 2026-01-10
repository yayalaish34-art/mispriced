// index.js
require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());


const smsRoutes = require("./sms");



app.use("/", smsRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});