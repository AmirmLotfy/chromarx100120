
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { analyticsData, timeframe } = await req.json()
    
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `Analyze this productivity data and provide insights:
    ${JSON.stringify({
      timeframe,
      data: analyticsData,
    })}
    
    Provide insights in this JSON format:
    {
      "summary": "Brief overview of productivity",
      "patterns": ["Array of identified patterns"],
      "recommendations": ["Array of actionable recommendations"],
      "alerts": ["Array of important alerts"],
      "domainSpecificTips": {"domain": "tip"}
    }
    
    Focus on:
    1. Productivity trends and patterns
    2. Time management suggestions
    3. Domain-specific optimization tips
    4. Goal achievement recommendations`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log("Generated insights:", text)
    
    return new Response(JSON.stringify({ insights: JSON.parse(text) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Error analyzing productivity:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
