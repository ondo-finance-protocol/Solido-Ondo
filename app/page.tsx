"use client";
import React from "react";
import { TabsDemo } from "@/components/sidebar";
import NavBar from "@/components/navbar";
import CardDemo from "@/components/cards";
import { WalletProvider } from "@/context/WalletContext";

// interface HomeProps {
//   Component: React.ComponentType;
//   pageProps: any;
// }

export default function Home({ pageProps }: any) {
  return (
    <>
      {/* {afterLoad ? (
        <FullScreenLoader />
      ) : ( */}
      {/* <WalletProvider>
        <div className="grid h-screen font-mono font-extrabold mainT w-full sm:grid-cols-[max-content_1fr] overflow text-white">
          <TabsDemo />
          <div className="body text-black  overflow-y-scroll ">
            <div className="sticky z-50 mainT top-0  overflow-auto">
              <NavBar />
            </div>
            <div className=" w-full " style={{ backgroundColor: "black" }}>
              <CardDemo {...pageProps} />
            </div>
          </div>
        </div>
      </WalletProvider> */}

      <CardDemo {...pageProps} />
    </>
  );
}
