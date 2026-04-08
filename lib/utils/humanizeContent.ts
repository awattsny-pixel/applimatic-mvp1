// /lib/utils/humanizeContent.ts
/**
 * Post-processes AI-generated resume/cover letter content to remove
 * common AI writing patterns and make it sound more natural.
   */

interface HumanizeOptions {
    removeEmDashes?: boolean
  fixRepeatedWords?: boolean
  reduceFormalTone?: boolean
  fixWeakVerbs?: boolean
  breakUpLongSentences?: boolean
}

const DEFAULT_OPTIONS: HumanizeOptions = {
  removeEmDashes: true,
  fixRepeatedWords: true,
  reduceFormalTone: true,
  fixWeakVerbs: true,
  breakUpLongSentences: true,
}

function removeEmDashes(text: string): string {
  return text
        .replace(/—\s*which\s+/gi, ', which ')
    .replace(/—\s*(?=[A-Z])/g, '. ')
    .replace(/—\s*and\s+/gi, ', and ')
    .replace(/—/g, ',')
    .replace(/,+/g, ',')
}

function fixWeakVerbs(text: string): string {
    const weakVerbMap: Record<string, string[]> = {
    'provide': ['deliver', 'offer', 'give', 'supply'],
    'provided': ['delivered', 'offered', 'gave', 'supplied'],
    'provides': ['delivers', 'offers', 'gives', 'supplies'],
    'ensure': ['guarantee', 'confirm', 'maintain', 'verify'],
    'ensures': ['guarantees', 'confirms', 'maintains', 'verifies'],
    'ensured': ['guaranteed', 'confirmed', 'maintained', 'verified'],
    'enhance': ['improve', 'strengthen', 'boost', 'elevate'],
    'enhanced': ['improved', 'strengthened', 'boosted', 'elevated'],
    'enhances': ['improves', 'strengthens', 'boosts', 'elevates'],
    'facilitate': ['enable', 'allow', 'help', 'support'],
    'facilitated': ['enabled', 'allowed', 'helped', 'supported'],
    'facilitates': ['enables', 'allows', 'helps', 'supports'],
    'demonstrate': ['show', 'prove', 'display', 'exhibit'],
    'demonstrated': ['showed', 'proved', 'displayed', 'exhibited'],
    'demonstrates': ['shows', 'proves', 'displays', 'exhibits'],
    'utilize': ['use'],
    'utilized': ['used'],
    'utilizes': ['uses'],
}

  let result = text
  Object.entries(weakVerbMap).forEach(([weakVerb, alternatives]) => {
      const regex = new RegExp(`\\b${weakVerb}\\b`, 'gi')
      result = result.replace(regex, () => {
        return alternatives[Math.floor(Math.random() * alternatives.length)]
  })
  })

    return result
  }

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

function fixRepeatedWords(text: string): string {
    return text
      .replace(/\b(\w+)\s+\1\b/gi, '$1')
      .replace(/\b(\w+),\s+\1\b/gi, '$1,')
      .replace(/\s{2,}/g, ' ')
  }

function breakUpLongSentences(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || []

    return sentences
      .map(sentence => {
            const words = sentence.trim().split(/\s+/)

            if (words.length > 40) {
        return sentence
                    .replace(/;\s*/g, '. ')
          .replace(/,\s*(which|that|while|and|but|however|therefore)\s+/gi,
                             '. \1 ')
          }

      return sentence
        })
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
  }

  export function humanizeContent(
  text: string,
  options: HumanizeOptions = {}
): string {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    let result = text

  if (opts.removeEmDashes) {
    result = removeEmDashes(result)
      }

  if (opts.removeFiller) {
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

  return result
        .replace(/([.!?,;:])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/\s+"/g, ' "')
        .replace(/"\s+/g, '" ')
        .trim()
    }

export function humanizeResume(resumeContent: string): string {
    const lines = resumeContent.split('\n')

    return lines
      .map(line => {
        if (line.match(/^[A-Z\s]+$/) || line.length < 5) {
        return line
          }

      return humanizeContent(line, {
                removeEmDashes: true,
                fixRepeatedWords: true,
                reduceFormalTone: true,
                fixWeakVerbs: true,
        })
        })
    .join('\n')
        }

export function humanizeCoverLetter(letterContent: string): string {
    return humanizeContent(letterContent, {
      removeEmDashes: true,
      fixRepeatedWords: true,
      reduceFormalTone: true,
      fixWeakVerbs: true,
      breakUpLongSentences: true,
  })
  }
