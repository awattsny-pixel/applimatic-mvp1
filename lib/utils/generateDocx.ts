/**
 * Generates a DOCX file from resume text content
 * Parses resume sections and applies Word formatting
 */

import { Document, Packer, Paragraph, TextRun, convertInchesToTwip } from 'docx'

/**
 * Generate a DOCX file from resume text
 */
export async function generateResumeDocx(
  resumeText: string,
  name: string = 'Resume'
): Promise<Buffer> {
  const lines = resumeText.split('\n')
  const paragraphs: Paragraph[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      // Empty line
      paragraphs.push(new Paragraph({ text: '' }))
      continue
    }

    // Check if it's a section heading (all caps, short line)
    const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 50 && !/^[•\-*]/.test(trimmed)

    // Check if it's a bullet point
    const isBullet = /^[•\-*]\s+/.test(trimmed)

    if (isHeading) {
      // Section heading
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 28, // 14pt
              color: '000000',
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      )
    } else if (isBullet) {
      // Bullet point
      const content = trimmed.replace(/^[•\-*]\s+/, '')
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: content,
              size: 22, // 11pt
            }),
          ],
          bullet: {
            level: 0,
          },
          spacing: { after: 60 },
        })
      )
    } else {
      // Regular text or subheading
      // Check if it looks like a company/role line (shorter, mixed case, possibly with pipe)
      const looksLikeSubheading = line.length < 100 && /[A-Z]/.test(trimmed) && (trimmed.includes('|') || /^\s*[A-Z]/.test(line))

      if (looksLikeSubheading && trimmed.length > 10 && trimmed !== trimmed.toUpperCase()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 24, // 12pt
              }),
            ],
            spacing: { before: 120, after: 60 },
          })
        )
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 80 },
          })
        )
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
