
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zkpivehpzwkjgtepawwa.supabase.co";

const supabasePublishableKey = "sb_publishable_tLgywzmVq0KqksCspTqF3A_tdl1AL5I";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
