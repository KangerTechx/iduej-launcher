import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/theme-provider";
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils'
import Nav from "@/components/Navigation/Nav";
import SideNav from "@/components/Navigation/SideNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iduej",
  description: "Game Launcher",
}

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Matemasie:wght@400;700&display=swap" rel="stylesheet"></link>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet"></link>
      </head>
      <body
        className={cn(
          'max-h-screen font-sans antialiased overflow-hidden',
          fontSans.variable
        )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange>
          <div>
            <main className="mx-2 rounded-lg mt-2">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
