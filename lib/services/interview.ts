import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type CandidateLevel = "junior" | "mid" | "senior";

export interface InterviewQuestion {
  category: "technical" | "behavioral" | "culture" | "role-specific";
  question: string;
  whatInterviewersLookFor: string;
  answerFramework: string;
  keyPoints: string[];
  commonMistakes: string[];
}

export interface InterviewPrepResult {
  jobTitle: string;
  candidateLevel: CandidateLevel;
  questions: InterviewQuestion[];
  generalTips: string[];
}

export async function generateInterviewQuestions(
  jobDescription: string,
  jobTitle: string,
  candidateLevel: CandidateLevel
): Promise<InterviewPrepResult> {
  const levelContext = {
    junior: "entry-level or 0-2 years of experience",
    mid: "intermediate or 2-5 years of experience",
    senior: "senior or 5+ years of experience with leadership experience",
  };

  const prompt = `Generate 4 interview questions (technical, behavioral, culture, role-specific) for a ${levelContext[candidateLevel]} candidate for: ${jobTitle}

Job: ${jobDescription}

Return text format only (no JSON, no markdown):
QUESTION_TEXT|CATEGORY|WHAT_THEY_LOOK_FOR|ANSWER_FRAMEWORK|KEY1,KEY2,KEY3|MISTAKE1,MISTAKE2
(repeat 4 times)
TIP1
TIP2
TIP3

Keep all text on single lines. Categories: technical, behavioral, culture, role-specific`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const lines = responseText.trim().split("\n").filter((l) => l.trim());

    const questions: InterviewQuestion[] = [];
    const generalTips: string[] = [];

    for (const line of lines) {
      if (line.includes("|")) {
        const parts = line.split("|");
        if (parts.length >= 6) {
          questions.push({
            category: (parts[1].trim().toLowerCase() as any) || "behavioral",
            question: parts[0].trim(),
            whatInterviewersLookFor: parts[2].trim(),
            answerFramework: parts[3].trim(),
            keyPoints: parts[4]
              .split(",")
              .map((k) => k.trim())
              .filter((k) => k),
            commonMistakes: parts[5]
              .split(",")
              .map((m) => m.trim())
              .filter((m) => m),
          });
        }
      } else if (line.trim()) {
        generalTips.push(line.trim());
      }
    }

    return {
      jobTitle,
      candidateLevel,
      questions: questions.slice(0, 4),
      generalTips: generalTips.slice(0, 5),
    };
  } catch (error) {
    throw new Error(`Interview prep generation failed: ${error}`);
  }
}
