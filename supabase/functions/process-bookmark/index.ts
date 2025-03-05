
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate input
    if (!req.body) {
      throw new Error("Request body is missing");
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Invalid JSON in request body");
    }

    const { url, title } = body;

    // Input validation
    if (!url) {
      throw new Error("URL is required");
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      throw new Error("Invalid URL format");
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the bookmark with error handling
    try {
      // Example processing - you can expand this based on your needs
      const processedData = {
        url,
        title: title || "Untitled",
        processed_at: new Date().toISOString(),
        domain: new URL(url).hostname
      }

      console.log('Processing bookmark:', processedData);

      return new Response(
        JSON.stringify({
          status: "success",
          data: processedData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    } catch (processingError) {
      console.error("Error in bookmark processing:", processingError);
      throw new Error(`Bookmark processing failed: ${processingError.message}`);
    }
  } catch (error) {
    console.error('Error processing bookmark:', error);
    
    // Return a well-structured error response
    return new Response(
      JSON.stringify({ 
        status: "error",
        message: error.message || "An unknown error occurred",
        code: error.code || "UNKNOWN_ERROR"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500,
      },
    );
  }
})
