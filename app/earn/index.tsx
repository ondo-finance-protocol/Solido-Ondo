/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { HexString, SupraClient, BCS } from "supra-l1-sdk";
import { Dialog } from "primereact/dialog";

import bCash from "@/app/assets/images/stake/bCash.png";
import cash from "@/app/assets/images/stake/cash.png";
import conf from "@/app/assets/images/Loader 1.gif";
import tick from "@/app/assets/images/Done_Solido.gif";
import rej from "@/app/assets/images/TxnError.gif";
import arrow from "@/app/assets/arrow.svg";
import icircle from "../../app/assets/images/info.svg";

import { useWallet } from "@/context/WalletContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  module_address_vault,
  module_name_vault,
  stable_coin,
  vault_coin,
} from "@/constants/constants";
import { Tooltip } from "primereact/tooltip";
import useFetchMetrics from "@/hooks/use-fetch-metrics";

// Types
interface BalanceState {
  cash: number;
  bCash: number;
}

interface LoadingState {
  balances: boolean;
  transaction: boolean;
}

interface TransactionResult {
  txHash: string | null;
  success: boolean;
  amount?: string;
  receiveAmount?: number;
  token?: string;
  receiveToken?: string;
}

// Constants
const PERCENTAGE_OPTIONS = [25, 50, 75, 100] as const;
const TABS = [
  { value: "stake" as const, label: "STAKE" },
  { value: "unstake" as const, label: "UNSTAKE" },
];
const TOKEN_DECIMALS = 1e8;
const DEBOUNCE_DELAY = 300;

// APY Time Period Constants
const APY_TIME_PERIODS = [
  { value: "7D" as const, label: "7D" },
  { value: "30D" as const, label: "30D" },
  { value: "ALL" as const, label: "All" },
] as const;

// Custom Hook for debouncing
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Helper Functions
const formatAmount = (amount: string): number =>
  Math.floor(Number(amount) * TOKEN_DECIMALS);
const formatBalance = (balance: number | bigint): number => {
  const numBalance =
    typeof balance === "bigint" ? Number(balance.toString()) : balance;
  return numBalance / TOKEN_DECIMALS;
};

const StakingInterface: React.FC = () => {
  const { account } = useWallet();

  // Memoized providers and clients
  const supraClient = useMemo(() => {
    if (typeof window !== "undefined") {
      return new SupraClient("https://rpc-mainnet.supra.com");
    }
    return null;
  }, []);

  const supraProvider = useMemo(
    () =>
      typeof window !== "undefined" ? (window as any)?.starkey?.supra : null,
    []
  );

  // State
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [amounts, setAmounts] = useState({ stake: "", unstake: "" });
  const [balances, setBalances] = useState<BalanceState>({ cash: 0, bCash: 0 });
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [unitExchangeRate, setUnitExchangeRate] = useState(1);
  const [apy, setApy] = useState("0.00");
  const [apyTimePeriod, setApyTimePeriod] = useState<"7D" | "30D" | "ALL">(
    "ALL"
  ); // New state for APY time period
  const [loading, setLoading] = useState<LoadingState>({
    balances: true,
    transaction: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [lastTransaction, setLastTransaction] = useState<TransactionResult>({
    txHash: null,
    success: false,
  });

  // Modal States
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [transactionRejected, setTransactionRejected] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  // Debounced amount for calculations
  const debouncedAmount = useDebounce(amounts[activeTab], DEBOUNCE_DELAY);
  const { stakedCASH, bCASHSupply } = useFetchMetrics();

  // Fetch exchange rate from API
  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://api.solido.money/protocol/metrics"
      );
      if (response.data?.pricebCASH && response.data?.lastUpdated) {
        const pricebCASH = parseFloat(response.data.pricebCASH);
        setUnitExchangeRate(pricebCASH);

        const lastUpdatedDate = new Date(response.data.lastUpdated);
        const startDate = new Date("2025-06-11T00:00:00Z");

        const timeDiffMs = lastUpdatedDate.getTime() - startDate.getTime();
        const daysSinceStart = timeDiffMs / (1000 * 60 * 60 * 24);

        const apyCalc =
          daysSinceStart > 0
            ? ((pricebCASH - 1) * 100 * 365) / daysSinceStart
            : 0;

        setApy(apyCalc.toFixed(2));
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setUnitExchangeRate(1);
    }
  }, []);

  // Calculate receive amount locally
  const calculateReceiveAmount = useCallback(
    (amount: string) => {
      if (!amount || parseFloat(amount) === 0) {
        setReceiveAmount(0);
        return;
      }

      const inputAmount = parseFloat(amount);
      if (activeTab === "stake") {
        // CASH -> bCASH: divide by exchange rate
        setReceiveAmount(inputAmount / unitExchangeRate);
      } else {
        // bCASH -> CASH: multiply by exchange rate
        setReceiveAmount(inputAmount * unitExchangeRate);
      }
    },
    [activeTab, unitExchangeRate]
  );

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!supraClient || !account) {
      setLoading((prev) => ({ ...prev, balances: false }));
      return;
    }

    setLoading((prev) => ({ ...prev, balances: true }));
    setError(null);

    try {
      const [cashBalanceResult, bCashBalanceResult] = await Promise.allSettled([
        supraClient.getAccountCoinBalance(
          HexString.ensure(account),
          stable_coin
        ),
        supraClient.getAccountCoinBalance(
          HexString.ensure(account),
          vault_coin
        ),
      ]);

      const cashBalance =
        cashBalanceResult.status === "fulfilled"
          ? formatBalance(cashBalanceResult.value)
          : 0;
      const bCashBalance =
        bCashBalanceResult.status === "fulfilled"
          ? formatBalance(bCashBalanceResult.value)
          : 0;

      setBalances({ cash: cashBalance, bCash: bCashBalance });
    } catch (err) {
      console.error("Error fetching balances:", err);
      setError("Failed to fetch balances");
    } finally {
      setLoading((prev) => ({ ...prev, balances: false }));
    }
  }, [account, supraClient]);

  // Handle input change
  const handleInputChange = useCallback(
    (value: string) => {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setAmounts((prev) => ({ ...prev, [activeTab]: value }));
      }
    },
    [activeTab]
  );

  // Handle percentage click
  const handlePercentageClick = useCallback(
    (percentage: number) => {
      const baseAmount = activeTab === "stake" ? balances.cash : balances.bCash;
      const amount = ((baseAmount * percentage) / 100).toFixed(8);
      setAmounts((prev) => ({ ...prev, [activeTab]: amount }));
    },
    [activeTab, balances]
  );

  // Calculate APY based on time period
  const calculateAPY = useCallback(
    (metricsData: any, period: "7D" | "30D" | "ALL") => {
      const pricebCASH = parseFloat(metricsData.pricebCASH);

      switch (period) {
        case "7D":
          if (metricsData.pricebCASH7D) {
            const pricebCASH7D = parseFloat(metricsData.pricebCASH7D);
            return (((pricebCASH - pricebCASH7D) * 365) / 7) * 100;
          }
          return 0;

        case "30D":
          if (metricsData.pricebCASH30D) {
            const pricebCASH30D = parseFloat(metricsData.pricebCASH30D);
            return (((pricebCASH - pricebCASH30D) * 365) / 30) * 100;
          }
          return 0;

        case "ALL":
          if (metricsData.lastUpdated) {
            const lastUpdatedDate = new Date(metricsData.lastUpdated);
            const startDate = new Date("2025-06-11T00:00:00Z");
            const timeDiffMs = lastUpdatedDate.getTime() - startDate.getTime();
            const daysSinceStart = timeDiffMs / (1000 * 60 * 60 * 24);

            return daysSinceStart > 0
              ? ((pricebCASH - 1) * 100 * 365) / daysSinceStart
              : 0;
          }
          return 0;

        default:
          return 0;
      }
    },
    []
  );

  // Handle APY time period change
  const handleApyTimePeriodChange = useCallback(
    async (period: "7D" | "30D" | "ALL") => {
      setApyTimePeriod(period);

      // Recalculate APY for the new period
      try {
        const response = await axios.get(
          "https://api.solido.money/protocol/metrics"
        );
        if (response.data?.pricebCASH) {
          const apyCalc = calculateAPY(response.data, period);
          setApy(apyCalc.toFixed(2));
        }
      } catch (error) {
        console.error("Error recalculating APY:", error);
      }
    },
    [calculateAPY]
  );

  // Create and send transaction
  const createTransaction = useCallback(
    async (functionName: string, amount: string) => {
      if (!supraProvider || !account) {
        throw new Error("Wallet not connected");
      }

      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const amountFormatted = formatAmount(amount);

      const rawTx = [
        account,
        0,
        module_address_vault,
        module_name_vault,
        functionName,
        [stable_coin],
        [BCS.bcsSerializeUint64(amountFormatted)],
        { txExpiryTime },
      ];

      const data = await supraProvider.createRawTransactionData(rawTx);
      if (!data) throw new Error("Failed to create transaction data");

      const params = {
        data,
        from: account,
        to: module_address_vault,
        chainId: 8,
        value: "",
      };

      return supraProvider.sendTransaction(params);
    },
    [account, supraProvider]
  );

  // Handle transaction
  const handleTransaction = useCallback(async () => {
    const amount = amounts[activeTab];

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    // Store transaction details
    const currentReceiveAmount = receiveAmount;
    const currentInputToken = activeTab === "stake" ? "CASH" : "bCASH";
    const currentReceiveToken = activeTab === "stake" ? "bCASH" : "CASH";

    try {
      setLoading((prev) => ({ ...prev, transaction: true }));
      setTransactionRejected(false);
      setError(null);
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);

      const functionName = activeTab === "stake" ? "deposit" : "redeem";
      const txHash = await createTransaction(functionName, amount);

      if (!txHash) throw new Error("Transaction failed");

      // Success
      setLastTransaction({
        txHash,
        success: true,
        amount,
        receiveAmount: currentReceiveAmount,
        token: currentInputToken,
        receiveToken: currentReceiveToken,
      });
      setLoadingMessage(
        `${activeTab === "stake" ? "Stake" : "Unstake"} successful`
      );

      // Reset form and refresh balances
      setAmounts((prev) => ({ ...prev, [activeTab]: "" }));
      fetchBalances();
    } catch (err) {
      console.error(`Error ${activeTab}ing:`, err);
      setTransactionRejected(true);
      setLoadingMessage("Transaction was rejected");
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading((prev) => ({ ...prev, transaction: false }));
    }
  }, [
    account,
    activeTab,
    amounts,
    receiveAmount,
    createTransaction,
    fetchBalances,
  ]);

  // Handle tab change
  const handleTabChange = useCallback((tab: "stake" | "unstake") => {
    setActiveTab(tab);
    setLastTransaction({ txHash: null, success: false });
    setTransactionRejected(false);
    setLoadingModalVisible(false);
    setError(null);
  }, []);

  // Modal close handler
  const handleClose = useCallback(() => {
    setLoadingModalVisible(false);
    setTransactionRejected(false);
    setShowCloseButton(false);
    setLastTransaction({ txHash: null, success: false });
    setError(null);
  }, []);

  // Effects
  useEffect(() => {
    fetchBalances();
    fetchExchangeRate();
  }, [fetchBalances, fetchExchangeRate]);

  useEffect(() => {
    calculateReceiveAmount(debouncedAmount);
  }, [debouncedAmount, calculateReceiveAmount]);

  // Modal visibility effect
  useEffect(() => {
    if (loading.transaction && !lastTransaction.txHash) {
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);
    } else if (lastTransaction.success && lastTransaction.txHash) {
      setLoadingMessage(
        `${activeTab === "stake" ? "Stake" : "Unstake"} successful`
      );
      setLoadingModalVisible(true);
    } else if (transactionRejected && !loading.transaction) {
      setLoadingMessage("Transaction was rejected");
      setLoadingModalVisible(true);
    }
  }, [
    lastTransaction.success,
    lastTransaction.txHash,
    loading.transaction,
    transactionRejected,
    activeTab,
  ]);

  // Close button timer
  useEffect(() => {
    const timer = setTimeout(() => setShowCloseButton(true), 180000);
    return () => clearTimeout(timer);
  }, []);

  // Computed values
  const currentAmount = amounts[activeTab];
  const currentBalance = activeTab === "stake" ? balances.cash : balances.bCash;
  const receiveToken = activeTab === "stake" ? "bCASH" : "CASH";
  const inputToken = activeTab === "stake" ? "CASH" : "bCASH";
  const shortenedHash = lastTransaction.txHash
    ? `${lastTransaction.txHash.slice(0, 6)}...${lastTransaction.txHash.slice(
      -4
    )}`
    : "";

  const isButtonDisabled =
    loading.balances ||
    loading.transaction ||
    !currentAmount ||
    parseFloat(currentAmount) <= 0 ||
    !account ||
    loadingModalVisible;

  return (
    <div className="bg-black min-h-screen p-2 lg:p-4">
      <div className="max-w-3xl mx-auto space-y-7">
        {/* Portfolio Stats */}
        <div className="bg-black p-6 mb-4 border border-gray-800 rounded-lg">
          <div className="grid grid-cols-2 gap-0">
            <div className="pr-6 border-r border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Your Portfolio</h3>
              <div className="flex items-center gap-3">
                <Image
                  src={bCash}
                  alt="bCASH"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm md:text-2xl font-bold text-white">
                      {balances.bCash.toFixed(2)}
                    </span>
                    <span className="text-gray-400">bCASH</span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    ~ {(balances.bCash * unitExchangeRate).toFixed(2)} CASH
                  </div>
                </div>
              </div>
            </div>

            <div className="pl-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex justify-start items-center gap-1">
                  <h3 className="text-gray-400 text-sm">Current APY</h3>
                  <Image
                    width={15}
                    className="toolTipHolding42 ml_5 cursor-pointer"
                    src={icircle}
                    data-pr-tooltip=""
                    alt="info"
                  />
                  <Tooltip
                    className="font-poppins font-medium2"
                    target=".toolTipHolding42"
                    content="APR is estimated from the recent performance over selected timeframe. Actual returns may vary."
                    mouseTrack
                    mouseTrackLeft={10}
                    style={{ backgroundColor: "#2F2F2F" }}
                  />
                </div>

                {/* APY Time Period Buttons */}
                <div className="flex gap-1">
                  {APY_TIME_PERIODS.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => handleApyTimePeriodChange(period.value)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${apyTimePeriod === period.value
                          ? "bg-[#1DBDAF] text-black"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                        }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-2xl font-bold text-[#1DBDAF]">
                {apy > "0.00" ? apy : "-"} {apy > "0.00" ? "%" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Staking Interface */}
        <div className="bg-black overflow-hidden border border-gray-800 rounded-lg">
          {/* Tab Selector */}
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`flex-1 py-4 text-center font-semibold transition-all duration-300 ${activeTab === tab.value
                    ? "bg-[#1DBDAF] text-black"
                    : "bg-black text-gray-400 hover:text-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Amount Input */}
            <div className="mb-6">
              <div className="flex items-center bg-black rounded-lg border border-gray-700 overflow-hidden">
                <div className="flex items-center md:gap-3 gap-2 px-4 py-3 bg-black border-r border-gray-700">
                  <Image
                    src={activeTab === "stake" ? cash : bCash}
                    alt="token"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium md:text-md text-xs ">
                    {inputToken}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={`Enter the amount you want to ${activeTab}`}
                  value={currentAmount}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder-gray-500"
                />
              </div>
            </div>

            {/* Balance and Percentage Buttons */}
            <div className="xs:flex-col md:flex items-center justify-between mb-6">
              <div className="flex md:flex-col justify-between items-center py-3">
                <h3 className="text-gray-400 text-sm mb-2">Wallet Balance</h3>
                <div className="text-white text-lg font-medium">
                  {loading.balances ? (
                    <Skeleton className="w-20 h-6 bg-gray-700 rounded-md animate-pulse" />
                  ) : (
                    `${currentBalance.toFixed(2)} ${inputToken}`
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {PERCENTAGE_OPTIONS.map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => handlePercentageClick(percentage)}
                    disabled={loading.balances}
                    className="px-4 py-2 bg-black border border-gray-700 rounded text-gray-400 hover:border-teal-400 hover:text-teal-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>

            {/* Receive Amount */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-400 md:text-sm text-xs">
                You will receive
              </h3>
              <div className="flex items-center md:gap-3 gap-2">
                <Image
                  src={activeTab === "stake" ? bCash : cash}
                  alt="receive"
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <span className="text-md md:text-3xl font-bold text-white">
                  {receiveAmount > 0 ? receiveAmount.toFixed(4) : "0.0000"}
                </span>
                <span className="text-gray-400 md:text-lg text-sm">
                  {receiveToken}
                </span>
              </div>
            </div>

            {/* Exchange Rate Display */}
            <div className="border-t border-gray-800 pt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={bCash}
                    alt="bCASH"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-gray-400 md:text-xl text-xs">
                    1 bCASH equals to
                  </span>
                </div>
                <div className="flex items-center md:gap-3 gap-2">
                  <Image
                    src={cash}
                    alt="CASH"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium md:text-xl text-xs">
                    {unitExchangeRate.toFixed(4)} CASH
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              className="w-full py-4 bg-teal-400 text-black font-bold text-lg rounded-lg hover:bg-teal-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTransaction}
              disabled={isButtonDisabled}
            >
              {loading.transaction
                ? "Processing..."
                : loading.balances
                  ? "Loading..."
                  : !account
                    ? "Connect Wallet"
                    : activeTab.toUpperCase()}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm">Error: {error}</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-black p-6 mb-4 border border-gray-800 rounded-lg flex flex-col gap-3">
          <div className="flex w-full justify-between items-center">
            <span className="text-[#D8FDFA] font-normal text-base">
              Total CASH Locked
            </span>
            <span className="text-[#D8FDFA] font-medium text-base">
              {stakedCASH}
            </span>
          </div>
          <div className="flex w-full justify-between items-center">
            <span className="text-[#D8FDFA] font-normal text-base">
              bCASH Supply
            </span>
            <span className="text-[#D8FDFA] font-medium text-base">
              {bCASHSupply}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <Dialog
        visible={loadingModalVisible}
        onHide={handleClose}
        closable={false}
      >
        <div className="dialog-overlay flex items-center justify-center">
          <div
            className="dialog-content w-[90%] max-w-[380px] bg-black p-6 flex flex-col justify-around border border-gray-400"
            style={{ height: "550px" }}
          >
            <div className="p-5">
              {loadingMessage === "Waiting for transaction to confirm.." ? (
                <>
                  <Image
                    src={conf}
                    alt="loading"
                    width={150}
                    className="mx-auto"
                  />
                  <div className="text-center mt-8 font-poppins font-bold text-white">
                    {loadingMessage}
                  </div>
                </>
              ) : loadingMessage.includes("successful") ? (
                <>
                  <Image
                    src={tick}
                    alt="success"
                    width={150}
                    className="mx-auto"
                  />
                  <div className="text-center font-poppins font-bold text-white mb-4">
                    {loadingMessage}
                  </div>
                  <div className="bg-[#222222] p-4 space-y-2">
                    <div className="flex justify-between text-white text-sm">
                      <span>
                        You {activeTab === "stake" ? "staked" : "unstaked"}:
                      </span>
                      <span>
                        {Number(lastTransaction.amount).toFixed(2)}{" "}
                        {lastTransaction.token}
                      </span>
                    </div>
                    <div className="flex justify-between text-white text-sm">
                      <span>You received:</span>
                      <span>
                        {lastTransaction.receiveAmount?.toFixed(2)}{" "}
                        {lastTransaction.receiveToken}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-white text-sm">
                      <span>Transaction hash:</span>
                      <div className="flex items-center gap-2">
                        <span>{shortenedHash}</span>
                        <Link
                          href={`https://suprascan.io/tx/${lastTransaction.txHash}`}
                          target="_blank"
                        >
                          <Image
                            src={arrow}
                            alt="external link"
                            className="h-4 cursor-pointer"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : transactionRejected ? (
                <>
                  <Image
                    src={rej}
                    alt="rejected"
                    width={150}
                    className="mx-auto"
                  />
                  <div className="text-center font-poppins font-bold text-white">
                    {loadingMessage}
                  </div>
                </>
              ) : (
                <Image
                  src={conf}
                  alt="loading"
                  width={150}
                  className="mx-auto"
                />
              )}

              {lastTransaction.success && (
                <button
                  className="mt-4 p-3 w-full text-black font-poppins font-bold hover:bg-[#2b4e51] bg-[#1DBDAF]"
                  onClick={handleClose}
                >
                  Close
                </button>
              )}

              {(transactionRejected ||
                (!lastTransaction.success && showCloseButton)) && (
                  <>
                    <p className="text-center font-poppins text-white text-xs mt-2 mb-4">
                      {transactionRejected
                        ? "Transaction was rejected. Please try again."
                        : "Some Error Occurred On Network Please Try Again After Some Time.. 🤖"}
                    </p>
                    <Button
                      className="mx-auto block hover:bg-[#2b4e51] font-bold text-black font-poppins bg-[#1dbdaf]"
                      onClick={handleClose}
                    >
                      Try again
                    </Button>
                  </>
                )}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default StakingInterface;
