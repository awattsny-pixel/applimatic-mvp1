# Saved Jobs Feature Setup Guide

## Overview
The saved jobs feature allows users to bookmark job listings from search results for later reference. Saved jobs are stored in the database and can be viewed in a dedicated page.

## What Was Built

### 1. Database Table
- **File**: `migrations/002_create_saved_jobs.sql`
- **Table**: `saved_jobs` with the following columns:
  - `id`: UUID primary key
  - `user_id`: References the authenticated user
  - `job_id`: Unique job identifier from the aggregator
  - `job_title`, `company`, `location`: Job details
  - `job_url`, `job_description`: Full job information
  - `salary`: JSONB for flexible salary data
  - `job_type`, `source`: Job metadata
  - `posted_date`: When job was posted
  - `saved_at`: When user saved it
  - `notes`: User notes about the job
  - `updated_at`: Last modified timestamp
- **Security**: Row-level security (RLS) enabled — users can only access their own saved jobs

### 2. API Routes

#### POST `/api/saved-jobs/toggle`
Saves or unsaves a job (toggles the state).

**Request**:
```json
{
  "job": {
    "id": "job-id",
    "title": "Senior Engineer",
    "company": "Acme Inc",
    "description": "...",
    "jobUrl": "https://...",
    "source": "rapidapi",
    "location": "San Francisco",
    "salary": { "min": 150000, "max": 200000, "currency": "USD" },
    "jobType": "full-time",
    "postedDate": "2026-04-23T10:00:00Z"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "action": "saved" | "unsaved",
  "isSaved": true | false
}
```

#### GET `/api/saved-jobs/check?jobId=...&source=...`
Checks if a specific job is saved by the current user.

**Response**:
```json
{
  "status": "success",
  "isSaved": true | false
}
```

### 3. Frontend Components

#### JobCard (`app/dashboard/search/components/JobCard.tsx`)
- Updated to check saved status on mount
- Heart button (❤️/🤍) now calls the toggle API
- Shows loading state during save operations
- Persists state to database

#### Saved Jobs Page (`app/dashboard/saved/page.tsx`)
- Displays all jobs saved by the current user
- Shows empty state when no jobs saved
- Jobs are sorted by most recently saved
- Uses JobCard component for consistent UI
- Authenticated access only

#### Dashboard Navigation (`components/DashboardNav.tsx`)
- Added "Search Jobs" (🔍) link
- Added "Saved Jobs" (❤️) link
- Links appear in the sidebar navigation

## Setup Instructions

### 1. Create the Database Table
Copy the contents of `migrations/002_create_saved_jobs.sql` and run it in your Supabase SQL editor:
```sql
-- Paste the entire file into Supabase > SQL Editor and run
```

### 2. Verify Authentication Setup
Ensure your app has Supabase auth configured with:
- `@supabase/auth-helpers-react` package installed
- `useAuth()` hook available in client components
- Auth context provider set up in your app

### 3. Test the Feature
1. Go to `/dashboard/search` and search for jobs
2. Click the heart (❤️) icon on any job to save it
3. See the heart fill and the job is saved to the database
4. Click the saved heart (❤️) to unsave it
5. Navigate to `/dashboard/saved` to view all saved jobs
6. Refresh the page — saved state persists

## Database Queries

### Get all saved jobs for a user
```sql
SELECT * FROM saved_jobs 
WHERE user_id = auth.uid()
ORDER BY saved_at DESC;
```

### Get count of saved jobs
```sql
SELECT COUNT(*) FROM saved_jobs 
WHERE user_id = auth.uid();
```

### Delete all saved jobs for a user
```sql
DELETE FROM saved_jobs 
WHERE user_id = auth.uid();
```

## API Response Codes

| Endpoint | Status | Meaning |
|----------|--------|---------|
| `/api/saved-jobs/toggle` | 200 | Job save/unsave successful |
| `/api/saved-jobs/toggle` | 401 | Not authenticated |
| `/api/saved-jobs/toggle` | 500 | Database error |
| `/api/saved-jobs/check` | 200 | Check successful |
| `/api/saved-jobs/check` | 400 | Missing jobId or source parameter |
| `/api/saved-jobs/check` | 401 | Not authenticated |
| `/api/saved-jobs/check` | 500 | Database error |

## Future Enhancements

1. **Saved Job Collections**: Allow users to organize saved jobs into folders
2. **Export**: Let users download saved jobs as CSV/PDF
3. **Recommendations**: Show jobs similar to saved jobs
4. **Notifications**: Notify when similar jobs are posted
5. **Collaboration**: Share saved job lists with others
6. **Activity Feed**: Track when jobs were saved, applied to, etc.
