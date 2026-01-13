// billing/cardcom.config.js

module.exports = {
  CREATE_LP_URL: "https://secure.cardcom.solutions/api/v11/LowProfile/CreateLowProfile",
  GET_LP_RESULT_URL: "https://secure.cardcom.solutions/api/v11/LowProfile/GetLpResult",
  DO_TRANSACTION_URL: "https://secure.cardcom.solutions/api/v11/Transactions/Transaction",

  TERMINAL_NUMBER: Number(process.env.CARDCOM_TERMINAL),
  API_NAME: process.env.CARDCOM_API_NAME,

  ISOCoinId_USD: 2,
  ISOCoinId_ILS: 1,
};