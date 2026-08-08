import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AlertProvider } from "@/components/providers/AlertProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lab Teknik Industri UAI",
  description: "Website Lab Teknik Industri Universitas Al-Azhar Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative isolate min-h-screen antialiased`}
        suppressHydrationWarning
      >
        <div className="site-background" aria-hidden="true" />
        <div className="relative z-10 min-h-screen">
          <AlertProvider>
            {children}
          </AlertProvider>
        </div>
      </body>
    </html>
  );
}
