
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan definitions
const PLAN_LIMITS = {
  free: {
    bookmarks: 50,
    tasks: 30,
    notes: 30,
    aiRequests: 10
  },
  pro: {
    bookmarks: -1, // Unlimited
    tasks: -1, // Unlimited
    notes: -1, // Unlimited
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
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 3); // 3 days from now
    
    // If checkRenewal is true, we need to check if the subscription needs renewal
    // and process the renewal if needed
    let renewalProcessed = false;
    let renewalNeeded = false;
    
    // Check if subscription needs renewal (within 3 days and is active)
    if (subscriptionStatus === 'pro' && isActive) {
      renewalNeeded = true;
      
      if (checkRenewal) {
        renewalProcessed = await checkAndProcessRenewal(userId);
      }
    }

    // Calculate usage percentages based on provided usage data or use defaults
    const userUsage = usage || {
      bookmarks: 0,
      tasks: 0,
      notes: 0,
      aiRequests: 0
    };
    
    const planLimits = PLAN_LIMITS[subscriptionStatus === 'pro' ? 'pro' : 'free'];
    
    const usageLimits = {
      aiRequests: { 
        limit: planLimits.aiRequests, 
        used: userUsage.aiRequests || 0,
        percentage: planLimits.aiRequests > 0 ? 
          Math.min(100, Math.round((userUsage.aiRequests || 0) / planLimits.aiRequests * 100)) : 0
      },
      bookmarks: { 
        limit: planLimits.bookmarks, 
        used: userUsage.bookmarks || 0,
        percentage: planLimits.bookmarks > 0 ? 
          Math.min(100, Math.round((userUsage.bookmarks || 0) / planLimits.bookmarks * 100)) : 0
      },
      tasks: { 
        limit: planLimits.tasks, 
        used: userUsage.tasks || 0,
        percentage: planLimits.tasks > 0 ? 
          Math.min(100, Math.round((userUsage.tasks || 0) / planLimits.tasks * 100)) : 0
      },
      notes: { 
        limit: planLimits.notes, 
        used: userUsage.notes || 0,
        percentage: planLimits.notes > 0 ? 
          Math.min(100, Math.round((userUsage.notes || 0) / planLimits.notes * 100)) : 0
      }
    };
    
    // Check if user is approaching limits (over 80% usage)
    const needsUpgrade = subscriptionStatus === 'free' && (
      (planLimits.aiRequests > 0 && userUsage.aiRequests >= planLimits.aiRequests * 0.8) ||
      (planLimits.bookmarks > 0 && userUsage.bookmarks >= planLimits.bookmarks * 0.8) ||
      (planLimits.tasks > 0 && userUsage.tasks >= planLimits.tasks * 0.8) ||
      (planLimits.notes > 0 && userUsage.notes >= planLimits.notes * 0.8)
    );

    const response = {
      subscription: { 
        plan_id: subscriptionStatus, 
        status: isActive ? 'active' : 'expired',
        renewal_date: renewalDate.toISOString(),
        cancel_at_period_end: shouldCancel
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
        priority_support: subscriptionStatus === 'pro',
        offline_access: true, // Available to all users
        basic_bookmarks: true, // Available to all users
      }
    };

    return new Response(
      JSON.stringify({ success: true, ...response }),
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
        userId
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
