/**
 * Merges Claude's tailored sections back into the original resume
 * Replaces experience sections with tailored versions where available
 */

interface TailoredSection {
  section_type: 'experience' | 'summary'
  company?: string
  role?: string
  tailored_bullets?: string[]
  tailored?: string
  original?: string
}

export function mergeTailoredResume(
  originalResume: string,
  tailoredSections: TailoredSection[] | undefined,
  tailoredSummary: string | undefined
): string {
  if (!tailoredSections || tailoredSections.length === 0) {
    return originalResume
  }

  let mergedResume = originalResume

  // Handle summary section if provided
  if (tailoredSummary) {
    const summaryMatch = originalResume.match(
      /(?:PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|PROFILE)[^\n]*\n([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z]|$)/i
    )
    if (summaryMatch) {
      mergedResume = mergedResume.replace(summaryMatch[1], tailoredSummary)
    }
  }

  // Handle experience sections
  for (const section of tailoredSections) {
    if (section.section_type === 'experience' && section.company && section.tailored_bullets) {
      // Find the company section in the resume
      const companyRegex = new RegExp(
        `${section.company}[^]*?${section.role || ''}[^]*?(?=\n\n[A-Z]|\n[A-Z]|$)`,
        'i'
      )

      const match = mergedResume.match(companyRegex)
      if (match) {
        // Replace the bullets in this section
        const originalText = match[0]
        let updatedText = originalText

        // Replace bullet points with tailored ones
        const bulletRegex = /^[\s]*[•\-*]\s+.+$/gm
        const originalBullets = originalText.match(bulletRegex) || []

        // Replace bullets one by one
        for (let i = 0; i < Math.min(originalBullets.length, section.tailored_bullets.length); i++) {
          updatedText = updatedText.replace(
            originalBullets[i],
            `• ${section.tailored_bullets[i]}`
          )
        }

        // If there are more tailored bullets than original, append them
        if (section.tailored_bullets.length > originalBullets.length) {
          const extraBullets = section.tailored_bullets
            .slice(originalBullets.length)
            .map(bullet => `• ${bullet}`)
            .join('\n')
          updatedText = updatedText + '\n' + extraBullets
        }

        mergedResume = mergedResume.replace(originalText, updatedText)
      }
    }
  }

  return mergedResume
}

/**
 * Converts markdown-style resume to a simple formatted string
 * Useful for preparing for DOCX export
 */
export function formatResumeForExport(resumeText: string): string {
  // Basic cleanup and formatting
  let formatted = resumeText
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers

  return formatted
}
