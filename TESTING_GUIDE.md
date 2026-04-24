# Testing Guide for Applimatic Resume Tailoring & Download

## Issue Found & Fixed ✅
**DOCX Download Bug**: The frontend was saving files as `.txt` instead of `.docx`
- **File**: `/app/dashboard/tailor/page.tsx`, line 305
- **Fix**: Changed `a.download` from `resume.txt` to `resume.docx`
- **Status**: FIXED in this session

## Why It Happened
The backend was generating proper DOCX files (binary format), but the frontend's `<a>` tag download attribute was forcing it to save as `.txt`. The browser respects the download attribute filename over the server's Content-Disposition header.

## Complete Testing Workflow

### Setup
1. Restart dev server: `npm run dev`
2. Login to Applimatic
3. Ensure you have a master resume uploaded

### Scenario A: Tailor a New Job → Download DOCX

#### Steps:
1. Go to `/dashboard/tailor` (or Dashboard → Tailor Resume)
2. Enter job details:
   - Company: "Stripe"
   - Job Title: "Product Manager"
   - Job Description: (paste a real job description, at least 50 chars)
3. Click "AppliMatic" and wait 20-40 seconds
4. View the tailored output:
   - Review the before/after changes in the Resume tab
   - Check ATS Score
   - Review key matches/gaps
5. Click "Rebuild Your Resume ↓" button
6. Merged resume should appear in Word-document style
7. Click "↓ Download DOCX" button
8. **VERIFY**:
   - ✅ File downloads as `Stripe_Product Manager_resume.docx` (not .txt)
   - ✅ File is a proper Word document (can open in Word/Google Docs)
   - ✅ Content includes all merged sections with proper formatting
   - ✅ Headings are bold, bullets are formatted
   - ✅ Master resume in database remains unchanged

### Scenario B: Applications Page → Rebuild & Download

#### Steps:
1. Go to `/dashboard/applications`
2. Find an application with "applimatic complete" status
3. Click on the application to open details page
4. Go to Resume tab
5. Click "Rebuild Your Resume" button
6. Wait for merged resume to generate
7. Click "↓ Download DOCX" button
8. **VERIFY**:
   - ✅ File downloads as `[Company]_[Title]_resume.docx`
   - ✅ File is a proper Word document
   - ✅ Content matches the Applimatic changes

### Scenario C: Multiple Downloads

#### Steps:
1. Tailor the same job description for 3 different companies
2. Download DOCX from each
3. **VERIFY**:
   - ✅ Each file has correct company name in filename
   - ✅ Each file is a valid DOCX
   - ✅ Content is properly formatted
   - ✅ Master resume is still intact

## What to Look For in Downloaded DOCX

### File Validation
- File type: Word Document (.docx)
- Open in: MS Word, Google Docs, LibreOffice
- Should NOT be text/plain

### Content Validation
When you open the downloaded DOCX:
- ✅ Professional summary is tailored
- ✅ Experience bullets are replaced with tailored versions
- ✅ Formatting: headings bold, bullets with •, proper spacing
- ✅ Margins are 1 inch all around
- ✅ Font is clear and professional
- ✅ Ready to send to employer

### Content Should Match
The downloaded DOCX should contain:
1. Your original resume structure
2. With tailored sections merged in
3. Professional summary: AI-rewritten for this job
4. Experience bullets: Updated to match job requirements
5. All other sections: Unchanged from master resume

## Backend Verification

If downloads aren't working, check server logs:

```bash
# Check for generateDocx errors
tail -100 /tmp/dev.log | grep -i "docx\|buffer\|download"

# Test the endpoint directly
curl -X POST http://localhost:3000/api/tailored-resumes/download \
  -H "Content-Type: application/json" \
  -d '{
    "mergedResume": "PROFESSIONAL SUMMARY\n...",
    "companyName": "TestCo",
    "jobTitle": "Engineer"
  }' \
  --output test.docx

# Verify the file
file test.docx  # Should show: "Microsoft Word 2007+"
```

## Known Limitations
- Maximum resume size: Limited by Next.js request body (default 4MB)
- Formatting: Uses basic docx formatting (no fancy styling)
- Fonts: Uses default fonts available in Word
- Images: Not supported (resume text only)

## If It Still Doesn't Work

### Check #1: File Extension
- Open DevTools (F12) → Network tab
- Click Download button
- Find the request to `/api/tailored-resumes/download`
- Check Response Headers:
  - Should have: `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Should have: `Content-Disposition: attachment; filename="...docx"`

### Check #2: Browser Console
- Open DevTools (F12) → Console tab
- Click Download button
- Look for any errors
- Check blob content type

### Check #3: Network Response
- In DevTools → Network → download request
- Check response size (should be thousands of bytes, not just text)
- Preview tab (if available) should show binary data

## Success Indicators
You'll know it's working when:
1. ✅ File downloads with `.docx` extension
2. ✅ File is larger than plain text (binary format)
3. ✅ Opens in Word/Google Docs without errors
4. ✅ Formatting is preserved
5. ✅ Can edit and save in Word
6. ✅ Master resume still exists unchanged
