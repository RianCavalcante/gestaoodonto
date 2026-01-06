import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "GestãoOdonto - Sistema de Gestão para Clínicas Odontológicas",
    description: "Sistema completo de gestão com central omnichannel, funil de vendas e dashboards analíticos para clínicas odontológicas",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={cn(inter.variable, "font-sans antialiased min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50")}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
