// /lib/utils/humanizeContent.ts
/**
 * Post-processes AI-generated resume/cover letter content to remove
 * common AI writing patterns and make it sound more natural.
 *
 * This helps ensure the tailored output reads naturally without
 * the telltale stylistic markers of AI generation.
 */

interface HumanizeOptions {
  removeEmDashes?: boolean
  fixRepeatedWords?: boolean
  reduceFormalTone?: boolean
  fixWeakVerbs?: boolean
  breakUpLongSentences?: boolean
  removeFillerPhrases?: boolean
}

const DEFAULT_OPTIONS: HumanizeOptions = {
  removeEmDashes: true,
  fixRepeatedWords: true,
  reduceFormalTone: true,
  fixWeakVerbs: true,
  breakUpLongSentences: true,
  removeFillerPhrases: true,
}

/**
 * Remove EM dashes and replace with natural alternatives
 * AI tends to overuse EM dashes (—) for clarification
 */
function removeEmDashes(text: string): string {
  // Replace EM dash with comma or period depending on context
  return text
    // "something—which is important" → "something, which is important"
    .replace(/—\s*which\s+/gi, ', which ')
    // "something—this means" → "something. This means"
    .replace(/—\s*(?=[A-Z])/g, '. ')
    // "something—and" → "something, and"
    .replace(/—\s*and\s+/gi, ', and ')
    // Remaining EM dashes become commas
    .replace(/—/g, ',')
    // Clean up any double commas
    .replace(/,+/g, ',')
}

/**
 * Replace weak AI-favourite verbs with stronger alternatives
 * AI tends to overuse: "provide", "ensure", "enhance", "facilitate"
 */
function fixWeakVerbs(text: string): string {
  const weakVerbMap: Record<string, string[]> = {
    // "provide" → "deliver", "offer", "give", "supply"
    'provide': ['deliver', 'offer', 'give', 'supply'],
    'provided': ['delivered', 'offered', 'gave', 'supplied'],
    'provides': ['delivers', 'offers', 'gives', 'supplies'],

    // "ensure" → "guarantee", "confirm", "maintain", "verify"
    'ensure': ['guarantee', 'confirm', 'maintain', 'verify'],
    'ensures': ['guarantees', 'confirms', 'maintains', 'verifies'],
    'ensured': ['guaranteed', 'confirmed', 'maintained', 'verified'],

    // "enhance" → "improve", "strengthen", "boost", "elevate"
    'enhance': ['improve', 'strengthen', 'boost', 'elevate'],
    'enhanced': ['improved', 'strengthened', 'boosted', 'elevated'],
    'enhances': ['improves', 'strengthens', 'boosts', 'elevates'],

    // "facilitate" → "enable", "allow", "help", "support"
    'facilitate': ['enable', 'allow', 'help', 'support'],
    'facilitated': ['enabled', 'allowed', 'helped', 'supported'],
    'facilitates': ['enables', 'allows', 'helps', 'supports'],

    // "demonstrate" → "show", "prove", "display", "exhibit"
    'demonstrate': ['show', 'prove', 'display', 'exhibit'],
    'demonstrated': ['showed', 'proved', 'displayed', 'exhibited'],
    'demonstrates': ['shows', 'proves', 'displays', 'exhibits'],

    // "utilize" → "use"
    'utilize': ['use'],
    'utilized': ['used'],
    'utilizes': ['uses'],
  }

  let result = text
  Object.entries(weakVerbMap).forEach(([weakVerb, alternatives]) => {
    const regex = new RegExp(`\\b${weakVerb}\\b`, 'gi')
    result = result.replace(regex, () => {
      // Randomly pick one of the alternatives for variety
      return alternatives[Math.floor(Math.random() * alternatives.length)]
    })
  })

  return result
}

/**
 * Remove common AI filler phrases
 * AI tends to use: "It is important to note that", "Furthermore", "In addition"
 */
function removeFillerPhrases(text: string): string {
  const fillerPhrases = [
    /It is important to note that\s+/gi,
    /It is worth noting that\s+/gi,
    /It should be noted that\s+/gi,
    /It is also worth mentioning that\s+/gi,
    /Additionally,\s+/gi,
    /Furthermore,\s+/gi,
    /Moreover,\s+/gi,
    /In addition,\s+/gi,
    /In conclusion,\s+/gi,
    /To summarize,\s+/gi,
    /As mentioned above,\s+/gi,
    /As previously stated,\s+/gi,
    /With regard to\s+/gi,
    /With respect to\s+/gi,
    /In the context of\s+/gi,
  ]

  let result = text
  fillerPhrases.forEach(phrase => {
    result = result.replace(phrase, '')
  })

  return result
}

/**
 * Reduce overly formal tone
 * Replace formal phrases with natural alternatives
 */
function reduceFormalTone(text: string): string {
  const formalMap: Record<string, string> = {
    'demonstrated proficiency': 'proved skills in',
    'proven expertise': 'strong skills in',
    'leveraged my knowledge': 'used my knowledge of',
    'leveraged': 'used',
    'collaborated with': 'worked with',
    'endeavor': 'try',
    'endeavors': 'efforts',
    'utilize': 'use',
    'utilization': 'use',
    'in order to': 'to',
    'due to the fact that': 'because',
    'prior to': 'before',
    'subsequent to': 'after',
    'as a result of': 'because of',
    'at the present time': 'now',
    'in the near future': 'soon',
  }

  let result = text
  Object.entries(formalMap).forEach(([formal, natural]) => {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi')
    result = result.replace(regex, natural)
  })

  return result
}

/**
 * Fix repeated words/phrases that commonly appear in AI text
 * AI sometimes repeats the same word or concept multiple times
 */
function fixRepeatedWords(text: string): string {
  // Remove consecutive repeated words
  return text
    // "very very" → "very"
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    // "strong, strong" → "strong,"
    .replace(/\b(\w+),\s+\1\b/gi, '$1,')
    // Multiple spaces → single space
    .replace(/\s{2,}/g, ' ')
}

/**
 * Break up very long sentences (AI tends to create 40+ word sentences)
 * Target sentences that are unreasonably long
 */
function breakUpLongSentences(text: string): string {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []

  return sentences
    .map(sentence => {
      const words = sentence.trim().split(/\s+/)

      // If sentence is too long (40+ words), try to break it up
      if (words.length > 40) {
        // Look for semicolons or coordinating conjunctions to split
        return sentence
          // Use semicolons as natural break points
          .replace(/;\s*/g, '. ')
          // Break on common transition words
          .replace(/,\s*(which|that|while|and|but|however|therefore)\s+/gi,
                   '. \\1 ')
      }

      return sentence
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Main function: Humanize AI-generated content
 */
export function humanizeContent(
  text: string,
  options: HumanizeOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  let result = text

  // Apply transformations in order of impact
  if (opts.removeEmDashes) {
    result = removeEmDashes(result)
  }

  if (opts.removeFillerPhrases) {
    result = removeFillerPhrases(result)
  }

  if (opts.reduceFormalTone) {
    result = reduceFormalTone(result)
  }

  if (opts.fixWeakVerbs) {
    result = fixWeakVerbs(result)
  }

  if (opts.fixRepeatedWords) {
    result = fixRepeatedWords(result)
  }

  if (opts.breakUpLongSentences) {
    result = breakUpLongSentences(result)
  }

  // Final cleanup
  return result
    // Ensure proper spacing after punctuation
    .replace(/([.!?,;:])([A-Z])/g, '$1 $2')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Proper spacing around quotes
    .replace(/\s+"/g, ' "')
    .replace(/"\s+/g, '" ')
    .trim()
}

/**
 * Humanize only the resume content (not headers/structure)
 * This preserves formatting while improving text quality
 */
export function humanizeResume(resumeContent: string): string {
  // Split by lines to preserve structure
  const lines = resumeContent.split('\n')

  return lines
    .map(line => {
      // Don't process pure headers (all caps, no spaces, or very short)
      if (line.match(/^[A-Z\s]+$/) || line.length < 5) {
        return line
      }

      // Process description lines
      return humanizeContent(line, {
        removeEmDashes: true,
        fixRepeatedWords: true,
        reduceFormalTone: true,
        fixWeakVerbs: true,
      })
    })
    .join('\n')
}

/**
 * Humanize cover letter (process entire document, not just snippets)
 */
export function humanizeCoverLetter(letterContent: string): string {
  return humanizeContent(letterContent, {
    removeEmDashes: true,
    fixRepeatedWords: true,
    reduceFormalTone: true,
    fixWeakVerbs: true,
    breakUpLongSentences: true,
  })
}
