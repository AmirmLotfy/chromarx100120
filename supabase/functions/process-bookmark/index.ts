
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sanitize URL to prevent security issues
const sanitizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid URL protocol');
    }
    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

serve(async (req) => {
  // Log request info without sensitive data
  console.log(`Request to process-bookmark from ${req.headers.get('origin') || 'unknown origin'}`);
  
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
    
    // Sanitize and validate URL format
    const sanitizedUrl = sanitizeUrl(url);
    const sanitizedTitle = title ? sanitizeInput(title) : "Untitled";

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the bookmark with error handling
    try {
      // Extract domain from URL
      const domainMatch = sanitizedUrl.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
      const domain = domainMatch ? domainMatch[1] : "unknown-domain";
      
      // Example processing - you can expand this based on your needs
      const processedData = {
        url: sanitizedUrl,
        title: sanitizedTitle,
        processed_at: new Date().toISOString(),
        domain
      }

      console.log('Processing bookmark:', { 
        url: sanitizedUrl,
        domain,
        processed_at: processedData.processed_at 
      });

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
        code: error.code || "UNKNOWN_ERROR",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500,
      },
    );
  }
})
