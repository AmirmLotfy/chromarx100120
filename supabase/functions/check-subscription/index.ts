
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
    const userId = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get the user's subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch subscription data' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let response = {
      subscription: subscription || { plan_id: 'free', status: 'active' },
      renewalNeeded: false,
      usageLimits: {
        aiRequests: { limit: 10, used: 0, percentage: 0 },
        bookmarks: { limit: 50, used: 0, percentage: 0 },
        tasks: { limit: 30, used: 0, percentage: 0 },
        notes: { limit: 30, used: 0, percentage: 0 }
      },
      needsUpgrade: false
    };

    // Check if subscription needs renewal
    if (subscription && subscription.status === 'active') {
      const currentPeriodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      const daysUntilExpiration = Math.floor((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      response.renewalNeeded = daysUntilExpiration <= 3 && !subscription.cancel_at_period_end;
      
      // If subscription is expired, downgrade to free
      if (currentPeriodEnd < now) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired', plan_id: 'free' })
          .eq('id', subscription.id);
          
        response.subscription.status = 'expired';
        response.subscription.plan_id = 'free';
      }
    }

    // Get usage statistics
    const { data: usageStats, error: usageError } = await supabaseAdmin
      .from('usage_statistics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!usageError && usageStats) {
      // Get counts from various tables
      const { count: bookmarkCount } = await supabaseAdmin
        .from('bookmark_metadata')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: taskCount } = await supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: noteCount } = await supabaseAdmin
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Define limits based on plan
      const limits = {
        free: { bookmarks: 50, tasks: 30, notes: 30, aiRequests: 10 },
        basic: { bookmarks: 500, tasks: 200, notes: 200, aiRequests: 100 },
        premium: { bookmarks: -1, tasks: -1, notes: -1, aiRequests: -1 }, // -1 means unlimited
      };

      const planId = response.subscription.plan_id || 'free';
      const planLimits = limits[planId] || limits.free;

      // Calculate percentages
      response.usageLimits = {
        aiRequests: {
          limit: planLimits.aiRequests,
          used: usageStats.api_calls || 0,
          percentage: planLimits.aiRequests > 0 ? 
            Math.min(100, Math.round((usageStats.api_calls || 0) / planLimits.aiRequests * 100)) : 0
        },
        bookmarks: {
          limit: planLimits.bookmarks,
          used: bookmarkCount || 0,
          percentage: planLimits.bookmarks > 0 ? 
            Math.min(100, Math.round((bookmarkCount || 0) / planLimits.bookmarks * 100)) : 0
        },
        tasks: {
          limit: planLimits.tasks,
          used: taskCount || 0,
          percentage: planLimits.tasks > 0 ? 
            Math.min(100, Math.round((taskCount || 0) / planLimits.tasks * 100)) : 0
        },
        notes: {
          limit: planLimits.notes,
          used: noteCount || 0,
          percentage: planLimits.notes > 0 ? 
            Math.min(100, Math.round((noteCount || 0) / planLimits.notes * 100)) : 0
        }
      };

      // Check if user needs to upgrade (if using >80% of any limit)
      response.needsUpgrade = planId === 'free' && (
        response.usageLimits.aiRequests.percentage >= 80 ||
        response.usageLimits.bookmarks.percentage >= 80 ||
        response.usageLimits.tasks.percentage >= 80 ||
        response.usageLimits.notes.percentage >= 80
      );
    }

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
