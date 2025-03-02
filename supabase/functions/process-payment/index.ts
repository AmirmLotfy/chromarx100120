
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// PayPal API endpoints
const SANDBOX_API_URL = "https://api-m.sandbox.paypal.com";
const LIVE_API_URL = "https://api-m.paypal.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request
    const { orderId, planId, userId } = await req.json();

    if (!orderId || !planId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing payment for order ${orderId}, plan ${planId}`);

    // Fetch PayPal config from database
    const { data: configData, error: configError } = await supabaseAdmin
      .from('app_configuration')
      .select('value')
      .eq('key', 'paypal')
      .single();

    if (configError || !configData) {
      console.error('Error fetching PayPal config:', configError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch PayPal configuration" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { client_id, client_secret, mode } = configData.value;
    const baseUrl = mode === 'sandbox' ? SANDBOX_API_URL : LIVE_API_URL;

    // Get PayPal access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${client_id}:${client_secret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get PayPal access token:', tokenData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to authenticate with PayPal" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Verify the payment with PayPal
    const verifyResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const orderData = await verifyResponse.json();
    console.log('PayPal order details:', JSON.stringify(orderData));

    if (!verifyResponse.ok) {
      console.error('Failed to verify PayPal order:', orderData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify payment with PayPal" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check if the payment was successful
    if (orderData.status !== 'COMPLETED' && orderData.status !== 'APPROVED') {
      return new Response(
        JSON.stringify({ success: false, error: `Payment not completed. Status: ${orderData.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Calculate subscription duration and end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30-day subscription

    // Update subscription in database if userId is provided
    if (userId) {
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          started_at: startDate.toISOString(),
          ends_at: endDate.toISOString(),
          payment_provider: 'paypal',
          payment_id: orderId,
          metadata: {
            order_details: orderData
          }
        });

      if (subscriptionError) {
        console.error('Error saving subscription:', subscriptionError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to save subscription" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: {
          id: orderId,
          status: orderData.status
        },
        subscription: {
          planId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error processing payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
