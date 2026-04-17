import { NextResponse } from "next/server";
import {
  calculateRoleFit,
  calculateSalaryFit,
  calculateCultureFit,
  calculateFinalMatch,
  type MatchResult,
} from "@/lib/services/matching";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      job_description,
      resume_text,
      job_salary_min,
      job_salary_max,
      salary_expectation,
      culture_preferences,
    } = body;

    // Validate required fields
    if (!job_description || !resume_text) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
          error: "job_description and resume_text are required",
        },
        { status: 400 }
      );
    }

    if (!salary_expectation || typeof salary_expectation !== "number") {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
          error: "salary_expectation (number) is required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(culture_preferences)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
          error: "culture_preferences (array) is required",
        },
        { status: 400 }
      );
    }

    // Calculate all three fits in parallel
    const [roleFit, salaryFit, cultureFit] = await Promise.all([
      calculateRoleFit(resume_text, job_description),
      calculateSalaryFit(job_salary_min || null, job_salary_max || null, salary_expectation),
      calculateCultureFit(job_description, culture_preferences),
    ]);

    // Calculate final weighted score
    const { finalScore, recommendation } = calculateFinalMatch(
      roleFit,
      salaryFit,
      cultureFit
    );

    const matchResult: MatchResult = {
      roleFitScore: roleFit.score,
      salaryFitScore: salaryFit.score,
      cultureFitScore: cultureFit.score,
      finalScore,
      recommendation,
      details: {
        role: roleFit,
        salary: salaryFit,
        culture: cultureFit,
      },
    };

    // TODO: Save to match_results table in Supabase
    // For now, just return the result

    return NextResponse.json({
      status: "success",
      match: matchResult,
    });
  } catch (error) {
    console.error("Match error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Matching failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
