"use client";
import React from "react";
import { TabsDemo } from "@/components/sidebar";
import NavBar from "@/components/navbar";
import Borrow from "./index";
import { Metadata } from "next";
import { WalletProvider } from "@/context/WalletContext";

export default function Home({ pageProps }: any) {
  return (
    <>
      <Borrow />
    </>
  );
}
