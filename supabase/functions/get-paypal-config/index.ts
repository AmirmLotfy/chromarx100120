
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase URL or service role key");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the PayPal configuration
    const { data, error } = await supabase
      .from("app_configuration")
      .select("value")
      .eq("key", "paypal")
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("PayPal configuration not found");
    }

    // Only return the client_id and mode, not the secret
    const clientConfig = {
      clientId: data.value.client_id,
      mode: data.value.mode || "live"
    };

    return new Response(JSON.stringify(clientConfig), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching PayPal config:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
