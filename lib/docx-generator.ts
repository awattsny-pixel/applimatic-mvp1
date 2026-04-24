// DOCX Generation Helper
// This will be used on the client-side to generate Word documents for download

export interface TailoredResumeData {
  companyName: string
  jobTitle: string
  tailoredSections: Array<{
    section_type: 'summary' | 'experience'
    original?: string
    tailored?: string
    company?: string
    role?: string
    dates?: string
    tailored_bullets?: string[]
    change_reason?: string
  }>
  atsScore: number
}

/**
 * Generate a downloadable DOCX file from tailored resume data
 * Uses the docx-js library (must be installed: npm install docx)
 *
 * Note: This function is designed to be called from a server endpoint
 * Example usage:
 *
 * const { Packer, Document, Paragraph, TextRun, Table, ... } = require('docx');
 * const buffer = await generateResumeDocx(tailoredData);
 * response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 * response.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
 * response.send(buffer);
 */

export function generateResumeDocxInstructions(): string {
  return `
# DOCX Generation Guide

To implement DOCX download functionality:

1. Install the docx library:
   npm install docx

2. Create a server endpoint that:
   - Receives the tailored resume data
   - Uses the docx library to generate a Document
   - Returns it as a binary DOCX file

3. Example implementation in /app/api/tailored-resumes/[id]/generate-docx/route.ts:

\`\`\`typescript
import { Document, Packer, Paragraph, TextRun, ... } from 'docx';

export async function POST(request: Request) {
  const { tailoredData } = await request.json();

  const doc = new Document({
    sections: [{
      children: generateDocxContent(tailoredData)
    }]
  });

  const buffer = await Packer.toBuffer(doc);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': \`attachment; filename="\${tailoredData.companyName}_Resume.docx"\`
    }
  });
}
\`\`\`

## For Now: Alternative Solutions

1. **Text/Markdown Export**
   - Return tailored resume as text/markdown
   - User copies into Word/Google Docs

2. **HTML to PDF**
   - Generate styled HTML
   - User can print to PDF or save as Word

3. **Native Download**
   - Provide structured JSON
   - User imports into their preferred tool

## Structured Export Format

Until DOCX generation is implemented, provide:
- Professional Summary (tailored)
- Experience Section (tailored bullets)
- ATS Score and explanation
- Key matches and gaps
- Easy copy-paste format
  `;
}

export const ResumeDocxTemplate = {
  description: 'Template for DOCX generation when library is installed',
  example: {
    companyName: 'Stripe',
    jobTitle: 'Senior Product Manager',
    summary: 'Experienced product manager with 5+ years...',
    sections: [
      {
        type: 'experience',
        company: 'Previous Company',
        role: 'Product Manager',
        dates: '2020 - 2023',
        bullets: [
          'Led team of 5 engineers to build new payment features',
          'Increased conversion by 25% through A/B testing',
        ],
      },
    ],
    atsScore: 85,
  },
};
