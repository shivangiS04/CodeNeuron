import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeNeuron — Collaborative Code Review",
  description:
    "Real-time collaborative code review with AI-powered analysis, live cursors, and line comments.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
