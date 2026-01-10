// gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getClearedMarkets } = require("./clearing");
require("dotenv").config();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

async function classifyMarket() {
  const markets = await getClearedMarkets();

  const prompt = `
You are ranking prediction markets based ONLY on the topic and wording of the question.
Do NOT use prices, probabilities, volume, odds, or external facts.
Do NOT perform grounding or reality checks.

GOAL:
Return up to 50 markets whose SUBJECT is most prone to a large gap between market belief
and real-world outcome — based purely on subject-level uncertainty and narrative risk.

DEFAULT EXCLUDE:
- Sports results, matches, tournaments
- Crypto price targets
- Financial price targets (stocks, commodities, FX)

INCLUDE ONLY IF the wording shows:
- vague or subjective resolution
- reliance on announcements, intent, rumors, or discretion
- geopolitical, military, or legal uncertainty
- AI / tech meta-evaluations (rankings, benchmarks, “best model”)
- celebrity or influencer behavior
- unclear definitions of what “counts”

THINK IN TERMS OF:
- narrative-driven topics
- interpretation ambiguity
- information asymmetry
- discretion or timing uncertainty

INPUT:
[{ "id": "...", "question": "..." }]

OUTPUT (JSON ONLY):
{
  "ranked": [
    {
      "rank": 1,
      "id": "...",
      "question": "...",
      "reason": "Why the SUBJECT is prone to mispricing (topic-based only)",
      "subjectMispricingScore": 0-1
    }
  ]
}
RULES:
- Rank from highest to lowest mispricing risk
- Max 50 items
- No probabilities, no real-world facts, no prices

INPUT:
${JSON.stringify(markets)}

`;

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}
classifyMarket();

module.exports = { classifyMarket };
