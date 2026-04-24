# Resume Download & Versioning - Setup Instructions

## What's New

✅ **Save tailored resumes** to your account for future reference  
✅ **Download as text file** with formatted resume content  
✅ **Version history** — Track all tailored resumes you create  
✅ **Database storage** — Persist across sessions indefinitely  

## Quick Setup (2 minutes)

### Step 1: Create the Database Table
Run this SQL in your Supabase SQL Editor:

Copy the entire contents of: `migrations/003_create_tailored_resumes.sql`

Paste into **Supabase > SQL Editor** and click **Run**.

**What this does:**
- Creates `tailored_resumes` table
- Sets up row-level security (users only see their own)
- Creates indexes for fast lookups
- Enables save/download functionality

### Step 2: Test It Out
1. Go to `/dashboard/tailor`
2. Search for a job or paste a job description
3. Click **"AppliMatic my application"**
4. Wait for results
5. Click **↓ Save & Download** button
6. Should see: "✓ Saved & downloaded!"
7. A `.txt` file downloads to your computer

### Step 3: Import into Word (Optional)
The downloaded text file can be imported into Word:
1. Open Microsoft Word
2. **Insert > Text from File**
3. Select the downloaded `.txt` file
4. Reformat as needed

## What Was Built

### Database Table
**File**: `migrations/003_create_tailored_resumes.sql`

Stores:
- Company name and job title
- Tailored resume content (JSON)
- Cover letter
- ATS score
- File URLs (for future DOCX/PDF)
- Timestamps and notes
- User ID (for security)

### API Endpoints

**POST `/api/tailored-resumes/save`**
- Saves a tailored resume to the database
- Request: Tailored content + job details
- Response: Resume ID + download URL
- Authentication required

**POST `/api/tailored-resumes/export`**
- Generates downloadable text file
- Request: Tailored result + job info
- Response: `.txt` file for download
- Authentication required

### Frontend Components

**Tailor Page Updates** (`app/dashboard/tailor/page.tsx`)
- Added `↓ Save & Download` button
- Shows save status messages
- Triggers save + download in sequence
- Returns formatted text file

### Helper Utilities

**DOCX Generator** (`lib/docx-generator.ts`)
- Template for future DOCX generation
- Instructions for implementation
- When `docx` library is installed, can generate native Word files

## Current Limitations

### Text Format Only
Right now, downloads are `.txt` files that need to be imported into Word.

**Why?** To avoid adding dependencies, enabling immediate deployment.

### Future Enhancements
When the `docx` package is installed:
```bash
npm install docx
```

Then create: `/app/api/tailored-resumes/[id]/generate-docx/route.ts`

This will enable:
✓ Native `.docx` file download  
✓ Pre-formatted professional styling  
✓ No manual import needed  

## File Structure

```
applimatic/
├── migrations/
│   ├── 001_create_feature_gating_and_job_search.sql
│   ├── 002_create_saved_jobs.sql
│   └── 003_create_tailored_resumes.sql   ← Run this!
│
├── app/api/
│   ├── tailored-resumes/
│   │   ├── save/route.ts               ← Save to DB
│   │   ├── export/route.ts             ← Generate text file
│   │   └── [id]/download/route.ts      ← Fetch saved resume
│   │
│   └── applications/
│       └── create/route.ts             ← Create from search
│
├── app/dashboard/
│   └── tailor/page.tsx                 ← Updated with save/download
│
├── lib/
│   └── docx-generator.ts               ← DOCX template
│
└── RESUME_DOWNLOAD_GUIDE.md            ← User guide
```

## Testing Checklist

- [ ] Migration SQL runs without errors
- [ ] Tailored resumes table appears in Supabase
- [ ] Tailor a resume and click `↓ Save & Download`
- [ ] See "✓ Saved to your account" message
- [ ] Text file downloads
- [ ] Can open downloaded file in Word/Google Docs
- [ ] Content is properly formatted

## Troubleshooting

### "Failed to save resume version"
- Check user is authenticated
- Verify `tailored_resumes` table exists
- Check Supabase RLS policies are enabled
- Run migration again

### Download doesn't start
- Check browser download settings
- Verify pop-ups aren't blocked
- Try incognito mode
- Try different browser

### Can't find the table after migration
- Refresh Supabase dashboard
- Check the correct project is selected
- Verify SQL executed without errors
- Check for error messages in SQL editor

## Database Queries

### View all your saved resumes
```sql
SELECT id, company_name, job_title, ats_score, created_at
FROM tailored_resumes
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Check storage size
```sql
SELECT COUNT(*) as saved_resumes, 
       MAX(ats_score) as highest_ats
FROM tailored_resumes
WHERE user_id = auth.uid();
```

### Delete a saved resume
```sql
DELETE FROM tailored_resumes
WHERE id = 'resume-uuid'
AND user_id = auth.uid();
```

## Next Steps

### Short Term (This Week)
1. ✅ Run migration to create table
2. ✅ Test save/download workflow
3. ✅ Try importing into Word

### Medium Term (Next Sprint)
4. Add version history page (`/dashboard/saved-resumes`)
5. Allow users to view/re-download past versions
6. Add notes field for tracking
7. Implement DOCX download

### Long Term (Future)
8. PDF export
9. Share versions with mentors
10. Track which versions got interviews/offers
11. Smart version comparison (before/after changes)

## Success Metrics

- [ ] Users can save tailored resumes
- [ ] Download works reliably
- [ ] File imports cleanly into Word
- [ ] ATS scores and key insights are useful
- [ ] Users re-download versions for follow-up apps

## Questions?

Refer to `RESUME_DOWNLOAD_GUIDE.md` for comprehensive user documentation.
