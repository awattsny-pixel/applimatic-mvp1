import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  
  if (file.type === 'application/pdf') {
    try {
      const data = await pdfParse(Buffer.from(buffer))
      return data.text
    } catch (error) {
      console.error('PDF extraction error:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }
  
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      return result.value
    } catch (error) {
      console.error('Word extraction error:', error)
      throw new Error('Failed to extract text from Word document')
    }
  }
  
  throw new Error('Unsupported file type')
}
