import { NextResponse } from "next/server";
import {
  generateInterviewQuestions,
  type CandidateLevel,
} from "@/lib/services/interview";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_description, job_title, candidate_level } = body;

    // Validate required fields
    if (!job_description || !job_title) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
          error: "job_description and job_title are required",
        },
        { status: 400 }
      );
    }

    // Validate candidate level
    const validLevels: CandidateLevel[] = ["junior", "mid", "senior"];
    const level: CandidateLevel = candidate_level || "mid";

    if (!validLevels.includes(level)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid candidate level",
          error: "candidate_level must be 'junior', 'mid', or 'senior'",
        },
        { status: 400 }
      );
    }

    // Generate interview questions
    const interviewPrep = await generateInterviewQuestions(
      job_description,
      job_title,
      level
    );

    // Organize questions by category
    const questionsByCategory = {
      technical: interviewPrep.questions.filter(
        (q) => q.category === "technical"
      ),
      behavioral: interviewPrep.questions.filter(
        (q) => q.category === "behavioral"
      ),
      culture: interviewPrep.questions.filter(
        (q) => q.category === "culture"
      ),
      roleSpecific: interviewPrep.questions.filter(
        (q) => q.category === "role-specific"
      ),
    };

    return NextResponse.json({
      status: "success",
      interview_prep: {
        jobTitle: interviewPrep.jobTitle,
        candidateLevel: interviewPrep.candidateLevel,
        questionsByCategory,
        allQuestions: interviewPrep.questions,
        generalTips: interviewPrep.generalTips,
        totalQuestions: interviewPrep.questions.length,
      },
    });
  } catch (error) {
    console.error("Interview prep error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Interview prep generation failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
