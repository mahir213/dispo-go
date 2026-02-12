import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dispo-Go",
  description: "Sistem za upravljanje vozilima i vatrogasnom opremom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var key = 'dispo-go-theme';
              var stored = localStorage.getItem(key);
              var root = document.documentElement;
              root.classList.remove('light','dark');
              if (stored === 'light' || stored === 'dark') {
                root.classList.add(stored);
              } else {
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.classList.add(prefersDark ? 'dark' : 'light');
              }
            } catch (e) {}
          })();
        `}} />
        <ThemeProvider defaultTheme="system" storageKey="dispo-go-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
