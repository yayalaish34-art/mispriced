// billing/cardcom.recurring.service.js

const qs = require("qs");

const RECURRING_URL =
  "https://secure.cardcom.solutions/interface/RecurringPayment.aspx";

async function createRecurringOrder({
  lowProfileDealGuid,
  companyName,
  price,
  nextDateToBill, // dd/MM/yyyy
  returnValue,
}) {
  const payload = {
    TerminalNumber: process.env.CARDCOM_TERMINAL,
    UserName: process.env.CARDCOM_API_NAME,
    codepage: 65001,
    Operation: "NewAndUpdate",

    LowProfileDealGuid: lowProfileDealGuid,

    "Account.CompanyName": companyName,

    "RecurringPayments.InternalDecription": "Subscription",
    "RecurringPayments.NextDateToBill": nextDateToBill,
    "RecurringPayments.TotalNumOfBills": 999999,
    "RecurringPayments.FinalDebitCoinId": 2,
    "RecurringPayments.ReturnValue": returnValue,

    "RecurringPayments.IsActive": "true",
    "RecurringPayments.DocTypeToCreate": 3,

    "RecurringPayments.FlexItem.InvoiceDescription": "Subscription",
    "RecurringPayments.FlexItem.Price": price,
  };

  const res = await fetch(RECURRING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: qs.stringify(payload),
  });

  const text = await res.text();

  const data = {};
  text.split("&").forEach((p) => {
    if (!p) return;
    const idx = p.indexOf("=");
    if (idx === -1) return;
    const k = p.slice(0, idx);
    const v = p.slice(idx + 1);
    data[k] = decodeURIComponent(v || "");
  });

  // אם קרדקום החזיר שגיאה
  if (String(data.ResponseCode) !== "0") {
    throw new Error(`Cardcom recurring error: ${text}`);
  }

  return data;
}

module.exports = { createRecurringOrder };
