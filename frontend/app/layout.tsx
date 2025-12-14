import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
