"use client";
import React from "react";
import { useEffect, useState } from "react";
import { TabsDemo } from "@/components/sidebar";
import NavBar from "@/components/navbar";
import Image from "next/image";
import ORE from "@/app/assets/images/Group 1043.svg";
import "../App.css";
import Stats from "./index";
import { WalletProvider } from "@/context/WalletContext";
import SolidoDashboard from "./index";

export default function Home({ pageProps }: any) {
  return (
    <div style={{ backgroundColor: "black", paddingBottom: "4vh" }}>
      <SolidoDashboard />
    </div>
  );
}
