import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tax Flow Worksheet — Arqon Tax",
  description: "See exactly where your money is going and where you might be leaving money on the table. Free federal tax estimate in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
