import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "Enzo Remidene - Coaching",
  description:
    "Reservez votre appel decouverte de 30 minutes avec Enzo Remidene. Coaching personnalise pour sortir du burnout et retrouver votre equilibre.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-bg text-text min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
