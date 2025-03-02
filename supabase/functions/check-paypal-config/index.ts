
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.9";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key (important for accessing the database)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the PayPal configuration from the database
    const { data, error } = await supabase
      .from('app_configuration')
      .select('value')
      .eq('key', 'paypal')
      .maybeSingle();

    if (error) {
      console.error('Error fetching PayPal config:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to retrieve PayPal configuration', 
          configured: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let configured = false;
    let clientId = '';
    let mode = 'sandbox';

    if (data && data.value) {
      // Data exists, check if it has required fields
      const config = data.value;
      const hasClientId = config.client_id && config.client_id.length > 10;
      const hasClientSecret = config.client_secret && config.client_secret.length > 10;
      
      configured = hasClientId && hasClientSecret;
      clientId = config.client_id || '';
      mode = config.mode || 'sandbox';
    }

    return new Response(
      JSON.stringify({
        success: true,
        configured,
        clientId,
        mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error checking PayPal configuration:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error', 
        configured: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
