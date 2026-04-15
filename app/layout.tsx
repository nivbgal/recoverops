import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoverOps",
  description: "AI finance agent for finding and recovering vendor billing leaks."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
