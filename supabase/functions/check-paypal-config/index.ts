
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed PayPal configuration with client ID and environment
const PAYPAL_CONFIG = {
  clientId: 'AVgQsC5HEYPsUFRZaWkyCGRa-FxBDulKF6t5Cl_CpxnZ_f1W5ks8qDM',
  mode: 'sandbox',  // Change to 'live' for production
  configured: true,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return the pre-configured PayPal settings
    return new Response(
      JSON.stringify({ 
        success: true, 
        ...PAYPAL_CONFIG
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
