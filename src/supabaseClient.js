import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wxegtdcwdeckoqwkeqxc.supabase.co";

const supabaseKey =
  "sb_publishable_a8KI2nXnWcRImpQKyM4EPg_NWM26JKo";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);