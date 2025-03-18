
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a client that uses local storage instead of Supabase
const createLocalStorageClient = () => {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: any) => ({
          maybeSingle: async () => {
            const items = JSON.parse(localStorage.getItem(table) || '[]');
            const item = items.find((i: any) => i[column] === value);
            return { data: item || null, error: null };
          }
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          match: async () => {
            const items = JSON.parse(localStorage.getItem(table) || '[]');
            const index = items.findIndex((i: any) => i[column] === value);
            if (index >= 0) {
              items[index] = { ...items[index], ...data };
              localStorage.setItem(table, JSON.stringify(items));
            }
            return { data: index >= 0 ? [items[index]] : [], error: null };
          }
        })
      })
    }),
    rpc: () => ({ data: null, error: null })
  };
};

// For demo purposes, we'll simulate the behavior with mock data
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

    // Return mock subscription data for demonstration
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
