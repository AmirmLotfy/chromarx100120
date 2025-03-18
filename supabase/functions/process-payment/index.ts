
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    // Get the request body
    const { orderId, planId, autoRenew = true } = await req.json();
    
    if (!orderId || !planId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Instead of using Supabase, we would save this to local storage in a real implementation
    // For now, we'll return a successful response as before
    
    // Mock storing the payment in local storage
    const paymentHistory = {
      id: `payment_${Date.now()}`,
      user_id: 'local-user',
      order_id: orderId,
      plan_id: planId,
      amount: planId === 'premium' ? 9.99 : 4.99,
      status: 'completed',
      provider: 'paypal',
      auto_renew: autoRenew,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // In a real implementation, we would store this in localStorage
    // localStorage.setItem('payment_history', JSON.stringify([...existing, paymentHistory]));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: {
          id: `sub_${Date.now()}`,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
