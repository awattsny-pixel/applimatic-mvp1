# Applimatic Job Search Workflow

Complete guide to the job search and application tracking system.

## The Complete Flow

### 1. **Search Jobs** 🔍
- Navigate to `/dashboard/search` or click "Search Jobs" in the sidebar
- Enter a job title, role, or keyword
- (Optional) Use advanced filters:
  - Location
  - Salary range (min/max)
  - Experience level
  - Work type (remote, hybrid, in-person)
  - Posted within (24h, 7d, 30d)
  - Employment type (full-time, part-time, contract, etc.)
- Click search or hit Enter
- Results load from multiple sources: RapidAPI, Indeed, Glassdoor, LinkedIn, Mock

### 2. **Interact with Results**
Each job card shows:
- Company name and job title
- Location, salary, job type, posting date
- Brief description
- Source badge (Indeed 🔵, RapidAPI ⚡, etc.)

#### Actions on each job:
- **❤️ / 🤍 Heart Icon** — Save/unsave the job to your "Saved Jobs" list
- **View Job →** — Open the original job posting
- **+ Apply** (Green) — Add to your applications tracker
- **✨ Applimatic Me** (Blue) — Pre-fill and tailor your resume for this job

### 3. **Save Jobs for Later** ❤️
- Click the heart icon to save any job
- Saved jobs are stored in your account (persists across sessions)
- View all saved jobs at `/dashboard/saved` or click "Saved Jobs" in sidebar
- Easily unsave by clicking the filled heart again

### 4. **Create an Application** + Apply
- Click the green **"+ Apply"** button on any job
- Job is automatically added to your applications tracker
- Status is set to "applied"
- Navigate to `/dashboard/applications` to view all applications

### 5. **Track Applications** 📋
Navigate to `/dashboard/applications` to see all jobs you've applied to:
- **Status Dropdown**: Change application status
  - Draft (gray) — Not yet submitted
  - Applied (blue) — You've applied
  - Interview (green) — Interview scheduled
  - Offer (yellow) — Offer received
  - Rejected (red) — Application rejected
- **Date** — When you added the application
- **Applimatic Status**:
  - ✨ Applimatic Me (blue) — Tailor resume/cover letter
  - ★ Applimatic Complete (purple) — Already customized
- **Delete** (×) — Remove application from tracker

### 6. **Tailor Your Application** ✨
From search results, saved jobs, or applications page:
- Click **"✨ Applimatic Me"**
- Job details are pre-filled (company, title, description)
- Upload your master resume or paste content
- AI customizes your resume and writes a cover letter
- View tailored resume, cover letter, and ATS score
- Results are saved and linked to your application

## Quick Access Routes

| Action | URL | Shortcut |
|--------|-----|----------|
| Search jobs | `/dashboard/search` | Sidebar: 🔍 Search Jobs |
| View saved jobs | `/dashboard/saved` | Sidebar: ❤️ Saved Jobs |
| View applications | `/dashboard/applications` | Sidebar: 📋 Applications |
| Tailor resume | `/dashboard/tailor` | Sidebar: ✨ AppliMatic |
| Upload resume | `/dashboard/resume` | Sidebar: 📄 My Resume |

## Tips & Tricks

### 1. Build Your Pipeline
- Search broadly and save 10-20 interesting opportunities
- Review later and apply to your top choices
- Track applications so you don't lose track

### 2. Use Applimatic Strategically
- Don't customize every job — focus on roles that excite you
- Your free tier gives you 3 tailored applications/month
- Upgrade to Starter (20/month) or Pro (unlimited)

### 3. Organize Your Job Search
- Use saved jobs as your "shortlist"
- Use applications to track actual submissions
- Update status as interviews/offers come in

### 4. Save Search Filters
- Popular searches: "Product Manager", "Remote Engineer", etc.
- Narrow by salary range to find well-paying opportunities
- Filter by "Posted within 24h" to catch fresh postings

## Database Tracking

All data is securely stored in your Supabase account:
- **saved_jobs** — Jobs you've bookmarked
- **applications** — Jobs you've applied to
- **tailored_outputs** (via tailor API) — Customized resumes/cover letters
- Row-level security ensures only you can see your data

## Next Features Coming Soon

- 📊 Job search analytics (most viewed roles, top companies, etc.)
- 📧 Email notifications for new jobs matching your saved searches
- 📁 Organize jobs into "pipelines" or "companies"
- 🔄 Duplicate detection (avoid applying twice)
- 📋 Interview prep for scheduled interviews
- 💾 Export applications as CSV
