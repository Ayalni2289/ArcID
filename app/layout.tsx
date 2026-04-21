import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "ArcID — Arc Name Service",
  description: "Register human-readable .arc .agent .usdc names on Arc Network. Powered by USDC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans text-[var(--ink-strong)]">
        <Providers>{children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
