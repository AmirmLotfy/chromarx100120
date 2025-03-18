
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
    const userId = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // In a production environment, we would retrieve subscription data from localStorage
    // For demonstration purposes, we'll continue returning mock data
    
    const response = {
      subscription: { plan_id: 'free', status: 'active' },
      renewalNeeded: false,
      usageLimits: {
        aiRequests: { limit: 10, used: 0, percentage: 0 },
        bookmarks: { limit: 50, used: 0, percentage: 0 },
        tasks: { limit: 30, used: 0, percentage: 0 },
        notes: { limit: 30, used: 0, percentage: 0 }
      },
      needsUpgrade: false
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
