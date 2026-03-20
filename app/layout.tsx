import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Applimatic — Your experience, told perfectly',
  description: 'AI-powered job application personalizer. Tailored resumes and cover letters in 60 seconds.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
