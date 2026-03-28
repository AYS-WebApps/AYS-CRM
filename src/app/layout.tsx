import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AYS CRM',
  description: 'Client & Lead Management for AYS Tent & Event Rentals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
