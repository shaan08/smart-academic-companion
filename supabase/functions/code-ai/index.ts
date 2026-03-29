import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, code, language, customPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompts: Record<string, string> = {
      explain: `Explain the following ${language} code in detail. Break down what each section does, explain the logic, and mention any important patterns or concepts used.`,
      fix: `Analyze the following ${language} code for bugs, errors, and issues. Provide the corrected code with explanations of what was wrong and how you fixed it.`,
      optimize: `Optimize the following ${language} code for better performance, readability, and best practices. Show the optimized version and explain the improvements.`,
      generate: `Based on the context of the following ${language} code, generate additional helpful functions or code that would complement it. Explain what you generated and why.`,
      convert: `Convert the following ${language} code to Python (if it's not Python) or JavaScript (if it's Python). Maintain the same logic and functionality.`,
      custom: customPrompt || "Analyze this code.",
    };

    const systemPrompt = `You are an expert coding assistant integrated into a collaborative coding environment. You help students understand, debug, optimize, and write code. Be concise, practical, and educational. Always explain your reasoning.`;
    const userMessage = `${prompts[action] || prompts.custom}\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("code-ai error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
