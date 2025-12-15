import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Todo App - Better Auth",
  description: "Multi-user todo application with Better Auth authentication",
};

/**
 * Root Layout with Better Auth integration
 * Better Auth handles session management automatically - no provider needed
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
