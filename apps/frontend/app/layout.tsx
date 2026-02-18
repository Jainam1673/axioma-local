import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axioma | Profit Discipline",
  description: "Agency profit discipline and withdrawal intelligence dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
