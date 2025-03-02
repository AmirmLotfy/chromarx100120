
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the admin key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { orderId, planId, autoRenew = true } = await req.json();
    
    if (!orderId || !planId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get PayPal configuration (client ID and secret)
    const { data: configData, error: configError } = await supabaseAdmin
      .from('app_configuration')
      .select('value')
      .eq('key', 'paypal_config')
      .single();

    if (configError || !configData) {
      console.error('Error fetching PayPal configuration:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'PayPal is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const paypalConfig = configData.value;
    
    if (!paypalConfig.clientId || !paypalConfig.secretKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'PayPal credentials are missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get access token from PayPal
    const tokenResponse = await fetch(
      `https://${paypalConfig.mode === 'sandbox' ? 'api-m.sandbox' : 'api-m'}.paypal.com/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${paypalConfig.clientId}:${paypalConfig.secretKey}`)}`
        },
        body: 'grant_type=client_credentials'
      }
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Error getting PayPal access token:', tokenData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to authenticate with PayPal' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify the payment by getting order details
    const orderResponse = await fetch(
      `https://${paypalConfig.mode === 'sandbox' ? 'api-m.sandbox' : 'api-m'}.paypal.com/v2/checkout/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    );

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok) {
      console.error('Error verifying PayPal order:', orderData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify payment with PayPal' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if the order was completed
    if (orderData.status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ success: false, error: `Payment not completed. Status: ${orderData.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get plan information
    const subscriptionPlans = {
      basic: { 
        monthly: 4.99, 
        yearly: 49.99,
        durationMonths: 1
      },
      premium: { 
        monthly: 9.99, 
        yearly: 99.99,
        durationMonths: 1
      }
    };
    
    const plan = subscriptionPlans[planId];
    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid plan ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Calculate end date based on plan duration (default to monthly)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // Get user ID from the request authorization header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (!userError && user) {
        userId = user.id;
      }
    }

    // For demo purposes, instead of looking at the real price in the order, 
    // we're just checking if the payment was completed
    // In a production environment, you should verify the amount paid matches the plan price
    
    // Update the subscription record in Supabase
    const subscriptionData = {
      plan_id: planId,
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: !autoRenew,
      user_id: userId,
    };

    // Check if subscription already exists for this user
    let existingSubscription = null;
    if (userId) {
      const { data: existingData } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      existingSubscription = existingData;
    }

    // Either update or insert the subscription record
    let subscriptionResult;
    if (existingSubscription) {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select()
        .single();
      
      subscriptionResult = { data, error };
    } else {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      
      subscriptionResult = { data, error };
    }

    if (subscriptionResult.error) {
      console.error('Error updating subscription:', subscriptionResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update subscription record' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Log the transaction
    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: userId,
        order_id: orderId,
        plan_id: planId,
        amount: plan.monthly, // Assuming monthly plan for simplicity; in production, check actual amount paid
        status: 'completed',
        provider: 'paypal',
        auto_renew: autoRenew
      });

    // Create or update usage statistics
    if (userId) {
      const { data: existingStats } = await supabaseAdmin
        .from('usage_statistics')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingStats) {
        await supabaseAdmin
          .from('usage_statistics')
          .update({
            last_reset: new Date().toISOString(),
            summaries_used: 0,
            api_calls: 0,
          })
          .eq('id', existingStats.id);
      } else {
        await supabaseAdmin
          .from('usage_statistics')
          .insert({
            user_id: userId,
            last_reset: new Date().toISOString(),
            summaries_used: 0,
            api_calls: 0,
            storage_used: 0
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: subscriptionResult.data,
        message: 'Payment processed successfully'
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
