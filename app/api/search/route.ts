import { NextResponse } from 'next/server';
import { aggregateJobs } from '@/lib/services/jobAggregator';

export interface SearchFilters {
  query: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  experience?: string;
  workType?: 'remote' | 'hybrid' | 'in-person' | '';
  postedWithin?: '24h' | '7d' | '30d' | '';
  employmentTypes?: string[];
  page?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SearchFilters;
    const { query, location, minSalary, maxSalary, experience, workType, postedWithin, employmentTypes, page = 1 } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Search query is required' },
        { status: 400 }
      );
    }

    // Aggregate jobs from all configured sources with filters
    const searchResult = await aggregateJobs(query, {
      location,
      minSalary,
      maxSalary,
      experience,
      workType,
      postedWithin,
      employmentTypes,
      page,
    });

    return NextResponse.json({
      status: 'success',
      jobs: searchResult.jobs,
      total_results: searchResult.totalResults,
      result_count: searchResult.totalResults,
      sources_info: searchResult.sources,
      // Include source breakdown for visibility
      source_summary: Object.entries(searchResult.sources).map(([source, info]) => ({
        source,
        count: info.count,
        error: info.error || null,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Search failed',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
