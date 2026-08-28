"use client";
import React from "react";
import UpperSec from "./upperSec";
import Trove from "../../components/trove";

export default function Home({ pageProps }: any) {
  return (
    <>
      <UpperSec />
      <Trove />
    </>
  );
}
