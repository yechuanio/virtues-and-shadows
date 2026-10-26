import type { Metadata } from "next";
import "./mirrors.css";

export const metadata: Metadata = {
  title: "十四面镜人格 · 让心像有形",
  description: "210 道日常情境，三种探索长度，15 种心像与五大家族。由野川 yechuan 制作的自我观察与同好相遇空间。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
