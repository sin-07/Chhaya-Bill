import './globals.css'
import { Toaster } from 'react-hot-toast'
import type { Metadata, Viewport } from 'next'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'

const SITE_URL = 'https://www.chhayaprintingsolution.in';
const SITE_NAME = 'Chhaya Printing Solution';
const SITE_DESCRIPTION =
  'Chhaya Printing Solution in Patna, Bihar – premium offset & digital printing, business cards, brochures, banners, large-format printing, custom branding materials. 10+ years of trusted quality.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Chhaya Printing Solution – Premium Printing Services in Patna, Bihar',
    template: '%s | Chhaya Printing Solution',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'printing services Patna',
    'offset printing Bihar',
    'digital printing Patna',
    'business cards printing',
    'brochure printing',
    'banner printing Patna',
    'large format printing',
    'custom branding materials',
    'Chhaya Printing Solution',
    'printing company Bihar India',
    'wedding cards printing Patna',
    'signage solutions Bihar',
    'stickers labels printing',
    'packaging materials Patna',
  ],
  authors: [{ name: 'Chhaya Printing Solution' }],
  creator: 'Chhaya Printing Solution',
  publisher: 'Chhaya Printing Solution',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: '/logoC.jpeg',
    apple: '/logoC.jpeg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Chhaya Printing Solution – Premium Printing Services in Patna',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/logoC.jpeg',
        width: 800,
        height: 600,
        alt: 'Chhaya Printing Solution Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chhaya Printing Solution – Premium Printing Services in Patna',
    description: SITE_DESCRIPTION,
    images: ['/logoC.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-google-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/logoC.jpeg" as="image" type="image/jpeg" />
        <link rel="canonical" href={SITE_URL} />
      </head>
      <body>
        <JsonLd />
        <Navbar />
        <div className="pt-16">
          {children}
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
