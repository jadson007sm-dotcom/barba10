import './globals.css'
import { ReactNode } from 'react'
export const metadata={title:'BARBA10',description:'SaaS multi-tenant para barbearias'}
export default function RootLayout({children}:{children:ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
