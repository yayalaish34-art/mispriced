// clearing.js
const { fetchAllMarkets } = require("./gamma");

function parseOutcomePrices(outcomePrices) {
  if (!outcomePrices) return [];

  try {
    const arr = JSON.parse(outcomePrices);
    return arr
      .map(v => (typeof v === "number" ? v : Number(v)))
      .filter(n => Number.isFinite(n));
  } catch {
    return [];
  }
}

function hasExtremePrice(prices) {
  return prices.some(
    p => (p >= 0 && p <= 0.06) || (p >= 0.95 && p <= 1)
  );
}

async function getClearedMarkets() {
  const all = await fetchAllMarkets({ limit: 200 });

  return all
    .filter(m => {
      const prices = parseOutcomePrices(m.outcomePrices);
      if (prices.length === 0) return false;
      return !hasExtremePrice(prices);
    })
    .map(m => ({
      id: String(m.id ?? ""),
      question: String(m.question ?? "")
    }))
    .filter(m => m.id && m.question);
}

module.exports = { getClearedMarkets };
