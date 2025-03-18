
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan definitions - must match the client-side definitions
const PLAN_LIMITS = {
  free: {
    bookmarks: 50,
    bookmarkImports: 50,
    bookmarkCategorization: 20,
    bookmarkSummaries: 10,
    keywordExtraction: 15,
    tasks: 30,
    taskEstimation: 5,
    notes: 20,
    noteSentimentAnalysis: 5,
    aiRequests: 10
  },
  pro: {
    bookmarks: -1, // Unlimited
    bookmarkImports: -1, // Unlimited
    bookmarkCategorization: -1, // Unlimited
    bookmarkSummaries: -1, // Unlimited
    keywordExtraction: -1, // Unlimited
    tasks: -1, // Unlimited
    taskEstimation: -1, // Unlimited
    notes: -1, // Unlimited
    noteSentimentAnalysis: -1, // Unlimited
    aiRequests: -1 // Unlimited
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, checkRenewal, usage } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // In a production environment, we would retrieve subscription data from database
    // For demonstration purposes, we'll simulate this with some logic
    
    // Simulate subscription lookup based on userId (demo only)
    // In real implementation, would query the database
    const subscriptionStatus = userId.includes('pro') ? 'pro' : 'free';
    const isActive = !userId.includes('expired');
    const shouldCancel = userId.includes('cancel');
    const isInGracePeriod = userId.includes('grace');
    
    // Calculate renewal date based on subscription
    const now = new Date();
    let renewalDate = new Date(now);
    
    // Add proper time based on billing cycle (monthly or yearly)
    if (userId.includes('yearly')) {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    }
    
    // If we're simulating an upcoming renewal, set the date closer
    if (userId.includes('renew_soon')) {
      renewalDate = new Date(now);
      renewalDate.setDate(renewalDate.getDate() + 2); // 2 days from now
    }
    
    // Calculate grace period end date if applicable
    const gracePeriodEndDate = isInGracePeriod ? new Date(now) : null;
    if (gracePeriodEndDate) {
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7); // 7-day grace period
    }
    
    // If checkRenewal is true, we need to check if the subscription needs renewal
    // and process the renewal if needed
    let renewalProcessed = false;
    let renewalNeeded = false;
    
    // Check if subscription needs renewal (within 3 days and is active)
    if (subscriptionStatus === 'pro' && isActive) {
      // Calculate days until renewal
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      renewalNeeded = daysUntilRenewal <= 3;
      
      if (checkRenewal && renewalNeeded) {
        renewalProcessed = await checkAndProcessRenewal(userId);
      }
    }

    // Calculate usage percentages based on provided usage data or use defaults
    const userUsage = usage || {
      bookmarks: 0,
      bookmarkImports: 0,
      bookmarkCategorization: 0,
      bookmarkSummaries: 0,
      keywordExtraction: 0,
      tasks: 0,
      taskEstimation: 0,
      notes: 0,
      noteSentimentAnalysis: 0,
      aiRequests: 0
    };
    
    const planLimits = PLAN_LIMITS[subscriptionStatus === 'pro' ? 'pro' : 'free'];
    
    // Build usage limits object
    const usageLimits = {};
    
    // Loop through all limit types
    Object.keys(planLimits).forEach(limitType => {
      const limit = planLimits[limitType];
      const used = userUsage[limitType] || 0;
      
      usageLimits[limitType] = {
        limit,
        used,
        percentage: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
      };
    });
    
    // Check if user is approaching limits (over 80% usage on any metric)
    const needsUpgrade = subscriptionStatus === 'free' && Object.keys(usageLimits).some(key => {
      const item = usageLimits[key];
      return item.limit > 0 && item.percentage >= 80;
    });

    // Return detailed subscription status information
    const status = isInGracePeriod ? 'grace_period' : (isActive ? 'active' : 'expired');
    
    const response = {
      subscription: { 
        id: `sub_${userId}_${Date.now()}`,
        plan_id: subscriptionStatus, 
        status,
        renewal_date: renewalDate.toISOString(),
        cancel_at_period_end: shouldCancel,
        grace_period_end_date: gracePeriodEndDate ? gracePeriodEndDate.toISOString() : null,
        billing_cycle: userId.includes('yearly') ? 'yearly' : 'monthly',
        auto_renew: !shouldCancel,
        payment_method: {
          type: userId.includes('paypal') ? 'paypal' : 'card',
          last_four: '4242',
          brand: 'visa',
          expiry_month: 12,
          expiry_year: 2025
        }
      },
      renewalNeeded,
      renewalProcessed,
      usageLimits,
      needsUpgrade,
      // Return feature access info
      features: {
        premium_content: subscriptionStatus === 'pro',
        advanced_analytics: subscriptionStatus === 'pro',
        unlimited_storage: subscriptionStatus === 'pro',
        unlimited_ai: subscriptionStatus === 'pro',
        advanced_task_management: subscriptionStatus === 'pro',
        custom_pomodoro: subscriptionStatus === 'pro',
        domain_insights: subscriptionStatus === 'pro',
        time_tracking: subscriptionStatus === 'pro',
        advanced_bookmark_cleanup: subscriptionStatus === 'pro',
        unlimited_notes: subscriptionStatus === 'pro',
        basic_bookmarks: true, // Available to all users
        basic_tasks: true, // Available to all users
        basic_notes: true, // Available to all users
        basic_ai: true, // Available to all users with limits
        basic_pomodoro: true // Available to all users
      }
    };

    return new Response(
      JSON.stringify({ success: true, ...response }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

/**
 * Check if a subscription needs renewal and process it if needed
 * This implementation calls the process-renewal endpoint
 */
async function checkAndProcessRenewal(userId: string): Promise<boolean> {
  try {
    // Generate a subscription ID (in real system would be retrieved from DB)
    const subscriptionId = `sub_${userId}_${Date.now()}`;
    
    // Call the renewal processing endpoint
    const response = await fetch('https://tfqkwbvusjhcmbkxnpnt.supabase.co/functions/v1/process-renewal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionId,
        userId,
        retryAttempt: false // First attempt
      })
    });
    
    if (!response.ok) {
      throw new Error(`Renewal request failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error processing renewal:', error);
    return false;
  }
}
