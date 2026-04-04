import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";

const barlowSemiCondensed = Barlow_Semi_Condensed({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-signage",
});

export const metadata: Metadata = {
  title: "Buzão Buddy",
  description: "Rastreamento de ônibus em tempo real — São Paulo",
  icons: {
    icon: "/bus-icon.svg",
    shortcut: "/bus-icon.svg",
    apple: "/bus-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${barlowSemiCondensed.variable} ${barlowCondensed.variable} ${barlowSemiCondensed.className} h-full`}>
      <body className="h-full" style={{ backgroundColor: "#0F1419" }}>
        {children}
      </body>
    </html>
  );
}
