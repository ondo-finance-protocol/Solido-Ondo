"use client";

import { useRef } from "react";
import { Toast } from "primereact/toast";
import { useWallet } from "@/context/WalletContext";
import useFetchMetrics from "@/hooks/use-fetch-metrics";
import { formatLargeNumber } from "./getActualDecimal";

// Import assets
import ORE from "@/app/assets/images/CASH2.png";
import stSUPRA_logo from "@/app/assets/images/flow/stSupra.png";
import tvl_logo from "@/app/assets/images/tvl.png";
import tcr_logo from "@/app/assets/images/TCR_new.svg";
import btc from "@/app/assets/images/flow/stSupra.png";

// Import components
import { StatCard } from "./navbar/stat-card";
import MobileNav from "./MobileNav";
import ConnectButton from "./Connectxion";
import TooltipContent from "./TooltipContent";

export default function NavBar() {
  const toast = useRef<Toast>(null);
  const { account } = useWallet();
  const { tvl, totalSupply, systemCollRatio, isLoading, stSUPRASupply } =
    useFetchMetrics();

  return (
    <>
      {/* Mobile Header */}
      <div className="flex justify-between md:h-fit h-[5rem] items-center gap-x-4 bg-[black]">
        <div className="md:hidden flex items-center ml-[10px] gap-x-4">
          <MobileNav />
        </div>
        <div className="md:hidden">
          {/* <StatCard
            icon={tcr_logo}
            label="Health (TCR)"
            value={`${(systemCollRatio * 100).toFixed(2)}%`}
            isLoading={isLoading}
            tooltipContent={<TooltipContent />}
          /> */}
        </div>
        <div className="md:hidden m-2">
          <ConnectButton />
        </div>
      </div>

      <Toast ref={toast} className="custom-toast" />

      {/* Desktop Header */}
      <div className="md:flex border-2 hidden w-full border-gray-100 border-opacity-10 items-center justify-between gap-x-4 border-l z-50 bg-[black]">
        <div className="flex items-center gap-x-4">
          <div className="w-full ml-[1rem] gap-x-10 hidden md:flex">
            <StatCard
              icon={tvl_logo}
              label="TVL"
              // value2={totalSupply?.supraCollateral}
              value={tvl}
              suffix="$"
              prefix="SUPRA"
              isLoading={isLoading}
            />

            <StatCard
              icon={ORE}
              label="CASH Supply"
              value={totalSupply?.total}
              isLoading={isLoading}
            />

            <StatCard
              icon={stSUPRA_logo}
              label="stSUPRA Supply"
              value={stSUPRASupply}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </>
  );
}
