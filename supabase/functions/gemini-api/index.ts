
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return null;
}

// Rate limiting implementation
const RATE_LIMIT = 50; // Requests per IP per hour
const ipRequests = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  
  // Initialize or get rate limit data for this IP
  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, { count: 0, resetTime: now + hourInMs });
  }
  
  const requestData = ipRequests.get(ip)!;
  
  // Reset if time has expired
  if (now > requestData.resetTime) {
    requestData.count = 0;
    requestData.resetTime = now + hourInMs;
  }
  
  // Check if rate limit is reached
  if (requestData.count >= RATE_LIMIT) {
    return false;
  }
  
  // Increment counter
  requestData.count++;
  return true;
}

async function getGeminiResponse(operation: string, content: string, language = "en", options = {}) {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      throw new Error("API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Configure prompt based on operation type
    let prompt = content;
    const defaults = {
      temperature: 0.4,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 1024,
    };

    const params = { ...defaults, ...options };

    switch (operation) {
      case "summarize":
        prompt = `Summarize the following content in a concise way that captures the main points. Output should be 2-3 paragraphs maximum. Language: ${language}\n\nContent: ${content}`;
        break;
      case "categorize":
        prompt = `Given the following content, suggest a single category that best describes it. Return only the category name, nothing else. Language: ${language}\n\nContent: ${content}`;
        params.maxOutputTokens = 100;
        break;
      case "sentiment":
        prompt = `Analyze the sentiment of the following content. Return only one word: "positive", "negative", or "neutral". Language: ${language}\n\nContent: ${content}`;
        params.maxOutputTokens = 50;
        break;
      case "task":
        prompt = `Given the following content, suggest actionable tasks that could be derived from it. Format as a numbered list. Language: ${language}\n\nContent: ${content}`;
        break;
      case "analytics":
        prompt = `Analyze this data and provide insights about productivity patterns. Language: ${language}\n\nData: ${content}`;
        break;
      case "suggest-timer":
        prompt = `Suggest an optimal duration in minutes for focusing on this task. Return only the number, nothing else. Language: ${language}\n\nTask: ${content}`;
        params.maxOutputTokens = 50;
        break;
      default:
        throw new Error("Unknown operation");
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: params,
    });

    const text = result.response.text();
    return text;
  } catch (err) {
    console.error("Error in Gemini API:", err);
    throw err;
  }
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown-ip";
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Special case: check if API key exists
    if (req.method === "POST") {
      const { operation } = await req.json();
      
      if (operation === "check-api-key") {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        return new Response(
          JSON.stringify({ exists: !!apiKey }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (req.method === "POST") {
      const { operation, content, language = "en", contentType = "text" } = await req.json();

      try {
        const result = await getGeminiResponse(operation, content, language, { contentType });
        
        return new Response(
          JSON.stringify({ result, operation }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error(`Error processing ${operation}:`, error);
        
        // Handle specific error types
        let status = 500;
        let message = "Internal server error";
        
        if (error instanceof Error) {
          message = error.message;
          
          if (message.includes("API key")) {
            status = 403;
          } else if (message.includes("rate") && message.includes("limit")) {
            status = 429;
          }
        }
        
        return new Response(
          JSON.stringify({ error: message }),
          { 
            status, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
