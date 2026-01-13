import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Docufieds - Visa Document Processing Portal',
  description: 'Comprehensive visa document processing service portal for individuals and travel agencies',
  keywords: 'visa, documents, processing, travel, agency, individual',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

