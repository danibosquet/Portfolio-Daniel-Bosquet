import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Daniel Bosquet Toves | AI Solutions Engineer',
  description: 'Portfolio de Daniel Bosquet Toves, AI Solutions Engineer | Agent Architect & Full-Stack Developer',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&family=Outfit:wght@500;700;800;900&family=JetBrains+Mono:wght@300;400;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400;1,600&family=Nunito:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0b]">
        <div id="preloader">
          <div className="preloader-content">
            <h1 className="preloader-logo">
              <span className="p-char">D</span>
              <span className="p-char">.</span>
              <span className="p-char">B</span>
              <span className="p-char">.</span>
              <span className="p-char">T</span>
            </h1>
          </div>
        </div>

        <div id="cursor-dot"></div>
        <div id="cursor-ring"></div>

        {children}
      </body>
    </html>
  )
}
