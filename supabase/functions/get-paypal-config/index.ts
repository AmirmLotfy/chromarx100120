
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get client ID and secret from environment variables
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID') || '';
    const secretKey = Deno.env.get('PAYPAL_SECRET_KEY') || '';
    
    // Simple validation
    if (!clientId || !secretKey) {
      throw new Error('PayPal credentials not configured');
    }

    // Determine mode - default to live
    const mode = 'live';  // You can make this configurable if needed

    // Return the PayPal configuration
    return new Response(
      JSON.stringify({
        clientId,
        mode
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Server error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch PayPal configuration',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
