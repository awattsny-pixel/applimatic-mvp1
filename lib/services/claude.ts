import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function tailorResumeAndCoverLetter(
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  resumeText: string
) {
  const systemPrompt = `You are an expert resume and cover letter writer. Your task is to tailor a resume and write a compelling cover letter for a specific job posting.

Analyze the job requirements and rewrite the resume to highlight relevant skills and experiences. Write a professional cover letter that addresses the specific needs mentioned in the job posting.

Return ONLY valid JSON (no markdown, no extra text):
{
  "tailored_resume": "...",
  "cover_letter": "..."
}`;

  const userPrompt = `Job Title: ${jobTitle}
Company: ${companyName}

Job Description:
${jobDescription}

Base Resume:
${resumeText}

Please tailor the resume and write a cover letter for this position.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code blocks if present
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "");
    }
    const result = JSON.parse(jsonStr);

    return {
      tailored_resume: result.tailored_resume,
      cover_letter: result.cover_letter,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (error) {
    throw error;
  }
}
