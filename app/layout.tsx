import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

import { Toaster } from "sonner";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ULC Chatbot – Urban Land Ceiling Maharashtra Portal",
  description:
    "Official chatbot portal of the Government of Maharashtra, Urban Development Department – ULC. Citizens can access, query, and upload public documents with ease. Powered by AI for transparent governance.",
  keywords: [
    "ULC chatbot",
    "Urban Land Ceiling",
    "Maharashtra",
    "Government of Maharashtra",
    "Urban Development Department",
    "public documents",
    "AI portal",
    "citizen services",
    "Brihanmumbai",
    "Saurabh Kariyar IAS",
    "Collector ULC",
    "government transparency"
  ],
  openGraph: {
    title: "ULC Chatbot – Urban Land Ceiling Maharashtra Portal",
    description:
      "Official chatbot portal of the Government of Maharashtra, Urban Development Department – ULC. Citizens can access, query, and upload public documents with ease. Powered by AI for transparent governance.",
    url: "https://ulc.maharashtra.gov.in/", // Update to actual URL if available
    siteName: "ULC Chatbot Maharashtra",
    images: [
      {
        url: "/maharashtra-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Maharashtra Government Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  authors: [{ name: "Govt of Maharashtra, Urban Development Department" }],
  creator: "Govt of Maharashtra",
  applicationName: "ULC Chatbot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
