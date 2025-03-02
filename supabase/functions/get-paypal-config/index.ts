
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
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Query the app_configuration table for PayPal config
    const { data, error } = await supabaseAdmin
      .from('app_configuration')
      .select('value')
      .eq('key', 'paypal')
      .single()

    if (error) {
      console.error('Error fetching PayPal config:', error)
      throw error
    }

    // Return the PayPal configuration
    return new Response(
      JSON.stringify({
        clientId: data.value.client_id,
        mode: data.value.mode
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
