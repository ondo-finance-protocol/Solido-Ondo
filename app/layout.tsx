// "use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NavBar from "@/components/navbar";
import { TabsDemo } from "@/components/sidebar";
import { WalletProvider } from "@/context/WalletContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Solido - Unlock liquidity on Supra",
  description: "Solido - Unlock liquidity on Supra",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-T8M8JWG0BJ"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-T8M8JWG0BJ');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <WalletProvider>
          <div className="grid h-screen mainT w-full grid-cols-[max-content_1fr] overflow text-white">
            <TabsDemo />
            <div className="body text-black overflow-y-scroll bg-black">
              <NavBar />
              <div className="h-screen md:w-full w-screen px-8 py-6 bg-black">
                {children}
              </div>
            </div>
          </div>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
