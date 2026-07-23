import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const h=await headers(); const host=h.get("x-forwarded-host")||h.get("host")||"localhost:3000"; const protocol=h.get("x-forwarded-proto")||"https"; const base=new URL(`${protocol}://${host}`);
  return {title:"Manhattan ACE Violation Explorer",description:"Interactive map of issued New York City Automated Camera Enforcement violations by route, stop, and neighborhood.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},openGraph:{title:"Manhattan ACE Violation Explorer",description:"Explore 765,297 issued Manhattan ACE violations by route, stop, and neighborhood.",images:[new URL("/og.png",base).toString()]},twitter:{card:"summary_large_image",title:"Manhattan ACE Violation Explorer",description:"Routes · Stops · Neighborhoods",images:[new URL("/og.png",base).toString()]}};
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
