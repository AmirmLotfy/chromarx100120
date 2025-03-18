
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PayPal API configuration
const PAYPAL_CONFIG = {
  clientId: 'AVgQsC5HEYPsUFRZaWkyCGRa-FxBDulKF6t5Cl_CpxnZ_f1W5ks8qDM',
  secret: Deno.env.get('PAYPAL_SECRET') || '******', // Securely stored in environment variables
  mode: 'sandbox', // Change to 'live' for production
};

// Plan pricing for Pro plan
const PLAN_PRICING = {
  monthly: 4.99,
  yearly: 49.99
};

// Maximum number of retries for failed payments
const MAX_RETRY_ATTEMPTS = 3;

// Grace period duration in days
const GRACE_PERIOD_DAYS = 7;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId, userId, retryAttempt, billingCycle = 'monthly' } = await req.json();
    
    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing subscriptionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // In a real implementation, this would:
    // 1. Retrieve the subscription details from database
    // 2. Get the saved payment method
    // 3. Process the payment through PayPal API
    // 4. Update the subscription with new period dates
    
    // Simulate payment processing outcome (success most of the time, but occasional failures)
    // This allows us to test the retry and grace period mechanism
    let paymentSuccess = true;
    
    // If it's a retry attempt, we'll fail less often
    if (retryAttempt) {
      paymentSuccess = Math.random() > 0.2; // 80% success rate on retries
    } else {
      paymentSuccess = Math.random() > 0.1; // 90% success rate on first attempts
    }
    
    // For testing specific scenarios: If the subscription ID contains "fail", always fail
    if (subscriptionId.includes('fail')) {
      paymentSuccess = false;
    }
    
    // For testing grace periods: If the ID contains "grace", set to enter grace period
    const enterGracePeriod = subscriptionId.includes('grace');
    
    if (!paymentSuccess) {
      console.log(`Payment failed for subscription ${subscriptionId}`);
      
      // In a real implementation, check retry attempts and determine if we should enter grace period
      const attemptsCount = retryAttempt ? parseInt(retryAttempt.toString()) : 0;
      
      if (attemptsCount >= MAX_RETRY_ATTEMPTS || enterGracePeriod) {
        // Enter grace period
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment processing failed', 
            // Return the details for the client to handle
            errorDetails: {
              code: 'payment_failed_grace_period',
              message: 'We were unable to process your payment. Your subscription has entered a grace period.',
              recoverable: true,
              gracePeriodEnd: gracePeriodEnd.toISOString(),
              attemptsCount: attemptsCount + 1
            }
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } else {
        // Schedule retry
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment processing failed', 
            // Return the details for the client to handle
            errorDetails: {
              code: 'payment_failed',
              message: 'We were unable to process your payment. We will retry again soon.',
              recoverable: true,
              retryAttempt: attemptsCount + 1,
              nextRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Retry in 24 hours
            }
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }
    
    // For successful payment processing
    
    // Calculate next period dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    // Check if it's monthly or yearly
    const isYearly = billingCycle === 'yearly' || subscriptionId.includes('yearly');
    
    if (isYearly) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    const amount = isYearly ? PLAN_PRICING.yearly : PLAN_PRICING.monthly;
    
    // Generate a unique receipt number
    const receiptNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const renewalResult = {
      success: true,
      subscription: {
        id: subscriptionId,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        renewal_processed: true,
        renewal_date: startDate.toISOString(),
        billing_cycle: isYearly ? 'yearly' : 'monthly',
        grace_period: false,
        grace_period_end: null
      },
      payment: {
        id: `payment_${Date.now()}`,
        amount: amount,
        status: 'completed',
        provider: 'paypal',
        created_at: startDate.toISOString()
      },
      // Include receipt/invoice data
      receipt: {
        receipt_number: receiptNumber,
        receipt_url: `/api/receipts/${receiptNumber}`,
        invoice_pdf: `/api/invoices/${receiptNumber}.pdf`
      }
    };

    // In a real implementation, would send an email receipt with payment confirmation
    console.log(`Successfully processed renewal for subscription ${subscriptionId}`);

    return new Response(
      JSON.stringify(renewalResult),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        errorDetails: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
