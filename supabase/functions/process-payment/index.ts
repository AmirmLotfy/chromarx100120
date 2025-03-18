
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PayPal API configuration
const PAYPAL_CONFIG = {
  clientId: 'AVgQsC5HEYPsUFRZaWkyCGRa-FxBDulKF6t5Cl_CpxnZ_f1W5ks8qDM',
  secret: '******', // This would be stored securely in Supabase's secrets in production
  mode: 'sandbox', // Change to 'live' for production
};

// Plan pricing mapping
const PLAN_PRICES = {
  'free': 0,
  'basic': 4.99,
  'premium': 9.99
};

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

    // In a real implementation, we would verify the payment with PayPal's API
    // using the orderId to ensure the payment was successful
    // Example code (commented out as we don't have the actual secret):
    /*
    const baseUrl = PAYPAL_CONFIG.mode === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com';
    
    // Get OAuth token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.secret}`)}`
      },
      body: 'grant_type=client_credentials'
    });
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    // Verify the order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const orderData = await orderResponse.json();
    
    // Check if payment was completed and the amount matches the plan
    if (orderData.status !== 'COMPLETED') {
      throw new Error('Payment not completed');
    }
    
    // Verify amount matches plan price
    const paidAmount = parseFloat(orderData.purchase_units[0].amount.value);
    if (paidAmount !== PLAN_PRICES[planId]) {
      throw new Error('Payment amount does not match plan price');
    }
    */
    
    // For now, we'll simulate a successful verification
    // In a real implementation, we would store this information in a database
    const paymentHistory = {
      id: `payment_${Date.now()}`,
      user_id: 'local-user',
      order_id: orderId,
      plan_id: planId,
      amount: PLAN_PRICES[planId] || 0,
      status: 'completed',
      provider: 'paypal',
      auto_renew: autoRenew,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Calculate subscription period (1 month from now)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: {
          id: `sub_${Date.now()}`,
          plan_id: planId,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: !autoRenew
        },
        message: 'Payment processed successfully',
        payment: paymentHistory
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
