import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import Auth from "@/components/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lingo VerseVibe",
  description: "Speak with AI to learn a new language",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col`}
      >
        <AuthSessionProvider>
          <header className="sticky top-0 z-50 backdrop-blur-md bg-header/80 border-b border-header/20 shadow-sm">
            <div className="container mx-auto px-6 py-4 relative z-10">
              <nav className="flex justify-between items-center">
                <Link href="/" className="group cursor-pointer">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-red-600 to-primary bg-clip-text text-transparent hover:from-red-700 hover:via-primary hover:to-red-700 transition-all duration-500 transform hover:scale-105">
                    Lingo VerseVibe
                  </h1>
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></div>
                </Link>
                <div className="flex gap-3">
                  <Auth />
                </div>
              </nav>
            </div>
          </header>
          <main className="flex-grow flex flex-col">{children}</main>
          <footer className="bg-gradient-to-r from-header via-header/95 to-header py-8 mt-16 border-t border-header/20">
            <div className="container mx-auto px-6 text-center">
              <p className="text-muted-foreground">
                &copy; 2025 Lingo VerseVibe. Built with Next.js and Tailwind
                CSS.
              </p>
            </div>
          </footer>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
