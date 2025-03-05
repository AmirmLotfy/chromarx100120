
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
      .eq('key', 'paypal')
      .single();

    if (configError || !configData) {
      console.error('Error fetching PayPal configuration:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'PayPal is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const paypalConfig = configData.value;
    
    if (!paypalConfig.client_id || !paypalConfig.client_secret) {
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
          'Authorization': `Basic ${btoa(`${paypalConfig.client_id}:${paypalConfig.client_secret}`)}`
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
        durationMonths: planId === 'yearly' ? 12 : 1
      },
      premium: { 
        monthly: 9.99, 
        yearly: 99.99,
        durationMonths: planId === 'yearly' ? 12 : 1
      }
    };
    
    const plan = subscriptionPlans[planId];
    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid plan ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Calculate end date based on plan duration
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
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // For autoRenew, create a subscription
    let paypalSubscriptionId = null;
    if (autoRenew && planId !== 'free') {
      try {
        // Check which plan billing frequency to use
        const billingFrequency = plan.durationMonths === 12 ? 'YEARLY' : 'MONTHLY';
        const planPrice = plan.durationMonths === 12 ? plan.yearly : plan.monthly;
        
        // Create a subscription plan in PayPal if needed
        const paypalPlanResponse = await fetch(
          `https://${paypalConfig.mode === 'sandbox' ? 'api-m.sandbox' : 'api-m'}.paypal.com/v1/billing/plans`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenData.access_token}`
            },
            body: JSON.stringify({
              product_id: `CHROMARX_${planId.toUpperCase()}`,
              name: `ChroMarx ${planId === 'basic' ? 'Pro' : 'Premium'} Plan (${billingFrequency.toLowerCase()})`,
              description: `ChroMarx ${planId === 'basic' ? 'Pro' : 'Premium'} Plan with ${billingFrequency.toLowerCase()} billing`,
              billing_cycles: [
                {
                  frequency: {
                    interval_unit: billingFrequency === 'YEARLY' ? 'YEAR' : 'MONTH',
                    interval_count: 1
                  },
                  tenure_type: 'REGULAR',
                  sequence: 1,
                  total_cycles: 0, // Unlimited
                  pricing_scheme: {
                    fixed_price: {
                      value: planPrice.toString(),
                      currency_code: 'USD'
                    }
                  }
                }
              ],
              payment_preferences: {
                auto_bill_outstanding: true,
                setup_fee: {
                  value: '0',
                  currency_code: 'USD'
                },
                setup_fee_failure_action: 'CONTINUE',
                payment_failure_threshold: 3
              }
            })
          }
        );
        
        const paypalPlanData = await paypalPlanResponse.json();
        
        if (!paypalPlanResponse.ok) {
          console.error('Error creating PayPal plan:', paypalPlanData);
          // Continue without auto-renewal
        } else {
          // Create subscription with the plan
          const subscriptionResponse = await fetch(
            `https://${paypalConfig.mode === 'sandbox' ? 'api-m.sandbox' : 'api-m'}.paypal.com/v1/billing/subscriptions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`
              },
              body: JSON.stringify({
                plan_id: paypalPlanData.id,
                start_time: new Date(endDate.getTime() - (24 * 60 * 60 * 1000)).toISOString(), // Start 1 day before expiration
                quantity: 1,
                shipping_amount: {
                  currency_code: 'USD',
                  value: '0'
                },
                subscriber: {
                  name: {
                    given_name: 'ChroMarx',
                    surname: 'User'
                  },
                  email_address: 'user@example.com' // This should be replaced with actual user email
                },
                application_context: {
                  brand_name: 'ChroMarx',
                  shipping_preference: 'NO_SHIPPING',
                  user_action: 'SUBSCRIBE_NOW',
                  payment_method: {
                    payer_selected: 'PAYPAL',
                    payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
                  },
                  return_url: 'https://example.com/success',
                  cancel_url: 'https://example.com/cancel'
                },
                custom_id: userId // Store user ID for webhook processing
              })
            }
          );
          
          const subscriptionData = await subscriptionResponse.json();
          
          if (subscriptionResponse.ok) {
            paypalSubscriptionId = subscriptionData.id;
            console.log('Created PayPal subscription:', paypalSubscriptionId);
          } else {
            console.error('Error creating PayPal subscription:', subscriptionData);
            // Continue without auto-renewal
          }
        }
      } catch (subscriptionError) {
        console.error('Error setting up subscription:', subscriptionError);
        // Continue without auto-renewal
      }
    }
    
    // Update the subscription record in Supabase
    const subscriptionData = {
      plan_id: planId,
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: !autoRenew,
      user_id: userId,
      paypal_subscription_id: paypalSubscriptionId
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
        amount: plan.durationMonths === 12 ? plan.yearly : plan.monthly,
        status: 'completed',
        provider: 'paypal',
        auto_renew: autoRenew,
        paypal_subscription_id: paypalSubscriptionId
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
        paypal_subscription_id: paypalSubscriptionId,
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
