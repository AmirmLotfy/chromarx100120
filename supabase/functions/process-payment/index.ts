
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { orderId, planId, userId } = body;

  // Validate required fields
  if (!orderId || !planId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields', details: 'orderId and planId are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Processing payment for order: ${orderId}, plan: ${planId}, user: ${userId}`);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Store subscription record in database
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId || 'anonymous',
        plan_id: planId,
        order_id: orderId,
        status: 'active',
        payment_provider: 'paypal',
        current_period_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select();

    if (error) {
      console.error('Error storing subscription:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store subscription', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription activated successfully',
        subscription: data[0]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
