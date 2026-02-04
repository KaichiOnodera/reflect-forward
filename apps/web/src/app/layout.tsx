import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reflect Forward - 振り返って前進する",
  description: "日記とAIで自己理解を深める",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
