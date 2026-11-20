import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { LayoutClient } from "@/components/ui/LayoutClient";

export const metadata: Metadata = {
  title: "SkillSpace - Learning Platform",
  description: "Empower your skills with SkillSpace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="skillspace-theme"
        >
          <ToastProvider>
            <Navbar />
            <main className="flex-grow">
              <LayoutClient>{children}</LayoutClient>
            </main>
            <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-8 transition-colors duration-200">
              <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-slate-400 text-sm">
                &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> SkillSpace Learning Platform. All rights reserved.
              </div>
            </footer>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
