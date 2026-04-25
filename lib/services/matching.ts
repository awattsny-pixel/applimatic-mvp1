import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RoleFitResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}

interface SalaryFitResult {
  score: number;
  alignment: "under" | "meets" | "exceeds";
  explanation: string;
}

interface CultureFitResult {
  score: number;
  matchedValues: string[];
  explanation: string;
}

export interface MatchResult {
  roleFitScore: number;
  salaryFitScore: number;
  cultureFitScore: number;
  finalScore: number;
  recommendation: string;
  details: {
    role: RoleFitResult;
    salary: SalaryFitResult;
    culture: CultureFitResult;
  };
}

// Role Fit: Extract skills and calculate match
export async function calculateRoleFit(
  resumeText: string,
  jobDescription: string
): Promise<RoleFitResult> {
  const prompt = `Analyze the resume and job description to calculate role fit.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON (no markdown):
{
  "score": <0-100>,
  "matchedSkills": [<array of skills found in both>],
  "missingSkills": [<array of required skills not in resume>],
  "explanation": "<brief explanation of fit>"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "");
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error(`Role fit calculation failed: ${error}`);
  }
}

// Salary Fit: Compare salary expectation to job salary
export async function calculateSalaryFit(
  jobSalaryMin: number | null,
  jobSalaryMax: number | null,
  userExpectation: number
): Promise<SalaryFitResult> {
  // If no salary info in job, assume meets expectation (neutral)
  if (!jobSalaryMin && !jobSalaryMax) {
    return {
      score: 75,
      alignment: "meets",
      explanation:
        "Job did not specify salary range. Neutral assessment applied.",
    };
  }

  const jobMid = jobSalaryMin && jobSalaryMax ? (jobSalaryMin + jobSalaryMax) / 2 : jobSalaryMin || jobSalaryMax || 0;
  const tolerance = userExpectation * 0.1; // 10% tolerance

  let alignment: "under" | "meets" | "exceeds";
  let score: number;

  if (jobMid < userExpectation - tolerance) {
    alignment = "under";
    score = Math.max(0, 100 - (userExpectation - jobMid) / 1000 * 50);
  } else if (jobMid > userExpectation + tolerance) {
    alignment = "exceeds";
    score = 100;
  } else {
    alignment = "meets";
    score = 95;
  }

  return {
    score: Math.round(score),
    alignment,
    explanation: `Job salary (${jobMid.toLocaleString()}) ${alignment} user expectation (${userExpectation.toLocaleString()}).`,
  };
}

// Culture Fit: Extract culture keywords and compare
export async function calculateCultureFit(
  jobDescription: string,
  userCulturePreferences: string[]
): Promise<CultureFitResult> {
  const prompt = `Extract culture and values keywords from the job description and compare to user preferences.

Job Description:
${jobDescription}

User Culture Preferences:
${userCulturePreferences.join(", ")}

Return ONLY valid JSON (no markdown):
{
  "score": <0-100>,
  "matchedValues": [<array of user preferences found in job>],
  "explanation": "<brief explanation of culture fit>"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "");
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error(`Culture fit calculation failed: ${error}`);
  }
}

// Calculate final match with weighted scoring
export function calculateFinalMatch(
  roleFit: RoleFitResult,
  salaryFit: SalaryFitResult,
  cultureFit: CultureFitResult
): Pick<MatchResult, "finalScore" | "recommendation"> {
  // Weights: role 50%, salary 30%, culture 20%
  const finalScore = Math.round(
    roleFit.score * 0.5 + salaryFit.score * 0.3 + cultureFit.score * 0.2
  );

  let recommendation = "";
  if (finalScore >= 80) {
    recommendation = "Excellent match! This job aligns well with your profile, compensation, and values.";
  } else if (finalScore >= 60) {
    recommendation = "Good match. The role fits your skills and expectations, though some areas may need consideration.";
  } else if (finalScore >= 40) {
    recommendation = "Moderate match. While there are opportunities, some key requirements or preferences are not fully met.";
  } else {
    recommendation = "Poor match. This role may not align well with your goals. Consider focusing on better opportunities.";
  }

  return {
    finalScore,
    recommendation,
  };
}
