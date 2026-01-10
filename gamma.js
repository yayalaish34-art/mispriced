// gamma.js
const axios = require("axios");

const GAMMA_BASE = "https://gamma-api.polymarket.com";

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

async function fetchAllMarkets({ limit = 200 }) {
  let offset = 0;
  let allMarkets = [];

  const now = new Date();
  const end_date_min = addDays(now, 3);
  const end_date_max = addDays(now, 35);

  while (true) {
    const res = await axios.get(`${GAMMA_BASE}/markets`, {
      params: {
        limit,
        offset,
        closed: false,
        volume_num_min: 10000,
        liquidity_num_min: 1000,
        end_date_min,
        end_date_max
      }
    });

    const markets = res.data;
    if (!markets || markets.length === 0) break;

    allMarkets.push(...markets);
    offset += limit;
    console.log(`Fetched ${allMarkets.length} markets so far...`);
  }

  return allMarkets;
}

module.exports = { fetchAllMarkets };
