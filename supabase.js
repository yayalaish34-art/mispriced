// supabase.js
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ⚠️ חובה: Service Role Key (רק בשרת)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
