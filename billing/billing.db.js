// billing/billing.db.js

const supabase = require("../supabase");

function normalizePhone(x) {
  if (!x) return null;
  return String(x)
    .trim()              // removes leading/trailing spaces
    .replace(/\s+/g, "") // removes spaces inside too (optional but useful)
    .replace(/^00/, "+"); // optional: 00463 -> +463
}

async function upsertSubscription({
  subscription_id,
  token,
  card_exp_mmyy,
  amount,
  plan,
  next_charge_at, // Date or ISO string
}) {
  const payload = {
    subscription_id,
    token,
    card_exp_mmyy,
    amount,
    plan,
    next_charge_at:
      next_charge_at instanceof Date ? next_charge_at.toISOString() : next_charge_at,
  };

  const { data, error } = await supabase
    .from("billing")
    .upsert(payload, { onConflict: "subscription_id" })
    .select()
    .single();

  if (error) throw new Error(`Supabase upsertSubscription failed: ${error.message}`);
  return data;
}

async function deleteSmsSubscriberByPhone(phone) {
  const p = normalizePhone(phone);
  if (!p) return { deleted: 0 };

  const { error, count } = await supabase
    .from("sms_subscribers")
    .delete({ count: "exact" })
    .eq("phone", p);

  if (error) throw new Error(`Supabase deleteSmsSubscriberByPhone failed: ${error.message}`);
  return { deleted: count ?? 0 };
}

async function getSubscription(subscription_id) {
  const { data, error } = await supabase
    .from("billing")
    .select("*")
    .eq("subscription_id", subscription_id)
    .single();

  if (error) throw new Error(`Supabase getSubscription failed: ${error.message}`);
  return data;
}

async function listSubscriptionsDue(now = new Date()) {
  const nowIso = now.toISOString();

  const { data, error } = await supabase
    .from("billing")
    .select("*")
    .not("token", "is", null)
    .not("card_exp_mmyy", "is", null)
    .lte("next_charge_at", nowIso);

  if (error) throw new Error(`Supabase listSubscriptionsDue failed: ${error.message}`);
  return data || [];
}

async function updateNextChargeAt(subscription_id, next_charge_at) {
  const { data, error } = await supabase
    .from("billing")
    .update({
      next_charge_at:
        next_charge_at instanceof Date ? next_charge_at.toISOString() : next_charge_at,
    })
    .eq("subscription_id", subscription_id)
    .select()
    .single();

  if (error) throw new Error(`Supabase updateNextChargeAt failed: ${error.message}`);
  return data;
}

module.exports = {
  upsertSubscription,
  deleteSmsSubscriberByPhone,
  getSubscription,
  listSubscriptionsDue,
  updateNextChargeAt,
};
