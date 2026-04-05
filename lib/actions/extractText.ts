'use server'

import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export async function extractTextFromFile(arrayBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
      const buffer = Buffer.from(new Uint8Array(arrayBuffer))
      const data = await pdfParse(buffer)
      return data.text
    } catch (error) {
      console.error('PDF extraction error:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      console.error('Word extraction error:', error)
      throw new Error('Failed to extract text from Word document')
    }
  }

  throw new Error('Unsupported file type')
}
