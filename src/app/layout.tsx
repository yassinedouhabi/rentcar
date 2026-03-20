import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import { cookies } from "next/headers";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "arabic"],
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
      className={`${inter.variable} ${rubik.variable} h-full ${themeClass}`}
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
