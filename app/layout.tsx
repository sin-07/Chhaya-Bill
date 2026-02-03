import './globals.css'
import { Toaster } from 'react-hot-toast'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Chhaya Printing Solution - Invoice Management',
  description: 'Professional invoice and billing management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="pt-16">
          {children}
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
