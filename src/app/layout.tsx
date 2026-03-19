import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RentCAR",
  description: "Car Rental Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = "Africa/Casablanca";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value ?? "dark";
  const themeClass = themeCookie === "light" ? "light" : "dark";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full ${themeClass}`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased" suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider defaultTheme="dark">
            <LocaleProvider locale={locale} messages={messages} timeZone={timeZone}>
              <TooltipProvider>
                {children}
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </LocaleProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
