import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, userInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `As a professional nutritionist, create a comprehensive personalized diet plan for ${goal}.

User Information: ${userInfo || "No specific information provided"}

Please provide a DETAILED plan with:
1. **Daily Calorie Target** - Specific number with rationale
2. **Macronutrient Breakdown** - Exact grams of protein, carbs, and fats with percentages
3. **Complete Meal Plan** - Detailed meals for:
   - Breakfast (with portions and calories)
   - Mid-Morning Snack
   - Lunch (with portions and calories)
   - Evening Snack
   - Dinner (with portions and calories)
4. **Foods to Include** - List of 10+ specific foods with their benefits
5. **Foods to Avoid** - List of foods to limit or avoid with reasons
6. **Hydration Guidelines** - Water intake schedule throughout the day
7. **Supplement Recommendations** - If applicable
8. **Timing & Meal Frequency** - Best times to eat
9. **Exercise Recommendations** - Complementary physical activities
10. **5 Practical Success Tips** - Actionable advice for adherence

Format each section with clear headers using "**Section Name:**" format.
Make it comprehensive, specific, and highly actionable with exact measurements.`;

    // Get text response
    const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional nutritionist. Provide detailed, structured, and actionable diet plans.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error("AI gateway error:", textResponse.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const textData = await textResponse.json();
    const dietPlan = textData.choices[0].message.content;

    // Generate meal images
    const imagePrompts = [
      `A beautifully plated healthy breakfast meal with vibrant colors, professional food photography, high resolution`,
      `A nutritious lunch spread with balanced portions, colorful vegetables, lean protein, professional food photography`,
      `A wholesome dinner plate with optimal macronutrient balance, appealing presentation, professional food photography`,
    ];

    const images = [];
    for (const imagePrompt of imagePrompts) {
      try {
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: imagePrompt,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (imageUrl) {
            images.push(imageUrl);
          }
        }
      } catch (error) {
        console.error("Image generation error:", error);
        // Continue even if image generation fails
      }
    }

    return new Response(
      JSON.stringify({ 
        response: dietPlan,
        images: images,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Diet planner error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
