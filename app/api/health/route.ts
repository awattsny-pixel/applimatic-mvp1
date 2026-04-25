import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: allFeatures, error: allFeaturesError } = await supabase
      .from('package_features')
      .select('feature_key');

    if (allFeaturesError) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to query features',
          error: allFeaturesError.message,
        },
        { status: 500 }
      );
    }

    const featureKeys = allFeatures?.map((f) => f.feature_key) || [];

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection verified',
      database: {
        connected: true,
        features_seeded: featureKeys,
        feature_count: featureKeys.length,
      },
      environment: {
        supabase_url: supabaseUrl ? '✓' : '✗',
        anon_key: supabaseAnonKey ? '✓' : '✗',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
