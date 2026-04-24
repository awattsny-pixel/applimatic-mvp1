# Resume Download & Versioning Guide

Complete guide to saving, downloading, and managing tailored resume versions in Applimatic.

## Overview

After customizing your resume with Applimatic, you can:
1. **Save** the tailored version to your account
2. **Download** as a text file to import into Word/Google Docs
3. **View all versions** in your account history
4. **Update & revise** saved versions

## The Complete Workflow

### Step 1: Tailor Your Resume
1. Go to `/dashboard/tailor` or click **✨ AppliMatic Me** on any job
2. Job details are pre-filled
3. Click **"AppliMatic my application"**
4. Wait for the AI to tailor your resume (20-40 seconds)

### Step 2: Review Results
The results page shows:
- **📊 ATS Score** — How optimized your resume is for this specific job
- **Score Explanation** — Why you got this score
- **Key Matches** (✓) — Skills/qualifications that match the job
- **Key Gaps** (✗) — Skills you might need to emphasize or develop
- **What We Changed** — Summary of major modifications
- **Resume Tab** — Section-by-section before/after comparison
- **Cover Letter Tab** — AI-generated cover letter
- **Analysis Tab** — Deep dive into job requirements & your fit

### Step 3: Save & Download
Click the **↓ Save & Download** button in the top right:

1. **Saves to your account**
   - Stored in the `tailored_resumes` table
   - Linked to the job and application
   - Saved indefinitely
   - Can be viewed/updated anytime

2. **Downloads as text file**
   - Filename: `{Company}_{JobTitle}_resume.txt`
   - Nicely formatted with clear sections
   - Includes ATS score and key insights
   - Ready to copy/paste into Word or Google Docs

### Step 4: Import into Word
In Microsoft Word:
1. Create a new blank document
2. Go to **Insert > Text from File**
3. Select the downloaded `.txt` file
4. The resume content is inserted
5. Edit formatting as needed (fonts, spacing, bold emphasis)

In Google Docs:
1. Create a new document
2. **File > Open**
3. Upload or select the downloaded file
4. Edit and format as needed

## Saved Resume Versions

### View Your Saved Versions
Future feature: Dashboard showing all saved tailored resumes
- Filter by company or job title
- Sort by date created
- Quick stats (ATS score, matches/gaps)
- Re-download anytime

### What's Stored
For each saved resume:
- Company name and job title
- Job description
- Tailored content (all sections)
- Cover letter
- ATS score
- Created date
- Optional user notes

### Update a Saved Version
After downloading and editing in Word:
1. Manual process: Tailor the resume again with updated content
2. Future: Upload edited Word file to update the stored version

## File Formats

### Current Download Format: Text (.txt)
**Structure**:
```
═════════════════════════════════════════
TAILORED RESUME FOR COMPANY - JOB TITLE
═════════════════════════════════════════

📊 ATS SCORE: 85
Explanation of your score...

─────────────────────────────────────────
KEY MATCHES
─────────────────────────────────────────
✓ 5+ years product management experience
✓ Proficiency with data analytics tools
...

─────────────────────────────────────────
PROFESSIONAL SUMMARY
─────────────────────────────────────────

BEFORE:
[Original summary]

AFTER:
[Tailored summary]

═════════════════════════════════════════
EXPERIENCE (TAILORED)
═════════════════════════════════════════

Company Name — Job Title
Dates

• Tailored bullet point 1
• Tailored bullet point 2
...

═════════════════════════════════════════
COVER LETTER
═════════════════════════════════════════

[Full AI-generated cover letter]
```

### Future: Word Format (.docx)
When the DOCX generation is implemented:
- Download directly as a Word file
- No manual import needed
- Pre-formatted with professional styling
- Ready to print or submit

### Future: PDF Format (.pdf)
- Print-ready version
- Preserves all formatting
- Can be emailed directly to recruiters
- One-click generation

## Use Cases

### 1. Quick Application
- Tailor resume → Download → Paste into Word → Submit
- Takes 5-10 minutes total
- Perfect for "hot" job postings

### 2. Application Tracking
- Apply to a job
- Tailor and save in Applimatic
- Download and send with application
- Come back later to update

### 3. Interview Preparation
- Download your tailored resume
- Review before the interview
- Familiarize yourself with how you positioned your experience

### 4. Portfolio Building
- Save tailored resumes from multiple positions
- Shows how you adapt your story to different roles
- Great for interviews: "Here's how I've positioned myself..."

## Best Practices

### 1. Review Before Sending
- Always review the tailored resume before submitting
- Check that AI changes align with your real experience
- Adjust any over-customizations
- Fix formatting in Word before sending

### 2. Update Your Master Resume
- Applimatic tailors your master resume
- If your master resume needs updates, upload a new version
- This improves future tailoring
- Better master resume = better customizations

### 3. Use ATS Score as a Guide
- High ATS score (80+) = Resume is well-matched
- Mid score (60-80) = Some gaps, but still competitive
- Low score (<60) = Major mismatches, reconsider the role
- Don't submit if ATS score is very low

### 4. Save Your Versions
- The **↓ Save & Download** button does both
- Saves to your account (for history/updates)
- Downloads immediately (for submission)
- This is your audit trail of customizations

### 5. Cover Letter Strategy
- Download and use the AI-generated cover letter
- Personalize with specific details about the company
- Add a hook or story that shows genuine interest
- Keep it to 1 page

## Troubleshooting

### Download Didn't Start
- Check browser download settings
- Verify pop-ups aren't blocked
- Try a different browser
- Manually copy content from the page

### Text File Won't Open
- Text files are universal — works on Mac, Windows, Linux
- Try opening with Notepad, Word, or Google Docs
- If corrupted, reload page and download again

### Formatting Looks Wrong in Word
- Text file includes visual separators (═, ─, etc.)
- These may display as special characters in Word
- Delete these lines after importing
- Reformat the document to match your resume style

### ATS Score Seems Wrong
- ATS scores are estimates based on job description keywords
- Actual ATS parsing may differ from our calculation
- Use it as a relative guide, not absolute
- Focus on matching key requirements

## Coming Soon

### 1. DOCX Download
- Native Word file format
- No manual import needed
- Professional pre-formatting
- Estimated: Q2 2026

### 2. PDF Export
- Print-ready format
- For direct submission to job boards
- Preserves all formatting
- Estimated: Q2 2026

### 3. Version History
- Dashboard showing all saved tailored resumes
- Filter, sort, search capabilities
- Quick re-download of past versions
- Estimated: Q2 2026

### 4. Collaboration
- Share tailored resumes with mentors
- Get feedback on customizations
- Track which versions got interviews/offers
- Estimated: Q3 2026

### 5. Smart Update
- Update saved versions with new experience
- Reuse customizations for similar roles
- A/B test different tailoring approaches
- Estimated: Q3 2026

## Database Structure

**Table**: `tailored_resumes`
- `id` — Unique resume version ID
- `user_id` — Your user ID
- `application_id` — Linked application (if applicable)
- `company_name` — Company you applied to
- `job_title` — Position title
- `job_description` — The original job posting
- `tailored_content` — All tailored sections (JSON)
- `cover_letter` — Generated cover letter
- `ats_score` — Calculated ATS match score
- `docx_file_url` — DOCX file storage URL (future)
- `cover_letter_file_url` — Separate cover letter file (future)
- `created_at` — When you created this version
- `updated_at` — Last modification
- `notes` — Your personal notes about this version

## Privacy & Security

- All saved resumes are **private**
- Only you can access your saved versions
- Row-level security (RLS) enforced in database
- Your data is not shared or sold
- You can delete any saved version anytime
