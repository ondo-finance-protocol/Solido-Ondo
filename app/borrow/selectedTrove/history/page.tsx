"use client";
import React from "react";
/* eslint-disable */
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import img3 from "../../../assets/images/SUPRA.png";
import info from "../../../assets/images/info.svg";
import "../../../../app/App.css";

import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import RedemptionTable from "@/components/RedemptionTable";
import { Skeleton } from "@/components/ui/skeleton";
import trove2 from "../../../assets/trove3.png";
import { Tooltip } from "primereact/tooltip";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useWallet } from "@/context/WalletContext";

// Define types for your API response
interface HistoryEvent {
  timestamp: string;
  blockNumber: number;
  txHash: string;
  txType: string;
  collChange: number;
  debtChange: number;
  price?: number;
  liquidationDetails?: {
    liquidator: string;
    collateralLiquidated: number;
    debtLiquidated: number;
    liquidatorReward: number;
    protocolFee: number;
    userRefund: number;

    collateralClaimed: number;
  };
}

interface PositionData {
  positionID: number;
  walletAddress: string;
  collAddress: string;
  status: string;
  NICR: number;
  coll: number;
  debt: number;
  history: HistoryEvent[];
}

interface MetricData {
  token: string;
  decimals: number;
  price: number;
  MCR: number;
  minDebt: number;
  liquidationReserve: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  liquidationFeeProtocol: number;
  borrowRate: number;
  totalColl: number;
  totalDebt: number;
  maxMint: number;
  redemptionFee: number;
  redemptionGratuity: number;
  _id: string;
  pauseFunctionResponses: {
    open_trove: boolean;
    borrow: boolean;
    deposit: boolean;
    redeem: boolean;
  };
}

interface MetricsResponse {
  status: string;
  success: boolean;
  metrics: MetricData[];
}

interface ApiResponse {
  status: string;
  success: boolean;
  data: PositionData[];
}

export default function HistoryPage(): JSX.Element {
  const router = useRouter();
  const [troveStatus, setTroveStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { account } = useWallet();
  
  const collMap: Record<string, string> = {
    SUPRA: "0x1",
    stSUPRA:
      "0x81846514536430ea934c7270f86cf5b067e2a2faef0e91379b4f284e91c7f53c",
  };

  // Pick token from URL, default to SUPRA
  const searchToken = searchParams.get("token") || "SUPRA";
  const collAddress = collMap[searchToken];

  // State for position history data
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [totalCollateralClaimed, setTotalCollateralClaimed] =
    useState<number>(0);
  const [totalDebtLiquidated, setTotalDebtLiquidated] = useState<number>(0);
  const [liquidationTimestamp, setLiquidationTimestamp] = useState<Date | null>(
    null
  );
  const [liquidationPenaltyAmount, setLiquidationPenaltyAmount] =
    useState<number>(0);
  const [collateralClaimed, setCollateralClaimed] = useState<number>(0);
  const [liquidationPenaltyRate, setLiquidationPenaltyRate] =
    useState<number>(10);
  const [liquidationPrice, setLiquidationPrice] = useState<number | null>(null);
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  // New state for collateral liquidated
  const [collateralLiquidated, setCollateralLiquidated] = useState<number>(0);

  // Fetch protocol metrics data
  const fetchProtocolMetrics = async (): Promise<void> => {
    try {
      const response = await axios.get<MetricsResponse>(
        "https://api.solido.money/protocol/metrics"
      );

      if (response.data.success) {
        setMetricsData(response.data.metrics);

        // Find SUPRA-specific metrics
        const tokenMetrics = response.data.metrics.find(
          (metric) => metric.token === searchToken
        );

        if (tokenMetrics) {
          setLiquidationPenaltyRate(tokenMetrics.liquidationPenalty);
        }
      }
    } catch (err) {
      console.error("Error fetching protocol metrics:", err);
    }
  };

  // Fetch position history data
  useEffect(() => {
    const fetchPositionHistory = async (): Promise<void> => {
      if (!account) return;

      setIsLoading(true);
      try {
        // First fetch protocol metrics to get liquidation penalty rate
        await fetchProtocolMetrics();

        const walletAddress = account;
        //const collAddress = searchParams.get("collAddress") || "0x1";

        const response = await axios.get<ApiResponse>(
          `https://api.solido.money/positions/history?walletAddress=${walletAddress}&&collAddress=${collAddress}`
        );


        if (response.data.success) {
          const positionData = response.data.data[0];
          setPositionData(positionData);
          setTroveStatus(positionData.status.toUpperCase());

          // Process history data
          const historyData = positionData.history;

          // Find liquidation event
          const liquidationEvent = historyData.find(
            (event) => event.txType === "liquidate"
          );

          if (liquidationEvent) {
            // Set initial values from liquidation event
            setTotalCollateralClaimed(Math.abs(liquidationEvent.collChange));
            setLiquidationTimestamp(new Date(liquidationEvent.timestamp));
            setTotalDebtLiquidated(Math.abs(liquidationEvent.debtChange));
            setCollateralClaimed(
              liquidationEvent.liquidationDetails?.userRefund ?? 0
            );
            setLiquidationPrice(liquidationEvent?.price ?? null);

            // NEW CALCULATION LOGIC
            if (liquidationEvent.liquidationDetails && liquidationEvent.price) {
              const userRefund = liquidationEvent.liquidationDetails.userRefund;
              const collChange = Math.abs(liquidationEvent.collChange);
              const debtLiquidated = Math.abs(liquidationEvent.debtChange);
              const liquidatorReward = liquidationEvent.liquidationDetails.liquidatorReward;
              const liquidationPriceValue = liquidationEvent.price;

              // 1] Collateral Liquidated = Collateral Change - Collateral Claimed (userRefund)
              const calculatedCollateralLiquidated = collChange - userRefund;
              setCollateralLiquidated(calculatedCollateralLiquidated);

              // 2] Liquidation Penalty = liquidatorReward - (Liquidated Debt / Liquidation Price)
              const debtInCollateralTerms = debtLiquidated / liquidationPriceValue;
              const calculatedPenalty = liquidatorReward - debtInCollateralTerms;
              setLiquidationPenaltyAmount(calculatedPenalty);

              // Calculate penalty rate as percentage of collateral liquidated
              const penaltyRate = (calculatedPenalty / calculatedCollateralLiquidated) * 100;
              setLiquidationPenaltyRate(penaltyRate);
            }
          }
        } else {
          setError("Failed to fetch position history");
        }
      } catch (err) {
        console.error("Error fetching position history:", err);
        setError("Error fetching position history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositionHistory();
  }, [account, searchParams]);

  const formatDate = (date: Date | null): string => {
    if (!date) return "--";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* UPPER BOX */}
      <div className="w-full -ml-2 md:h-[120px] text-white flex flex-row justify-between p-4 items-center bg-[linear-gradient(90deg,_#222222_82.14%,_#1DBDAF_126.48%)]">
        <div className="font-medium text-left flex flex-col gap-2 flex-start">
          <div className="text-lg md:text-xl lg:text-2xl">
            {troveStatus === "LIQUIDATED"
              ? "Your trove has been liquidated"
              : "Your trove has been redeemed"}
          </div>{" "}
          <Link
            href={"/borrow/supra"}
            className="w-40 bg-[#1DBDAF] text-black hover:bg-[#2b4e51] px-4 py-2 text-sm font-semibold transition-colors"
          >
            OPEN NEW TROVE
          </Link>
        </div>

        <div>
          <Image src={trove2} alt="trove2" width={160} />
        </div>
      </div>

      {/* Liquidation section */}
      {isLoading ? (
        <div className="w-[100%] -ml-2 md:h-fit md:w-[97%] md:ml-4 p-10 flex flex-col justify-between mt-4 border border-gray-400">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-6 w-2/3 mb-3" />
          <Skeleton className="h-6 w-1/2 mb-3" />
        </div>
      ) : troveStatus === "LIQUIDATED" ? (
        <div className="w-[100%] -ml-2 md:h-fit md:w-[97%] md:ml-4 p-10 flex flex-col justify-between mt-4 border border-gray-400">
          <div className="text-white font-medium flex justify-between w-full mb-4">
            <div className="flex flex-col">
              <span className="text-gray-400">Collateral Claimed</span>
              <span className="flex flex-row gap-1">
                {" "}
                <Image src={img3} alt="info" width={20} />
                {collateralClaimed.toFixed(2)} SUPRA
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400">Timestamp</span>
              <span> {formatDate(liquidationTimestamp)}</span>
            </div>
          </div>
          <div>
            <hr className="border-[#827f77] border-1 my-4" />
          </div>
          <div className="space-y-4 w-3/5">
            {/* Liquidated Debt */}
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex items-center">
                <span className="font-poppins text-lg font-medium text-gray-400">
                  Liquidated Debt
                </span>
                <Image
                  width={15}
                  className="toolTipp "
                  src={info || "/placeholder.svg"}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins"
                  target=".toolTipp"
                  content="The amount of debt that was liquidated from your position."
                  mouseTrack
                  mouseTrackLeft={10}
                />
              </div>
              <div className="text-white font-medium">
                {totalDebtLiquidated.toFixed(2)} CASH
              </div>
            </div>

            {/* Collateral Liquidated - UPDATED */}
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex items-center">
                <span className="font-poppins text-lg font-medium text-gray-400">
                  Collateral Liquidated
                </span>
                <Image
                  width={15}
                  className="toolTipHoldingltv "
                  src={info || "/placeholder.svg"}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins"
                  target=".toolTipHoldingltv"
                  content="The amount of collateral that was taken during liquidation (Total Collateral Change - Collateral Claimed)."
                  mouseTrack
                  mouseTrackLeft={10}
                />
              </div>
              <div className="text-white font-medium">
                {collateralLiquidated.toFixed(2)} SUPRA
              </div>
            </div>

            {/* Liquidation Price */}
            {liquidationPrice !== null ? (
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex items-center">
                  <span className="text-lg font-poppins font-medium text-gray-400">
                    Liquidation Price
                  </span>
                  <Image
                    width={15}
                    className="toolTipHolding12 "
                    src={info || "/placeholder.svg"}
                    data-pr-tooltip=""
                    alt="info"
                  />
                  <Tooltip
                    className="custom-tooltip font-poppins"
                    target=".toolTipHolding12"
                    mouseTrack
                    content="The price at which your position became eligible for liquidation."
                    mouseTrackLeft={10}
                  />
                </div>
                <div className="text-white font-medium">
                  <>${liquidationPrice.toFixed(4)} </>
                </div>
              </div>
            ) : null}

            {/* Liquidation Penalty - UPDATED */}
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex items-center">
                <span className="text-lg font-poppins font-medium text-gray-400">
                  Liquidation Penalty
                </span>
                <Image
                  width={15}
                  className="toolTipHolding16 "
                  src={info || "/placeholder.svg"}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins"
                  target=".toolTipHolding16"
                  content="The penalty fee charged during liquidation (Liquidator Reward - Debt Repaid in Collateral Terms)."
                  mouseTrack
                  mouseTrackLeft={10}
                />
              </div>
              <div className="text-white font-medium">
                {liquidationPenaltyAmount.toFixed(2)} SUPRA
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* TABLE */}
      <div className="mx-4 mt-6">
        <h2 className="text-xl font-medium text-white mb-4">
          Transaction History
        </h2>
        {positionData && positionData.history ? (
          <RedemptionTable display={"SUPRA"} />
        ) : (
          <div className="text-white">
            <FullScreenLoader />
          </div>
        )}
      </div>
    </div>
  );
}