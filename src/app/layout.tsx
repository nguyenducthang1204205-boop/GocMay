import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/config/site";
import { getSettings } from "@/lib/content";

// Bộ font — cả ba đều có đủ dấu tiếng Việt. Tên biến khớp với @theme trong globals.css.
const body = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  display: "swap",
});

const label = JetBrains_Mono({
  variable: "--font-label",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description =
    "Xem portfolio, phong cách và giá của từng photographer trước khi đặt lịch chụp kỷ yếu, chụp nhóm, chụp cá nhân.";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.name} — ${s.tagline}`, template: `%s · ${s.name}` },
    description,
    openGraph: { type: "website", locale: "vi_VN", siteName: s.name, title: `${s.name} — ${s.tagline}`, description },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#f5f2ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${display.variable} ${label.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
