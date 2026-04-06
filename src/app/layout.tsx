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
    "Réservez votre appel découverte de 30 minutes avec Enzo Remidene. Coaching personnalisé pour sortir du burnout et retrouver votre équilibre.",
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
