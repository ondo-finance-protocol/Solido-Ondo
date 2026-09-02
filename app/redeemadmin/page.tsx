"use client";
import React, { useState, useEffect } from "react";
import RedeemPositions from "./index";
import "../App.css";
import alert from "../assets/images/alert.svg";
import Image from "next/image";

export default function RedeemPage() {
  const [activeCollateral, setActiveCollateral] = useState<"SUPRA" | "stSUPRA">("SUPRA");

  // Listen for collateral type changes from the child component
  useEffect(() => {
    const handleCollateralChange = (event: CustomEvent) => {
      setActiveCollateral(event.detail);
    };

    window.addEventListener('collateralTypeChanged' as any, handleCollateralChange);
    
    return () => {
      window.removeEventListener('collateralTypeChanged' as any, handleCollateralChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header Section */}
      <div className="text-center pt-12 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-poppins mb-6">
            Exchange 1 $CASH for $1 of ${activeCollateral}
          </h1>
          
          {/* Alert Banner */}
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <Image 
              src={alert} 
              alt="alert" 
              width={20} 
              height={20}
              className="flex-shrink-0"
            />
            <span className="text-red-400 font-medium text-sm md:text-base font-poppins">
              Redemptions have been stopped due to excessive unnecessary usage.
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Redeem Positions Component */}
          <div className="flex-1">
            <RedeemPositions onCollateralChange={setActiveCollateral} />
          </div>
        </div>
      </div>
    </div>
  );
}