import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useWallet } from "../../context/WalletContext";
import { SupraClient, BCS, TxnBuilderTypes, HexString } from "supra-l1-sdk";
import cashIcon from "@/app/assets/images/CASH2.png";
import {
  module_address,
  module_name,
  stable_coin,
  supra_coin,
} from "@/constants/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtocolMetric {
  token: string;
  minDebt: number;
  liquidationReserve: number;
  liquidationThreshold: number;
  price: number;
}

interface ProtocolMetricsResponse {
  metrics: ProtocolMetric[];
}

const LiquidationHeader = () => {
  const { isInstalled, account, balance } = useWallet();
  const [protocolData, setProtocolData] =
    useState<ProtocolMetricsResponse | null>(null);
  const [minimumDebt, setMinimumDebt] = useState(0);
  const [liquidationReserve, setLiquidationReserve] = useState(0);
  const [liquidationThreshold, setLiquidationThreshold] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [isLoadingProtocolData, setIsLoadingProtocolData] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  const fetchProtocolConfig = async () => {
    try {
      const response = await axios.get<ProtocolMetricsResponse>(
        "https://api.solido.money/protocol/metrics"
      );
      const protocolMetrics = response.data;
      setProtocolData(protocolMetrics);

      if (
        protocolMetrics &&
        protocolMetrics.metrics &&
        protocolMetrics.metrics.length > 0
      ) {
        const supraMetrics = protocolMetrics.metrics.find(
          (metric) => metric.token === "SUPRA"
        );
        if (supraMetrics) {
          setMinimumDebt(supraMetrics.minDebt);
          setLiquidationReserve(supraMetrics.liquidationReserve);
          setLiquidationPrice((1 / supraMetrics.liquidationThreshold) * 10000);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching protocol metrics:", err.message);
      } else {
        console.error("Unexpected error while fetching protocol metrics:", err);
      }
    } finally {
      setIsLoadingProtocolData(false);
    }
  };

  useEffect(() => {
    fetchProtocolConfig();
  }, []);

  useEffect(() => {
    const fetchCashBalance = async () => {
      if (!SupraClient || !account || account.length === 0) {
        setIsLoadingBalance(false);
        return;
      }

      try {
        setIsLoadingBalance(true);
        const supraClient = new SupraClient("https://rpc-mainnet.supra.com/");

        const rawBalance = await supraClient.getAccountCoinBalance(
          HexString.ensure(account),
          stable_coin
        );

        const convertedBalance =
          typeof rawBalance === "bigint"
            ? Number(rawBalance.toString()) / 100000000
            : rawBalance / 100000000;

        setCashBalance(convertedBalance);
      } catch (err) {
        console.error("Error fetching CASH balance:", err);
        setCashBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchCashBalance();
  }, [account]);

  const isLoading = isLoadingProtocolData || isLoadingBalance;

  return (
    <div>
      <div
        className="min-h-[112px] flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-8 py-4 md:py-6"
        style={{ backgroundColor: "#222222" }}
      >
        <div className="flex flex-col items-start mb-4 md:mb-0">
          <h1 className="font-poppins font-medium text-white text-xl md:text-2xl mb-1">
            Liquidate Troves
          </h1>
          {isLoadingProtocolData ? (
            <Skeleton className="w-64 h-6 bg-gray-200 rounded-md animate-pulse" />
          ) : (
            <h6 className="font-poppins font-medium text-[#CDE1EE] text-xs md:text-sm text-start">
              Pay back loans of Troves above {liquidationPrice.toFixed(2)}% LTV
              to claim liquidation rewards.
            </h6>
          )}
        </div>
        {/* Right Section */}
        <div className="flex flex-col w-full md:w-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center">
            <div className="flex flex-col items-start w-full md:w-auto">
              <p className="font-poppins text-[#CDE1EE] text-sm md:text-base font-medium leading-[27px]">
                Wallet Balance
              </p>
              <div className="flex flex-row gap-2 items-start md:items-center w-full md:w-auto">
                <Image
                  src={cashIcon}
                  alt="CASH icon"
                  width={30}
                  height={30}
                  className="block md:block"
                />
                {isLoadingBalance ? (
                  <Skeleton className="w-32 h-8 bg-gray-200 rounded-md animate-pulse" />
                ) : (
                  <h6 className="font-poppins text-white font-medium text-base md:text-xl lg:text-2xl md:leading-[42px]">
                    {account !== "undefined"
                      ? Number(cashBalance).toFixed(2) + " CASH"
                      : "0.00 CASH"}
                  </h6>
                )}
                {isLoadingBalance ? (
                  <Skeleton className="w-20 h-6 bg-gray-200 rounded-md animate-pulse" />
                ) : (
                  <h6 className="text-[#CDE1EE] font-medium text-sm md:text-base leading-[25.43px] font-poppins hidden md:block">
                    {account !== "undefined"
                      ? `$${Number(cashBalance).toFixed(2)}`
                      : "$0.00"}
                  </h6>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidationHeader;
