import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SPORTEX - Gestión de Indumentaria Deportiva",
  description: "Sistema de gestión para empresas de indumentaria deportiva. Administra pedidos, clientes y leads de forma eficiente.",
  keywords: ["indumentaria deportiva", "gestión de pedidos", "software para marcas deportivas"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
