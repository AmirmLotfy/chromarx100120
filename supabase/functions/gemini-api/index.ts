
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize' | 'timer' | 'sentiment' | 'task' | 'analytics';
  language: string;
  contentType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type, language, contentType } = await req.json() as GeminiRequest;

    // Input validation
    if (!prompt || !type || !language) {
      throw new Error('Missing required parameters');
    }

    // Sanitize input
    const sanitizedPrompt = prompt.trim().slice(0, 2000); // Limit prompt length

    // Build system prompt based on request type
    let systemPrompt = '';
    switch (type) {
      case 'summarize':
        systemPrompt = `Summarize the following content in ${language}. Be concise and focus on key points:`;
        break;
      case 'categorize':
        systemPrompt = `Suggest a category for this content in ${language}. Choose from: work, personal, study, health, finance, or other:`;
        break;
      case 'timer':
        systemPrompt = `Suggest an optimal timer duration in minutes for this task in ${language}. Provide only the number:`;
        break;
      case 'sentiment':
        systemPrompt = `Analyze the sentiment of this content in ${language}. Return only: positive, negative, or neutral:`;
        break;
      case 'task':
        systemPrompt = `Suggest task improvements and next steps in ${language}:`;
        break;
      case 'analytics':
        systemPrompt = `Analyze the following data and provide insights in ${language}:`;
        break;
      default:
        throw new Error('Invalid request type');
    }

    console.log(`Processing ${type} request for content type: ${contentType || 'text'}`);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${sanitizedPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      throw new Error('Failed to get response from Gemini API');
    }

    const data = await response.json();
    const result = data.candidates[0].content.parts[0].text;

    console.log(`Successfully processed ${type} request`);

    return new Response(
      JSON.stringify({ result }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in gemini-api function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        status: 500 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
