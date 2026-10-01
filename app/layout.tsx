import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "做自己的 Tony · 纯前端演示", description: "个人染发方案交互演示" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="zh-CN"><body><div className="demo-notice" role="note">作品演示 · 识别、方案和生成效果使用示例数据，照片与档案仅存本机浏览器</div>{children}</body></html>;
}
