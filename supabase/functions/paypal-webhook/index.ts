
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

/**
 * Verifies that the webhook event came from PayPal
 * @param headers Request headers
 * @param body Request body as string
 * @param webhookId PayPal Webhook ID
 * @returns Boolean indicating if the webhook is verified
 */
async function verifyWebhookSignature(headers: Headers, body: string, webhookId: string): Promise<boolean> {
  try {
    // Get PayPal configuration
    const { data: configData } = await supabaseAdmin
      .from('app_configuration')
      .select('value')
      .eq('key', 'paypal')
      .single();
    
    if (!configData) {
      console.error('PayPal configuration not found');
      return false;
    }
    
    const paypalConfig = configData.value;
    
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
    
    if (!tokenData.access_token) {
      console.error('Failed to get PayPal access token');
      return false;
    }
    
    // Create the webhook verification request
    const verifyRequest = {
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body)
    };
    
    // Verify the webhook with PayPal
    const verifyResponse = await fetch(
      `https://${paypalConfig.mode === 'sandbox' ? 'api-m.sandbox' : 'api-m'}.paypal.com/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`
        },
        body: JSON.stringify(verifyRequest)
      }
    );
    
    const verifyData = await verifyResponse.json();
    
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the webhook ID from environment variable
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
    
    if (!webhookId) {
      console.error('PayPal webhook ID not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Get the request body as text for verification
    const bodyText = await req.text();
    
    // Verify the webhook signature
    const isVerified = await verifyWebhookSignature(req.headers, bodyText, webhookId);
    
    if (!isVerified) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid webhook signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Parse the webhook event
    const event = JSON.parse(bodyText);
    console.log('Received verified webhook event:', event.event_type);
    
    // Process different event types
    switch (event.event_type) {
      case 'PAYMENT.SALE.COMPLETED': {
        // Handle successful payment
        const paymentData = event.resource;
        const billingAgreementId = paymentData.billing_agreement_id;
        
        if (!billingAgreementId) {
          console.log('Not a subscription payment, skipping');
          break;
        }
        
        // Get billing agreement details to find the user
        const { data: configData } = await supabaseAdmin
          .from('app_configuration')
          .select('value')
          .eq('key', 'paypal')
          .single();
          
        if (!configData) {
          console.error('PayPal configuration not found');
          break;
        }
        
        const paypalConfig = configData.value;
        
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
        
        // Get agreement details
        const agreementResponse = await fetch(
          `https://${paypalConfig.mode === 'sandbox' ? 'api-m.sandbox' : 'api-m'}.paypal.com/v1/billing/subscriptions/${billingAgreementId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenData.access_token}`
            }
          }
        );
        
        const agreementData = await agreementResponse.json();
        
        // Get the custom_id which should contain the user ID
        const userId = agreementData.custom_id;
        
        if (!userId) {
          console.error('User ID not found in agreement');
          break;
        }
        
        // Find the user's subscription
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (!subscription) {
          console.error('Subscription not found for user:', userId);
          break;
        }
        
        // Update the subscription
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1); // Assuming monthly subscription
        
        await supabaseAdmin
          .from('subscriptions')
          .update({
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            status: 'active'
          })
          .eq('user_id', userId);
          
        // Log the payment
        await supabaseAdmin
          .from('payment_history')
          .insert({
            user_id: userId,
            order_id: paymentData.id,
            plan_id: subscription.plan_id,
            amount: parseFloat(paymentData.amount.total),
            status: 'completed',
            provider: 'paypal',
            auto_renew: !subscription.cancel_at_period_end
          });
          
        console.log('Processed subscription renewal for user:', userId);
        break;
      }
      
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        // Handle subscription cancellation
        const subscriptionData = event.resource;
        const userId = subscriptionData.custom_id;
        
        if (userId) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancel_at_period_end: true
            })
            .eq('user_id', userId);
            
          console.log('Marked subscription as cancelled for user:', userId);
        }
        break;
      }
      
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        // Handle subscription expiration
        const subscriptionData = event.resource;
        const userId = subscriptionData.custom_id;
        
        if (userId) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'expired',
              plan_id: 'free'
            })
            .eq('user_id', userId);
            
          console.log('Marked subscription as expired for user:', userId);
        }
        break;
      }
      
      default:
        console.log('Unhandled event type:', event.event_type);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
