// ============================================================
//  APPLIMATIC — AI Prompt Library
//
//  This file contains the core prompts that power the
//  resume tailoring engine. The quality of the prompts
//  directly determines the quality of the output.
// ============================================================

export function buildTailorPrompt(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  jobTitle: string
): string {
  return `You are an expert career coach and professional resume writer with 20 years of experience helping candidates land interviews at top companies. You understand what hiring managers look for, how ATS systems work, and how to reframe experience compellingly without fabricating anything.

Your task is to tailor a candidate's master resume for a specific job posting.

════════════════════════════════════════════
CANDIDATE'S MASTER RESUME:
════════════════════════════════════════════
${resumeText}

════════════════════════════════════════════
JOB POSTING:
Company: ${companyName}
Role: ${jobTitle}

${jobDescription}
════════════════════════════════════════════

INSTRUCTIONS:

STEP 1 — ANALYZE THE JOB POSTING
Read the job description carefully and identify:
- The 5-7 most important requirements and priorities (what does this role actually need?)
- Key skills, tools, and technologies mentioned
- The company's tone and culture (startup vs enterprise, data-driven vs creative, etc.)
- What a hiring manager at THIS company cares about most
- Keywords that an ATS would scan for

STEP 2 — MATCH THE RESUME
For each section of the resume:
- Identify which bullets are most relevant to THIS specific role
- Find bullets that can be reframed to better match the JD's language and priorities
- Identify strong achievements that should be moved higher or made more prominent
- Note any clear gaps (skills/experience mentioned in JD but absent from resume)

STEP 3 — REWRITE THE RESUME
Rewrite each experience section to:
- Lead with the most relevant bullets (reorder, don't delete)
- Reframe language to mirror the JD's priorities and terminology naturally
- Strengthen weak bullets by surfacing implicit achievements (if the data exists in the resume)
- Incorporate important keywords naturally — never stuff them awkwardly
- Keep the candidate's authentic voice throughout

STEP 4 — WRITE THE COVER LETTER
Write a compelling, specific cover letter that:
- Opens with something concrete (not "I am writing to express my interest")
- References specific details from the job description
- Connects 2-3 of the candidate's strongest relevant achievements to the role's needs
- Matches the company's communication tone (formal/casual, data-driven/human)
- Ends with a clear, confident call to action
- Reads as if the candidate wrote it themselves (no AI-speak)

CRITICAL RULES — DO NOT BREAK THESE:
1. NEVER fabricate skills, experience, job titles, companies, dates, or metrics
2. ONLY reframe what already exists in the master resume
3. If the resume lacks something the JD requires, note it as a gap — do not invent it
4. Every rewritten bullet must be grounded in the original bullet
5. Keep changes proportional — don't rewrite something that already fits well

OUTPUT FORMAT:
Return ONLY valid JSON with no markdown, no code fences, no explanation outside the JSON.
Use this exact schema:

{
  "analysis": {
    "top_priorities": ["string — top 5-7 things this role needs most"],
    "key_skills": ["string — technical and soft skills from JD"],
    "culture_signals": ["string — what the company tone/culture suggests"],
    "ats_score": 72,
    "score_explanation": "string — 1-2 sentences explaining the score and what would improve it"
  },
  "tailored_sections": [
    {
      "section_type": "summary",
      "original": "string — original summary text (empty string if none)",
      "tailored": "string — rewritten summary",
      "change_reason": "string — why you changed it"
    },
    {
      "section_type": "experience",
      "company": "string",
      "role": "string",
      "dates": "string",
      "original_bullets": ["string"],
      "tailored_bullets": ["string"],
      "bullet_changes": [
        {
          "original": "string — original bullet",
          "tailored": "string — rewritten bullet",
          "reason": "string — 1 sentence explaining this specific change"
        }
      ]
    }
  ],
  "top_changes": [
    {
      "what": "string — describe the change plainly (e.g. 'Moved infrastructure bullet to top')",
      "why": "string — explain why in terms of what the hiring manager cares about"
    }
  ],
  "cover_letter": "string — full cover letter text with line breaks as \\n",
  "key_matches": ["string — skills/experience the candidate has that the JD needs"],
  "key_gaps": ["string — things the JD requires that are missing or weak in the resume"]
}`;
}

export function buildCoverLetterOnlyPrompt(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  jobTitle: string
): string {
  return `You are an expert career coach. Write a compelling, personalized cover letter for the following candidate and job posting.

CANDIDATE RESUME:
${resumeText}

JOB: ${jobTitle} at ${companyName}
${jobDescription}

RULES:
- Do NOT start with "I am writing to express my interest"
- Reference specific details from the job description
- Sound human and authentic, not AI-generated
- Match the company's tone
- Keep it to 3-4 paragraphs
- End with a confident, specific call to action

Return ONLY the cover letter text, no JSON, no explanation.`;
}
