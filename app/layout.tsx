import "./globals.scss";
import type { Metadata } from "next";
import Providers from "./providers";


export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Test task admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
