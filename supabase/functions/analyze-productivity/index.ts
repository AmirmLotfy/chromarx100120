
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { analyticsData, goalsData, timeframe } = await req.json()
    
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Process domain productivity
    const domainStats = analyticsData.reduce((acc: any, day: any) => {
      if (day.domain_stats) {
        day.domain_stats.forEach((stat: any) => {
          if (!acc[stat.domain]) {
            acc[stat.domain] = { timeSpent: 0, visits: 0 };
          }
          acc[stat.domain].timeSpent += stat.timeSpent;
          acc[stat.domain].visits += stat.visits;
        });
      }
      return acc;
    }, {});

    const productivityByDomain = Object.entries(domainStats).map(([domain, stats]: [string, any]) => ({
      domain,
      score: calculateProductivityScore(stats.timeSpent, stats.visits)
    }));

    // Process goals progress
    const goalProgress = goalsData.map((goal: any) => ({
      category: goal.category,
      current: calculateCurrentHours(analyticsData, goal.category),
      target: goal.target_hours
    }));

    const prompt = `Analyze this productivity data and provide insights:
    ${JSON.stringify({
      timeframe,
      analyticsData,
      productivityByDomain,
      goalProgress
    })}
    
    Provide insights in this JSON format:
    {
      "summary": "Brief overview of productivity",
      "patterns": ["Array of identified patterns"],
      "recommendations": ["Array of actionable recommendations"],
      "alerts": ["Array of important alerts that need attention"],
      "domainSpecificTips": {"domain": "specific productivity tip"},
      "productivityByDomain": ${JSON.stringify(productivityByDomain)},
      "goalProgress": ${JSON.stringify(goalProgress)}
    }
    
    Focus on:
    1. Productivity trends and patterns across different domains
    2. Progress towards goals and recommendations for improvement
    3. Specific tips for each domain based on usage patterns
    4. Important alerts about productivity issues
    5. Time management optimization suggestions`

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

function calculateProductivityScore(timeSpent: number, visits: number): number {
  // Simple productivity score calculation
  // You can make this more sophisticated based on your needs
  const avgTimePerVisit = timeSpent / visits;
  const optimalTimePerVisit = 10 * 60 * 1000; // 10 minutes in milliseconds
  return Math.min(100, Math.round((optimalTimePerVisit / avgTimePerVisit) * 100));
}

function calculateCurrentHours(analyticsData: any[], category: string): number {
  return analyticsData.reduce((total, day) => {
    if (day.category_distribution) {
      const categoryData = day.category_distribution.find((dist: any) => dist.category === category);
      return total + (categoryData ? categoryData.time / (60 * 60 * 1000) : 0); // Convert ms to hours
    }
    return total;
  }, 0);
}
