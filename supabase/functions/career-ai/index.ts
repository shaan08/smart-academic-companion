import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, prompt, goals, skills, targetRole } = await req.json();
    console.log('Career AI request:', { type, prompt, targetRole });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userMessage = '';

    switch (type) {
      case 'coach':
        systemPrompt = `You are an expert career coach with deep knowledge of professional development, career transitions, and skill building. Provide personalized, actionable advice that is encouraging yet realistic. Focus on concrete next steps and specific strategies.`;
        userMessage = prompt;
        if (goals?.length > 0) {
          userMessage += `\n\nCurrent goals: ${goals.map((g: any) => `${g.title} (${g.progress}% complete)`).join(', ')}`;
        }
        if (skills?.length > 0) {
          userMessage += `\n\nCurrent skills: ${skills.map((s: any) => `${s.name} (${s.level}%)`).join(', ')}`;
        }
        break;

      case 'skill-gap':
        systemPrompt = `You are a career development expert specializing in skill gap analysis. Analyze the user's current skills against their target role and provide specific, actionable recommendations for skills to develop. Be concise and prioritize the most important gaps.`;
        userMessage = `Target Role: ${targetRole}\n\nCurrent Skills:\n${skills.map((s: any) => `- ${s.name}: ${s.level}%`).join('\n')}\n\nProvide a detailed skill gap analysis with:\n1. Top 3-5 skills needed for this role that are missing or weak\n2. Priority level for each skill (High/Medium/Low)\n3. Recommended resources or learning paths for each skill\n4. Estimated time to develop each skill`;
        break;

      case 'roadmap':
        systemPrompt = `You are a strategic career advisor who creates personalized career roadmaps. Based on the user's current situation, create a detailed, phased career development plan with specific milestones, timeframes, and actionable steps.`;
        userMessage = `Create a personalized career roadmap based on:\n\nGoals:\n${goals?.map((g: any) => `- ${g.title} (Target: ${g.deadline})`).join('\n') || 'No goals set'}\n\nSkills:\n${skills?.map((s: any) => `- ${s.name}: ${s.level}%`).join('\n') || 'No skills tracked'}\n\nProvide:\n1. 3-6 month milestones\n2. 6-12 month milestones\n3. 1-2 year milestones\n4. Specific action items for each phase\n5. Skills to focus on in each phase`;
        break;

      default:
        throw new Error('Invalid request type');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in career-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
