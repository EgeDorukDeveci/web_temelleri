import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modern Web Atölyesi",
  description: "Türkçe, interaktif modern frontend öğrenme platformu"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
