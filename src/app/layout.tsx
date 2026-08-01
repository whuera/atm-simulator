import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ATM Simulator Platform',
  description: 'Plataforma de simulación de cajeros automáticos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
