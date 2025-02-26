
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

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
    const { operation, content, language = 'en', url, title } = await req.json()

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    let result
    console.log(`Processing ${operation} operation`)

    switch (operation) {
      case 'summarize':
        const summaryPrompt = `Summarize this content concisely in ${language}, focusing on key points:\n\n${content}`
        const summaryResponse = await model.generateContent(summaryPrompt)
        result = await summaryResponse.response.text()
        break

      case 'categorize':
        const categoryPrompt = `
Based on this content:
Title: ${title}
URL: ${url}
Content: ${content}

Suggest a single, specific category that best describes this bookmark. Choose from common categories like:
- Technology
- Business
- Science
- Health
- Education
- Entertainment
- News
- Personal
- Shopping
- Social Media
- Reference
- Other (with specific suggestion)

Respond in ${language} with ONLY the category name, nothing else.`
        const categoryResponse = await model.generateContent(categoryPrompt)
        result = await categoryResponse.response.text()
        break

      case 'sentiment':
        const sentimentPrompt = `Analyze the sentiment of this content and respond with exactly one word (positive, negative, or neutral):\n\n${content}`
        const sentimentResponse = await model.generateContent(sentimentPrompt)
        result = await sentimentResponse.response.text()
        break

      case 'suggest-timer':
        const timerPrompt = `Suggest an optimal duration in minutes for this task:\n\n${content}`
        const timerResponse = await model.generateContent(timerPrompt)
        const minutes = parseInt(await timerResponse.response.text())
        result = isNaN(minutes) ? 25 : minutes
        break

      case 'chat':
        const chatResponse = await model.generateContent(content)
        result = await chatResponse.response.text()
        break

      default:
        throw new Error('Invalid operation')
    }

    console.log('Operation completed successfully')

    return new Response(
      JSON.stringify({ result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in AI processing:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
