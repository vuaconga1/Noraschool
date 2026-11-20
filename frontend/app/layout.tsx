import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import Providers from "./components/providers";
import ProvidersLayout from "./components/ProvidersLayout";
import AuthHydrator from "./components/auth/authHydrator";
import HomeworkPopup from "./components/homework/HomeworkPopup";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NORA Preschool",
  description: "NORA Preschool — Love Beyond, hơn cả yêu thương",
  // Single app icon via app/icon.png — avoid favicon.ico + /icon.png dual links.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body
        className={`${lexend.className} antialiased bg-[#fff7fc] text-nora-text flex flex-col min-h-screen min-w-[320px] overflow-x-hidden`}
      >
        {/* Google Analytics 4 */}
        <GoogleAnalytics />

        {/* ✅ Wrap toàn app trong SessionProvider */}
        <Providers>
          <AuthHydrator />
          <HomeworkPopup />
          <ProvidersLayout>{children}</ProvidersLayout>
        </Providers>
      </body>
    </html>
  );
}
