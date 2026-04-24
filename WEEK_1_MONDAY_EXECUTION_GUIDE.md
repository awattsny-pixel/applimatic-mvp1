# Week 1, Monday — Database Setup Execution Guide

**Goal**: Complete database schema for feature gating, job search, and matching. All backend APIs can build on top of this by EOD Monday.

**Estimated Time**: 3-4 hours (including testing)

---

## Step 1: Run Migration Files in Supabase SQL Editor

**Order matters**: Run these in sequence in your Supabase project's SQL Editor.

### Step 1a: Base Schema (if not already done)
```
File: supabase-schema.sql
Contains: profiles, resumes, applications, RLS policies, storage bucket
Action: Paste entire file into Supabase SQL Editor → Run
Expected: No errors, 3 tables created
```

### Step 1b: Tailored Outputs Schema (if not already done)
```
File: supabase-schema-update.sql
Contains: tailored_outputs table, link to applications
Action: Paste entire file → Run
Expected: No errors, tailored_outputs table created
```

### Step 1c: Stripe Fields (if not already done)
```
File: supabase-schema-stripe.sql
Contains: stripe_customer_id, stripe_subscription_id columns on profiles
Action: Paste entire file → Run
Expected: No errors, 2 new columns added to profiles
```

### Step 1d: Feature Gating + Job Search + Matching (TODAY)
```
File: 001_create_feature_gating_and_job_search.sql
Contains:
  - package_features table (feature definitions)
  - feature_usage table (usage tracking)
  - usage_limits table (monthly quotas)
  - job_postings table (LinkedIn cache)
  - user_searches table (search history)
  - match_results table (match scores)
  - RLS policies for all tables
  - RPC functions: check_feature_limit(), increment_feature_usage()
  - Seed data: populate package_features with free/starter/pro definitions

Action: Paste entire file → Run
Expected: No errors, 6 tables created, 2 RPC functions created, seed data inserted
```

---

## Step 2: Verify All Tables Exist

After running each migration, scroll to the bottom of the SQL output. You should see:

```
table_name          | rows
--------------------|-------
package_features    | 4
feature_usage       | 0
usage_limits        | 0
job_postings        | 0
user_searches       | 0
match_results       | 0
```

This confirms all tables were created and seed data (4 features) was inserted.

**If you see errors:**
- "table already exists" → Normal if running migration twice, safe to ignore
- "column already exists" → Normal if schema was partially applied, safe to ignore
- "permission denied" → Check that you're logged in as project owner
- "syntax error" → Copy/paste error, re-check the SQL file and try again

---

## Step 3: Test RPC Functions

Open Supabase SQL Editor and run this test:

```sql
-- Create a test user (use a real UUID from your database)
-- First, check if test data exists:
SELECT id, plan FROM public.profiles LIMIT 1;
```

This shows you a real user ID. Copy that ID and run:

```sql
-- Test check_feature_limit() function
-- Replace 'your-actual-user-id' with the UUID you copied above
SELECT * FROM public.check_feature_limit('your-actual-user-id'::UUID, 'tailor');
```

**Expected output:**
```
allowed | used_count | limit_count | remaining
--------|-----------|-------------|----------
true    | 0         | 3           | 3
```

This means:
- `allowed = true` → User can tailor (on free plan with 3/month limit)
- `used_count = 0` → Haven't used any yet this month
- `limit_count = 3` → Free plan allows 3 per month
- `remaining = 3` → 3 tailors left this month

**Test all features:**
```sql
SELECT 'search' AS feature, * FROM public.check_feature_limit('your-actual-user-id'::UUID, 'search')
UNION ALL
SELECT 'tailor', * FROM public.check_feature_limit('your-actual-user-id'::UUID, 'tailor')
UNION ALL
SELECT 'differential', * FROM public.check_feature_limit('your-actual-user-id'::UUID, 'differential')
UNION ALL
SELECT 'interview_prep', * FROM public.check_feature_limit('your-actual-user-id'::UUID, 'interview_prep');
```

**Expected output** (for free-tier user):
```
feature           | allowed | used_count | limit_count | remaining
------------------|---------|-----------|-------------|----------
search            | true    | 0         | 10          | 10
tailor            | true    | 0         | 3           | 3
differential      | false   | 0         | 0           | 0
interview_prep    | false   | 0         | 0           | 0
```

✅ **If you see this, feature gating is working correctly!**

---

## Step 4: Test Usage Increment Function

Run this to simulate a user tailoring a resume:

```sql
-- Increment usage for 'tailor' feature
SELECT public.increment_feature_usage(
  'your-actual-user-id'::UUID,
  'tailor',
  850,    -- tokens used by Claude API
  4200    -- response time in ms
);
```

**Expected output:**
```
increment_feature_usage
----------------------
true
```

Now check the usage limit was updated:

```sql
SELECT used_count FROM public.usage_limits
WHERE user_id = 'your-actual-user-id'::UUID
  AND feature_key = 'tailor';
```

**Expected output:**
```
used_count
----------
1
```

This confirms the counter was incremented. Run the check_feature_limit again to see it decreased:

```sql
SELECT * FROM public.check_feature_limit('your-actual-user-id'::UUID, 'tailor');
```

**Expected output** (now 2 remaining instead of 3):
```
allowed | used_count | limit_count | remaining
--------|-----------|-------------|----------
true    | 1         | 3           | 2
```

✅ **If you see 2 remaining, the usage tracking is working!**

---

## Step 5: Verify Indexes Exist (Performance)

Run this to check all indexes were created:

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('package_features', 'feature_usage', 'usage_limits', 'job_postings', 'user_searches', 'match_results')
ORDER BY tablename, indexname;
```

**Expected indexes:**
```
- idx_feature_usage_user_feature_date
- idx_usage_limits_user_date
- idx_job_postings_company_title
- idx_job_postings_created
- idx_user_searches_user_date
- idx_match_results_user_job
- idx_match_results_user_date
```

✅ **If you see these indexes, performance optimization is in place.**

---

## Step 6: Verify RLS Policies

Run this to confirm RLS policies are enabled:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('package_features', 'feature_usage', 'usage_limits', 'job_postings', 'user_searches', 'match_results')
ORDER BY tablename;
```

**Expected output** (RLS enabled on everything except package_features):
```
tablename               | rowsecurity
------------------------|----------
feature_usage          | true
feature_usage          | true
job_postings           | false
match_results          | true
package_features       | false
usage_limits           | true
user_searches          | true
```

✅ **If RLS is properly configured, security is in place.**

---

## Step 7: Create Backend .env Mapping (For API Development)

Add these environment variables to your `.env.local` file so the backend APIs can reference the new tables:

```bash
# Feature Gating RPC Functions (created in migration)
NEXT_PUBLIC_FEATURE_CHECK_FUNCTION="public.check_feature_limit"
NEXT_PUBLIC_FEATURE_USAGE_FUNCTION="public.increment_feature_usage"

# Database table names (for reference)
DB_TABLE_PACKAGE_FEATURES="package_features"
DB_TABLE_FEATURE_USAGE="feature_usage"
DB_TABLE_USAGE_LIMITS="usage_limits"
DB_TABLE_JOB_POSTINGS="job_postings"
DB_TABLE_USER_SEARCHES="user_searches"
DB_TABLE_MATCH_RESULTS="match_results"
```

---

## Monday Completion Checklist

- [ ] All 4 SQL migration files ran successfully (no errors)
- [ ] 6 new tables exist: package_features, feature_usage, usage_limits, job_postings, user_searches, match_results
- [ ] 4 features seeded in package_features: search, tailor, differential, interview_prep
- [ ] 2 RPC functions created: check_feature_limit(), increment_feature_usage()
- [ ] Tested check_feature_limit() returns correct tier limits
- [ ] Tested increment_feature_usage() increments counter correctly
- [ ] All indexes created for performance
- [ ] RLS policies enabled on user-facing tables
- [ ] .env.local updated with new table references

---

## What's Ready for Tuesday

Once this is done, the **LinkedIn API integration** (Tuesday) can proceed because:
- ✅ job_postings table exists to store results
- ✅ feature gating enforced (search feature can be rate-limited)
- ✅ All indexes in place for fast queries
- ✅ RLS policies protect user data

The **matching engine** (Wednesday) can proceed because:
- ✅ match_results table exists to store scores
- ✅ job_postings available to fetch job data
- ✅ Tailor API can call increment_feature_usage()

---

## Database Schema Summary

### Feature Gating
```
package_features  → Defines features & tier limits
                    (free: 10 searches, 3 tailors, etc.)

feature_usage    → Logs every API call (for analytics)
                    (user_id, feature, timestamp, tokens, latency)

usage_limits     → Monthly quota tracking
                    (resets 1st of each month automatically)
```

### Job Search
```
job_postings     → Cached LinkedIn jobs
                    (company, title, salary, description, keywords)

user_searches    → Search history
                    (what users searched for, result count)
```

### Matching
```
match_results    → Match scores for jobs
                    (role_fit, salary_fit, culture_fit, overall_score)
```

### Security
- RLS enabled on all user-facing tables
- RPC functions handle quota enforcement
- No direct SQL execution from frontend

---

## Troubleshooting

**Q: I see "relation already exists" error**
A: This migration was already run. That's fine—the `IF NOT EXISTS` clause prevents duplication.

**Q: check_feature_limit returns `allowed = false` for free user?**
A: Check that `free_tier = TRUE` in package_features for that feature. Run:
```sql
SELECT feature_key, free_tier FROM public.package_features;
```

**Q: Why is `remaining` showing a huge number (999999)?**
A: That's the pro plan (unlimited). The function returns 999999 for unlimited tiers.

**Q: RLS denying my queries?**
A: Make sure you're logged in as the right user. Supabase RLS only allows users to see their own data.

---

## Next: Tuesday Kickoff

Once Monday is verified, tomorrow you'll build:
1. **LinkedIn API client** (`/lib/linkedin/client.ts`)
2. **Job search endpoint** (`POST /api/search`)
3. **Error handling + retry logic**

All APIs will reference the database tables you set up today.

---

**Status**: Ready for Monday execution  
**Time Estimate**: 3-4 hours  
**Blocker Risk**: Low (standard SQL)
