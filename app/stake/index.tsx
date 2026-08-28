/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Image from "next/image";
import stSUPRA from "@/app/assets/images/flow/stSupra.png";
import SUPRA from "@/app/assets/images/SUPRA.png";
import { useWallet } from "@/context/WalletContext";
import { HexString, SupraClient } from "supra-l1-sdk";
import {
  module_address_mainnet_flow,
  module_name_vault,
  stsupra_coin,
  supra_coin,
} from "@/constants/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { BCS } from "supra-l1-sdk";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import icircle from "../../app/assets/images/info.svg";
import Link from "next/link";

// Import assets for modals (you'll need to add these to your assets)
import conf from "@/app/assets/images/Loader 1.gif";
import tick from "@/app/assets/images/Done_Solido.gif";
import rej from "@/app/assets/images/TxnError.gif";
import arrow from "@/app/assets/arrow.svg";
import useFetchMetrics from "@/hooks/use-fetch-metrics";

// Types
interface TabType {
  value: "stake" | "unstake" | "withdraw";
  label: string;
}

interface BalanceState {
  SUPRA: number;
  stSUPRA: number;
}

interface LoadingState {
  balances: boolean;
  receiveAmount: boolean;
  transaction: boolean;
  unitRate: boolean;
  unclaimedWithdrawals: boolean;
}

interface ErrorState {
  balances: string | null;
  transaction: string | null;
  unclaimedWithdrawals: string | null;
}

interface TransactionResult {
  txHash: string | null;
  success: boolean;
}

// NEW: Interface for unclaimed withdrawal data
interface UnclaimedWithdrawal {
  txHash: string;
  stSupraAmount: number | string;
  supraAmount: number | string;
  settlement: number | string;
  timestamp: string;
  blockNumber: number | string;
  claim: boolean; // NEW: Add claim status
}

// Update the interface to include transactionHistory
interface UnclaimedWithdrawalsData {
  walletAddress: string;
  totalstSUPRA: number | string;
  totalSupraDeposited: number | string;
  status: string;
  unclaimedWithdrawals: UnclaimedWithdrawal[];
  totalUnclaimedAmount: number | string;
  unclaimedCount: number;
  transactionHistory: TransactionHistoryItem[]; // Add this if missing
  summary: any;
}

interface TransactionHistoryItem {
  txHash: string;
  txType: "deposit" | "withdraw";
  receiver: string;
  supraAmount: number | string;
  stSupraAmount: number | string;
  settlement: boolean;
  claim?: boolean; // This exists for withdraw transactions
  exchangeRate?: number;
  timestamp: string;
  blockNumber: number | string;
}

// Constants
const PERCENTAGE_OPTIONS = [25, 50, 75, 100] as const;
const TABS: TabType[] = [
  { value: "stake", label: "STAKE" },
  { value: "unstake", label: "UNSTAKE" },
  { value: "withdraw", label: "WITHDRAW" },
] as const;
const TOKEN_DECIMALS = 1e8;
const DEBOUNCE_DELAY = 500;
const MINIMUM_AMOUNT = 10; // NEW: Minimum amount for stake/unstake

const APY_TIME_PERIODS = [
  { value: "7D" as const, label: "7D" },
  // { value: "30D" as const, label: "30D" },
  // { value: "ALL" as const, label: "All" },
] as const;

// API base URL - adjust this to match your backend
const API_BASE_URL = "https://api.solido.money/";

// Custom Hooks
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const useSupraClient = () => {
  return useMemo(() => {
    if (typeof window !== "undefined") {
      return new SupraClient("https://rpc-mainnet.supra.com/");
    }
    return null;
  }, []);
};

// Helper Functions
const formatAmount = (amount: string): number => {
  return Math.floor(Number(amount) * TOKEN_DECIMALS);
};

const formatBalance = (balance: number | bigint): number => {
  const numBalance =
    typeof balance === "bigint" ? Number(balance.toString()) : balance;


  const result = numBalance / TOKEN_DECIMALS;
  return result;
};

const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper function to safely format numeric values
const safeFormatNumber = (
  value: number | string | undefined,
  decimals: number = 4
): string => {
  if (value === undefined || value === null) return "0.0000";

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return "0.0000";

  return numValue.toFixed(decimals);
};

// Helper: Check if withdrawal can be claimed (e.g., after 2 days)
const canClaimWithdrawal = (timestamp: string): boolean => {
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // Changed from 4 hours to 2 days
  const withdrawalTime = new Date(timestamp).getTime();
  const now = Date.now();
  return now - withdrawalTime >= TWO_DAYS_MS;
};

// NEW: Helper function to validate minimum amount
const isValidAmount = (
  amount: string,
  minAmount: number = MINIMUM_AMOUNT
): boolean => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount >= minAmount;
};

// NEW: Helper function to get validation error message
const getAmountValidationError = (
  amount: string,
  activeTab: string
): string | null => {
  if (!amount || parseFloat(amount) <= 0) {
    return null; // Don't show error for empty input
  }

  if (!isValidAmount(amount)) {
    const token = activeTab === "stake" ? "SUPRA" : "stSUPRA";
    return `Minimum amount is ${MINIMUM_AMOUNT} ${token}`;
  }

  return null;
};

// API Functions
const viewFunction = async (
  functionName: string,
  typeArguments: string[],
  args: string[]
) => {
  const response = await axios.post(
    "https://rpc-mainnet.supra.com/rpc/v1/view",
    {
      function: functionName,
      type_arguments: typeArguments,
      arguments: args,
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.result;
};

// NEW: Function to fetch unclaimed withdrawals
const fetchUnclaimedWithdrawals = async (
  walletAddress: string
): Promise<UnclaimedWithdrawalsData | null> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}users/mainnet/flow/${walletAddress}`
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching unclaimed withdrawals:", error);
    throw error;
  }
};

const StakingInterface: React.FC = () => {
  // Hooks
  const { account, connectWallet } = useWallet();
  const supraClient = useSupraClient();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const { stakedSUPRA, stSUPRASupply } = useFetchMetrics();

  // Window provider
  let supraProvider: any =
    typeof window !== "undefined" && (window as any)?.starkey?.supra;

  // State
  const [activeTab, setActiveTab] = useState<"stake" | "unstake" | "withdraw">(
    "stake"
  );
  const [amounts, setAmounts] = useState({
    stake: "",
    unstake: "",
    withdraw: "",
  });
  const [balances, setBalances] = useState<BalanceState>({
    SUPRA: 0,
    stSUPRA: 0,
  });
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [unitExchangeRate, setUnitExchangeRate] = useState(1);
  const [loading, setLoading] = useState<LoadingState>({
    balances: true,
    receiveAmount: false,
    transaction: false,
    unitRate: false,
    unclaimedWithdrawals: false,
  });
  const [errors, setErrors] = useState<ErrorState>({
    balances: null,
    transaction: null,
    unclaimedWithdrawals: null,
  });
  const [lastTransaction, setLastTransaction] = useState<TransactionResult>({
    txHash: null,
    success: false,
  });
  const [withdrawalBeingProcessed, setWithdrawalBeingProcessed] = useState<{
    amount: number;
    txHash: string;
  } | null>(null);

  // NEW: State for unclaimed withdrawals - Changed to single selection
  const [unclaimedWithdrawals, setUnclaimedWithdrawals] =
    useState<UnclaimedWithdrawalsData | null>(null);

  const [showPendingDetails, setShowPendingDetails] = useState(false);

  const [apyTimePeriod, setApyTimePeriod] = useState<"7D" | "30D" | "ALL">(
    "7D"
  ); // New state for APY time period

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<string | null>(
    null
  ); // Changed from Set to single string

  const [showHistory, setShowHistory] = useState(false);

  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);

  // Modal States (similar to OpenTrove)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [transactionRejected, setTransactionRejected] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  const [apy, setApy] = useState("0.00");

  // NEW: State for amount validation error
  const [amountValidationError, setAmountValidationError] = useState<
    string | null
  >(null);

  // Debounced amount for calculations
  const debouncedAmount = useDebounce(amounts[activeTab], DEBOUNCE_DELAY);

  // Add this state for real-time countdown updates
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Add this useEffect for real-time countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const calculateApy = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://api.solido.money/protocol/metrics"
      );
      if (response.data?.pricebCASH && response.data?.lastUpdated) {
        const pricestSUPRA = parseFloat(response.data.pricestSUPRA);

        if (response.data.pricestSUPRA7D) {
          const pricestSUPRA7D = parseFloat(response.data.pricestSUPRA7D);
          const apyHere = (((pricestSUPRA - pricestSUPRA7D) * 365) / 7) * 100;
          setApy(apyHere.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setUnitExchangeRate(1);
    }
  }, []);

  // Calculate APY based on time period

  // Create a helper function for countdown calculation
  const calculateCountdown = useCallback(
    (timestamp: string) => {
      const withdrawalTime = new Date(timestamp).getTime();
      const timeRemaining = Math.max(
        0,
        2 * 24 * 60 * 60 * 1000 - (currentTime - withdrawalTime) // Changed from 4 hours to 2 days
      );

      // Format countdown as DD:HH:MM:SS for 2 days
      const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor(
        (timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
      );
      const minutes = Math.floor(
        (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
      );
      const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        timeRemaining,
        formatted: `${days}d ${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      };
    },
    [currentTime]
  );

  // Loading helpers
  const updateLoading = useCallback(
    (key: keyof LoadingState, value: boolean) => {
      setLoading((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateError = useCallback(
    (key: keyof ErrorState, value: string | null) => {
      setErrors((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // NEW: Fetch unclaimed withdrawals
  const loadUnclaimedWithdrawals = useCallback(async () => {
    if (!account) {
      setUnclaimedWithdrawals(null);
      return;
    }

    updateLoading("unclaimedWithdrawals", true);
    updateError("unclaimedWithdrawals", null);

    try {
      const data = await fetchUnclaimedWithdrawals(account);
      setUnclaimedWithdrawals(data);

      if (data) {
        console.log(`✅ Found ${data.unclaimedCount} unclaimed withdrawals`);
      }
    } catch (error) {
      console.error("Error loading unclaimed withdrawals:", error);
      updateError(
        "unclaimedWithdrawals",
        "Failed to load unclaimed withdrawals"
      );
      setUnclaimedWithdrawals(null);
    } finally {
      updateLoading("unclaimedWithdrawals", false);
    }
  }, [account, updateLoading, updateError]);

  // NEW: Get claimable withdrawals (only unclaimed and past 2 day delay)
  const getClaimableWithdrawals = useMemo(() => {
    if (!unclaimedWithdrawals) return [];

    return unclaimedWithdrawals.unclaimedWithdrawals.filter(
      (w) => !w.claim && canClaimWithdrawal(w.timestamp)
    );
  }, [unclaimedWithdrawals]);

  // Update the getClaimedWithdrawals useMemo to use transactionHistory
  const getClaimedWithdrawals = useMemo(() => {
    if (!unclaimedWithdrawals) return [];

    // Get claimed withdrawals from transaction history where claim === true
    return unclaimedWithdrawals.transactionHistory.filter(
      (item) => item.txType === "withdraw" && item.claim === true
    );
  }, [unclaimedWithdrawals]);

  // NEW: Get pending withdrawals (unclaimed but within 2 day delay)
  const getPendingWithdrawals = useMemo(() => {
    if (!unclaimedWithdrawals) return [];

    return unclaimedWithdrawals.unclaimedWithdrawals.filter(
      (w) => !w.claim && !canClaimWithdrawal(w.timestamp)
    );
  }, [unclaimedWithdrawals]);

  // Calculate unit exchange rate
  const calculateUnitExchangeRate = useCallback(async () => {
    try {
      updateLoading("unitRate", true);

      let functionName = `${module_address_mainnet_flow}::vault_core::convert_to_assets`;

      const result = await viewFunction(
        functionName,
        [supra_coin],
        [`${TOKEN_DECIMALS}`]
      );

      setUnitExchangeRate(result[0] / TOKEN_DECIMALS);
    } catch (error) {
      console.error("Error calculating unit exchange rate:", error);
      setUnitExchangeRate(1);
    } finally {
      updateLoading("unitRate", false);
    }
  }, [activeTab, updateLoading]);

  // Add a separate state for portfolio conversion rate
  const [portfolioConversionRate, setPortfolioConversionRate] = useState(1);

  // Add a function to calculate portfolio conversion rate (always convert_to_assets)
  const calculatePortfolioConversionRate = useCallback(async () => {
    try {
      const result = await viewFunction(
        `${module_address_mainnet_flow}::vault_core::convert_to_assets`,
        [supra_coin],
        [`${TOKEN_DECIMALS}`]
      );
      setPortfolioConversionRate(result[0] / TOKEN_DECIMALS);
    } catch (error) {
      console.error("Error calculating portfolio conversion rate:", error);
      setPortfolioConversionRate(1);
    }
  }, []);

  // Calculate receive amount
  const calculateReceiveAmount = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) === 0) {
        setReceiveAmount(0);
        return;
      }

      try {
        updateLoading("receiveAmount", true);

        let functionName = "";
        if (activeTab === "stake") {
          functionName = `${module_address_mainnet_flow}::vault_core::preview_withdraw`;
        } else if (activeTab === "unstake") {
          functionName = `${module_address_mainnet_flow}::vault_core::convert_to_assets`;
        } else if (activeTab === "withdraw") {
          // For withdraw, we might use convert_to_assets to show SUPRA equivalent
          functionName = `${module_address_mainnet_flow}::vault_core::convert_to_assets`;
        }

        const result = await viewFunction(
          functionName,
          [supra_coin],
          [`${formatAmount(amount)}`]
        );

        setReceiveAmount(result[0] / TOKEN_DECIMALS);
      } catch (error) {
        console.error("Error calculating receive amount:", error);
        setReceiveAmount(0);
      } finally {
        updateLoading("receiveAmount", false);
      }
    },
    [activeTab, updateLoading]
  );

  // Fetch balances
  const fetchBalances = useCallback(async () => {

    if (!supraClient || !account || account.length === 0) {
      updateLoading("balances", false);
      return;
    }

    updateLoading("balances", true);
    updateError("balances", null);

    let SUPRABalance = 0;
    let stSUPRABalance = 0;
    let hasAnyError = false;

    // Fetch SUPRA balance with individual error handling
    try {
      const rawSUPRABalance = await supraClient.getAccountCoinBalance(
        HexString.ensure(account),
        supra_coin
      );
      SUPRABalance = formatBalance(rawSUPRABalance);
    } catch (SUPRAError) {
      console.error("❌ SUPRA balance fetch failed:", SUPRAError);
      hasAnyError = true;
    }

    // Fetch stSUPRA balance with individual error handling
    try {
      const rawstSUPRABalance = await supraClient.getAccountCoinBalance(
        HexString.ensure(account),
        stsupra_coin
      );
      stSUPRABalance = formatBalance(rawstSUPRABalance);
    } catch (stSUPRAError) {
      console.error("❌ stSUPRA balance fetch failed:", stSUPRAError);
    }

    // Always set the balances we managed to fetch
    const finalBalances = { SUPRA: SUPRABalance, stSUPRA: stSUPRABalance };
    setBalances(finalBalances);

    // Only show error if SUPRA balance failed (stSUPRA failure is expected)
    if (hasAnyError && SUPRABalance === 0) {
      updateError("balances", "Failed to fetch SUPRA balance");
    } else {
      updateError("balances", null);
    }

    updateLoading("balances", false);
  }, [account, supraClient, updateLoading, updateError]);

  // Add a manual refresh button for testing
  const handleManualRefresh = () => {
    fetchBalances();
    loadUnclaimedWithdrawals();
  };

  // Handle input change with validation
  const handleInputChange = useCallback(
    (value: string) => {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setAmounts((prev) => ({
          ...prev,
          [activeTab]: value,
        }));

        // NEW: Validate amount for stake/unstake tabs
        if (activeTab === "stake" || activeTab === "unstake") {
          const validationError = getAmountValidationError(value, activeTab);
          setAmountValidationError(validationError);
        } else {
          setAmountValidationError(null);
        }
      }
    },
    [activeTab]
  );

  // Handle percentage click
  const handlePercentageClick = useCallback(
    (percentage: number) => {
      let baseAmount = 0;
      if (activeTab === "stake") {
        baseAmount = balances.SUPRA;
      } else if (activeTab === "unstake" || activeTab === "withdraw") {
        baseAmount = balances.stSUPRA;
      }

      const amount = ((baseAmount * percentage) / 100).toFixed(8);

      setAmounts((prev) => ({
        ...prev,
        [activeTab]: amount,
      }));

      // NEW: Validate amount for stake/unstake tabs
      if (activeTab === "stake" || activeTab === "unstake") {
        const validationError = getAmountValidationError(amount, activeTab);
        setAmountValidationError(validationError);
      } else {
        setAmountValidationError(null);
      }
    },
    [activeTab, balances]
  );

  // Create transaction
  const createTransaction = useCallback(
    async (functionName: string, amount: string) => {
      if (!supraProvider || !account) {
        window.location.reload();
      }

      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const optionalTransactionPayloadArgs = { txExpiryTime };
      const amountFormatted = formatAmount(amount);

      const rawTx = [
        account,
        0,
        module_address_mainnet_flow,
        module_name_vault,
        functionName,
        [supra_coin],
        [BCS.bcsSerializeUint64(amountFormatted)],
        optionalTransactionPayloadArgs,
      ];

      const data = await supraProvider.createRawTransactionData(rawTx);
      if (!data) {
        throw new Error("Failed to create raw transaction data");
      }

      const params = {
        data,
        from: account,
        to: module_address_mainnet_flow,
        chianId: 8,
        value: "",
      };

      return supraProvider.sendTransaction(params);
    },
    [account, supraProvider]
  );

  // NEW: Create claim withdrawal transaction
  const createClaimTransaction = useCallback(
    async (receiverAddress: string) => {
      if (!supraProvider || !account) {
        connectWallet();
        supraProvider =
          typeof window !== "undefined" && (window as any)?.starkey?.supra;
      }

      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const optionalTransactionPayloadArgs = { txExpiryTime };

      // Convert receiver address to proper format
      const receiverAddressBytes = new HexString(
        receiverAddress
      ).toUint8Array();

      const rawTx = [
        account,
        0,
        module_address_mainnet_flow,
        module_name_vault,
        "claim_withdrawal",
        [supra_coin], // AssetType parameter
        [receiverAddressBytes], // receiver address argument
        optionalTransactionPayloadArgs,
      ];

      const data = await supraProvider.createRawTransactionData(rawTx);
      if (!data) {
        throw new Error("Failed to create claim transaction data");
      }

      const params = {
        data,
        from: account,
        to: module_address_mainnet_flow,
        chianId: 8,
        value: "",
      };

      return supraProvider.sendTransaction(params);
    },
    [account, supraProvider]
  );

  // NEW: Handle claim withdrawal (single selection)
  const handleClaimWithdrawal = useCallback(async () => {
    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    // Check if there are any claimable withdrawals
    if (getClaimableWithdrawals.length === 0) {
      alert("No withdrawals available to claim");
      return;
    }

    try {
      // Calculate total amount for all claimable withdrawals
      const totalAmount = getClaimableWithdrawals.reduce((total, w) => {
        const amount =
          typeof w.stSupraAmount === "string"
            ? parseFloat(w.stSupraAmount)
            : w.stSupraAmount;
        return total + (isNaN(amount) ? 0 : amount);
      }, 0);

      setWithdrawalBeingProcessed({
        amount: totalAmount,
        txHash: getClaimableWithdrawals[0].txHash,
      });

      // Show confirmation modal first
      setIsModalVisible(true);

      // Start transaction
      updateLoading("transaction", true);
      updateError("transaction", null);
      setTransactionRejected(false);
      setLastTransaction({ txHash: null, success: false });

      // Hide confirmation modal and show loading modal
      setIsModalVisible(false);
      setLoadingMessage("Waiting for claim transaction to confirm..");
      setLoadingModalVisible(true);

      const txHash = await createClaimTransaction(account);

      if (!txHash) {
        throw new Error("Claim transaction failed");
      }
      // Transaction successful
      setLastTransaction({ txHash, success: true });
      setLoadingMessage("Claim successful");

      // Refresh data
      fetchBalances();
      loadUnclaimedWithdrawals();
    } catch (error) {
      console.error("Error claiming withdrawal:", error);
      setTransactionRejected(true);
      setLoadingMessage("Claim transaction was rejected");
      updateError(
        "transaction",
        error instanceof Error ? error.message : "Claim transaction failed"
      );
      // Clear withdrawal being processed on error
      setWithdrawalBeingProcessed(null);
    } finally {
      updateLoading("transaction", false);
    }
  }, [
    account,
    getClaimableWithdrawals,
    createClaimTransaction,
    fetchBalances,
    loadUnclaimedWithdrawals,
    updateLoading,
    updateError,
  ]);

  // Handle transaction with modal logic and validation
  const handleTransaction = useCallback(async () => {
    const amount = amounts[activeTab];

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // NEW: Check minimum amount validation for stake/unstake
    if (
      (activeTab === "stake" || activeTab === "unstake") &&
      !isValidAmount(amount)
    ) {
      const token = activeTab === "stake" ? "SUPRA" : "stSUPRA";
      alert(`Minimum amount is ${MINIMUM_AMOUNT} ${token}`);
      return;
    }

    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    // NEW: Check balance validation
    const currentBalance = getCurrentBalance();
    if (parseFloat(amount) > currentBalance) {
      const token = getInputToken();
      alert(`Insufficient ${token} balance`);
      return;
    }

    try {
      // Show confirmation modal first
      setIsModalVisible(true);

      // Start transaction
      updateLoading("transaction", true);
      updateError("transaction", null);
      setTransactionRejected(false);
      setLastTransaction({ txHash: null, success: false });

      // Hide confirmation modal and show loading modal
      setIsModalVisible(false);
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);

      let functionName = "";
      if (activeTab === "stake") {
        functionName = "deposit";
      } else if (activeTab === "unstake") {
        functionName = "redeem";
      } else if (activeTab === "withdraw") {
        // You'll need to implement this function in your smart contract
        functionName = "withdraw"; // or "instant_withdraw" depending on your contract
      }

      const txHash = await createTransaction(functionName, amount);

      if (!txHash) {
        throw new Error("Transaction failed");
      }

      // Transaction successful
      setLastTransaction({ txHash, success: true });
      setLoadingMessage(
        `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} successful`
      );

      fetchBalances();
      loadUnclaimedWithdrawals(); // Refresh unclaimed withdrawals
    } catch (error) {
      console.error(`Error ${activeTab}ing:`, error);
      setTransactionRejected(true);
      setLoadingMessage("Transaction was rejected");
      updateError(
        "transaction",
        error instanceof Error ? error.message : "Transaction failed"
      );
    } finally {
      updateLoading("transaction", false);
    }
  }, [
    account,
    activeTab,
    amounts,
    createTransaction,
    fetchBalances,
    loadUnclaimedWithdrawals,
    updateLoading,
    updateError,
  ]);

  // Modal close handler (similar to OpenTrove)
  const handleClose = () => {
    setLoadingModalVisible(false);
    setIsModalVisible(false);
    setTransactionRejected(false);
    setShowCloseButton(false);

    // Reset amounts state
    setAmounts((prev) => ({ ...prev, [activeTab]: "" }));

    // NEW: Clear validation error
    setAmountValidationError(null);

    // Reset transaction state
    setLastTransaction({ txHash: null, success: false });
    setReceiveAmount(0);
  };

  // Update modal visibility based on transaction state
  useEffect(() => {
    if (loading.transaction && !isModalVisible) {
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);
    } else if (lastTransaction.success) {
      setLoadingMessage(
        `${
          activeTab === "stake" || activeTab === "withdraw"
            ? `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
            : "Withdraw request"
        } successful`
      );
      setLoadingModalVisible(true);
    } else if (transactionRejected) {
      setLoadingMessage("Transaction was rejected");
      setLoadingModalVisible(true);
    }
  }, [
    lastTransaction.success,
    loading.transaction,
    transactionRejected,
    isModalVisible,
    activeTab,
  ]);

  // Show close button after 3 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCloseButton(true);
    }, 180000);
    return () => clearTimeout(timer);
  }, []);

  // Hide modal when hash is available
  useEffect(() => {
    if (lastTransaction.txHash) {
      setIsModalVisible(false);
    }
  }, [lastTransaction.txHash]);

  // Effects
  useEffect(() => {
    fetchBalances();
    calculateApy();
  }, [fetchBalances, calculateApy]);

  // NEW: Load unclaimed withdrawals when account changes or withdraw tab is selected
  useEffect(() => {
    if (activeTab === "withdraw") {
      loadUnclaimedWithdrawals();
    }
  }, [activeTab, loadUnclaimedWithdrawals]);

  // Update the useEffect to call both functions
  useEffect(() => {
    calculateUnitExchangeRate();
    calculatePortfolioConversionRate();
  }, [calculateUnitExchangeRate, calculatePortfolioConversionRate]);

  useEffect(() => {
    if (debouncedAmount && activeTab !== "withdraw") {
      calculateReceiveAmount(debouncedAmount);
    } else {
      setReceiveAmount(0);
    }
  }, [debouncedAmount, calculateReceiveAmount, activeTab]);

  // NEW: Clear validation error when switching tabs
  useEffect(() => {
    setAmountValidationError(null);
  }, [activeTab]);

  // Current values based on active tab
  const currentAmount = amounts[activeTab];
  const getCurrentBalance = () => {
    if (activeTab === "stake") return balances.SUPRA;
    if (activeTab === "unstake" || activeTab === "withdraw")
      return balances.stSUPRA;
    return 0;
  };

  const getReceiveToken = () => {
    if (activeTab === "stake") return "stSUPRA";
    if (activeTab === "unstake" || activeTab === "withdraw") return "SUPRA";
    return "SUPRA";
  };

  const getInputToken = () => {
    if (activeTab === "stake") return "SUPRA";
    if (activeTab === "unstake" || activeTab === "withdraw") return "stSUPRA";
    return "SUPRA";
  };

  const currentBalance = getCurrentBalance();
  const receiveToken = getReceiveToken();
  const inputToken = getInputToken();
  const shortenedHash = lastTransaction.txHash
    ? `${lastTransaction.txHash.slice(0, 6)}...${lastTransaction.txHash.slice(
        -4
      )}`
    : "";

  // NEW: Check if transaction button should be disabled
  const isTransactionDisabled = () => {
    const baseConditions =
      loading.balances ||
      loading.transaction ||
      !currentAmount ||
      parseFloat(currentAmount) <= 0 ||
      !account ||
      isModalVisible ||
      loadingModalVisible;

    // Additional validation for stake/unstake tabs
    if (activeTab === "stake" || activeTab === "unstake") {
      return (
        baseConditions ||
        amountValidationError !== null ||
        parseFloat(currentAmount) > currentBalance
      );
    }

    return baseConditions;
  };

  return (
    <div className="bg-black min-h-screen p-2 lg:p-4">
      <div className="max-w-3xl mx-auto space-y-7">
        <div>
          {/* Top Stats Card */}
          <div className="bg-black p-6 mb-4 border border-gray-800 rounded-lg">
            <div className="grid grid-cols-2 gap-0">
              <div className="pr-6 border-r border-gray-700">
                <h3 className="text-gray-400 text-sm mb-2">Your Portfolio</h3>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <Image
                      src={stSUPRA}
                      alt="stSUPRA"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {balances.stSUPRA.toFixed(2)}
                      </span>
                      <span className="text-gray-400">stSUPRA</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      ~{" "}
                      {(balances.stSUPRA * portfolioConversionRate).toFixed(2)}{" "}
                      SUPRA
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
                        className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                          apyTimePeriod === period.value
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
                  {apy > "0.00" ? Number(apy).toFixed(2) : "-"} {apy > "0.00" ? "%" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Staking Card */}
          <div className="bg-black overflow-hidden border border-gray-800 rounded-lg">
            {/* Tab Selector */}
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex-1 py-4 text-center font-semibold transition-all duration-300 ${
                    activeTab === tab.value
                      ? "bg-[#1DBDAF] text-black"
                      : "bg-black text-gray-400 hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "withdraw" ? (
                <div className="space-y-6">
                  {/* NEW: Informational message for withdraw tab */}
                  <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg flex ">
                    <p className="text-blue-400 text-sm">
                      Please wait 3-5 minutes after unstaking for your
                      transaction to appear below.
                    </p>
                  </div>

                  {/* Loading State - Only show skeleton when loading AND no data exists */}
                  {loading.unclaimedWithdrawals && !unclaimedWithdrawals && (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton
                          key={i}
                          className="w-full h-24 bg-gray-900 rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Error State */}
                  {errors.unclaimedWithdrawals && (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <p className="text-red-400 text-sm">
                        {errors.unclaimedWithdrawals}
                      </p>
                    </div>
                  )}

                  {/* No Data State */}
                  {!loading.unclaimedWithdrawals &&
                    !errors.unclaimedWithdrawals &&
                    !unclaimedWithdrawals && (
                      <div className="p-8 text-center text-gray-400">
                        <p>No withdrawal requests found</p>
                        <p className="text-sm mt-2">
                          Your withdrawal requests will appear here when you
                          unstake
                        </p>
                      </div>
                    )}

                  {/* Withdraw Content - Show even when loading if data exists */}
                  {unclaimedWithdrawals && (
                    <div className="space-y-6">
                      {/* Loading indicator when refreshing data */}
                      {loading.unclaimedWithdrawals && (
                        <div className="flex items-center justify-center p-2">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-teal-400 rounded-full animate-spin"></div>
                            <span>Refreshing...</span>
                          </div>
                        </div>
                      )}

                      {/* Ready to Claim Section */}
                      {getClaimableWithdrawals.length > 0 && (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg">
                          {/* Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-white text-lg font-semibold">
                              Ready to Claim
                            </h3>
                            <button
                              onClick={handleManualRefresh}
                              disabled={loading.unclaimedWithdrawals}
                              className="px-3 py-1 text-sm bg-gray-900 text-gray-300 rounded hover:bg-gray-900 disabled:opacity-50"
                            >
                              {loading.unclaimedWithdrawals
                                ? "Loading..."
                                : "Refresh"}
                            </button>
                          </div>

                          <div className="p-4">
                            {/* Total Amount Display */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={SUPRA}
                                  alt="SUPRA"
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                                <span className="text-white font-semibold text-lg">
                                  {getClaimableWithdrawals
                                    .reduce((total, w) => {
                                      const amount =
                                        typeof w.stSupraAmount === "string"
                                          ? parseFloat(w.stSupraAmount)
                                          : w.stSupraAmount;
                                      return (
                                        total + (isNaN(amount) ? 0 : amount)
                                      );
                                    }, 0)
                                    .toFixed(2)}{" "}
                                  SUPRA
                                </span>
                                <span className="px-2 py-1 text-xs bg-[#1DBDAF] text-white rounded-full">
                                  Ready
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setShowWithdrawalDetails(
                                    !showWithdrawalDetails
                                  )
                                }
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                              >
                                <span className="text-sm">
                                  {showWithdrawalDetails ? "Hide" : "Show"}{" "}
                                  Details
                                </span>
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    showWithdrawalDetails ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Detailed Withdrawal List */}
                            {showWithdrawalDetails && (
                              <div className="mb-6">
                                {/* Table Header */}
                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-400">
                                  <div>Amount</div>
                                  <div>Timestamp</div>
                                </div>

                                {/* Withdrawal Items */}
                                <div className="space-y-3">
                                  {getClaimableWithdrawals.map((withdrawal) => (
                                    <div
                                      key={withdrawal.txHash}
                                      className="grid grid-cols-2 gap-4 py-3 border-b border-gray-700 last:border-b-0"
                                    >
                                      <div className="text-white font-medium">
                                        {safeFormatNumber(
                                          withdrawal.stSupraAmount,
                                          2
                                        )}{" "}
                                        SUPRA
                                      </div>
                                      <div className="text-gray-400 text-sm">
                                        {formatDate(withdrawal.timestamp)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Withdraw All Button */}
                            <button
                              onClick={handleClaimWithdrawal}
                              disabled={loading.transaction}
                              className="w-full py-3 bg-teal-400 text-black font-semibold rounded-lg hover:bg-teal-300 transition-colors duration-200 disabled:opacity-50"
                            >
                              {loading.transaction
                                ? "Processing..."
                                : "WITHDRAW ALL"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* In Process Section */}
                      {getPendingWithdrawals.length > 0 && (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg">
                          {/* Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-white text-lg font-semibold">
                              In Process
                            </h3>
                          </div>

                          <div className="p-4">
                            {/* Total Amount Display */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={SUPRA}
                                  alt="SUPRA"
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                                <span className="text-white font-semibold text-lg">
                                  {getPendingWithdrawals
                                    .reduce((total, w) => {
                                      const amount =
                                        typeof w.stSupraAmount === "string"
                                          ? parseFloat(w.stSupraAmount)
                                          : w.stSupraAmount;
                                      return (
                                        total + (isNaN(amount) ? 0 : amount)
                                      );
                                    }, 0)
                                    .toFixed(2)}{" "}
                                  SUPRA
                                </span>
                                <span className="px-2 py-1 text-xs bg-[#FDC238] text-black rounded-full">
                                  In Process
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setShowPendingDetails(!showPendingDetails)
                                }
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                              >
                                <span className="text-sm">
                                  {showPendingDetails ? "Hide" : "Show"} Details
                                </span>
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    showPendingDetails ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Detailed Pending List */}
                            {showPendingDetails && (
                              <div className="mb-6">
                                {/* Table Header */}
                                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-400">
                                  <div>Amount</div>
                                  <div>Timestamp</div>
                                  <div>Available in</div>
                                </div>

                                {/* Pending Items with Real-time Countdown */}
                                <div className="space-y-3">
                                  {getPendingWithdrawals.map((withdrawal) => {
                                    const countdown = calculateCountdown(
                                      withdrawal.timestamp
                                    );

                                    return (
                                      <div
                                        key={withdrawal.txHash}
                                        className="grid grid-cols-3 gap-4 py-3 border-b border-gray-700 last:border-b-0"
                                      >
                                        <div className="text-white font-medium">
                                          {safeFormatNumber(
                                            withdrawal.stSupraAmount,
                                            2
                                          )}{" "}
                                          SUPRA
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                          {formatDate(withdrawal.timestamp)}
                                        </div>
                                        <div className="text-gray-400 text-sm font-mono font-bold">
                                          {countdown.timeRemaining > 0
                                            ? countdown.formatted
                                            : "Ready"}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Withdrawal History Section */}
                      {getClaimedWithdrawals.length > 0 && (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg">
                          {/* Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-white text-lg font-semibold">
                              Withdrawal History
                            </h3>
                            <button
                              onClick={() => setShowHistory(!showHistory)}
                              className="px-3 py-1 text-sm bg-gray-900 text-gray-300 rounded hover:bg-gray-900 transition-colors"
                            >
                              {showHistory ? "Hide" : "Show"} History (
                              {getClaimedWithdrawals.length})
                            </button>
                          </div>

                          {showHistory && (
                            <div className="p-4">
                              {/* Table Header */}
                              <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-400">
                                <div>Amount</div>
                                <div>Timestamp</div>
                                <div></div>
                              </div>

                              {/* History Items */}
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {getClaimedWithdrawals.map((withdrawal) => (
                                  <div
                                    key={withdrawal.txHash}
                                    className="grid grid-cols-3 gap-4 py-3 border-b border-gray-700 last:border-b-0"
                                  >
                                    <div className="text-white font-medium">
                                      {safeFormatNumber(
                                        withdrawal.stSupraAmount,
                                        2
                                      )}{" "}
                                      SUPRA
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                      {formatDate(withdrawal.timestamp)}
                                    </div>
                                    <div className="flex justify-end">
                                      <span className="px-2 py-1 text-xs bg-[#0BC154] text-white rounded-full">
                                        Claimed
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty State for no withdrawals */}
                      {getClaimableWithdrawals.length === 0 &&
                        getPendingWithdrawals.length === 0 &&
                        getClaimedWithdrawals.length === 0 && (
                          <div className="p-8 text-center text-gray-400">
                            <p>No withdrawal requests found</p>
                            <p className="text-sm mt-2">
                              Unstake your stSUPRA tokens to create withdrawal
                              requests
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                /* Original Stake/Unstake Content with validation */
                <>
                  {/* Amount Input */}
                  <div className="mb-6">
                    <div className="flex items-center bg-black rounded-lg border border-gray-700 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 bg-black border-r border-gray-700">
                        <div className="relative w-9 h-9">
                          <Image
                            src={activeTab === "stake" ? SUPRA : stSUPRA}
                            alt="token"
                            width={36}
                            height={36}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-white font-medium">
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

                    {/* NEW: Validation Error Message */}
                    {amountValidationError && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                        {amountValidationError}
                      </div>
                    )}
                  </div>

                  {/* Wallet Balance and Percentage Buttons */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-gray-400 text-sm mb-2">
                        Wallet Balance
                      </h3>
                      <div className="text-white text-lg font-medium">
                        {loading.balances ? (
                          <Skeleton className="w-20 h-6 bg-gray-900 rounded-md animate-pulse" />
                        ) : (
                          <>
                            {currentBalance.toFixed(2)} {inputToken}
                          </>
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

                  {/* You will receive */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-400 text-sm">You will receive</h3>
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9">
                        <Image
                          src={activeTab === "stake" ? stSUPRA : SUPRA}
                          alt="receive"
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                      </div>
                      {loading.receiveAmount ? (
                        <Skeleton className="w-24 h-8 bg-gray-900 rounded-md animate-pulse" />
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-white">
                            {receiveAmount > 0
                              ? (
                                  Math.floor(receiveAmount * 10000) / 10000
                                ).toFixed(4)
                              : "0.0000"}
                          </span>
                          <span className="text-gray-400 text-lg">
                            {receiveToken}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  <div className="border-t border-gray-800 pt-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                          <Image
                            src={stSUPRA}
                            alt="from"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-gray-400">
                          1 stSUPRA equals to
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                          <Image
                            src={SUPRA}
                            alt="to"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-white font-medium">
                          {Math.floor(unitExchangeRate * 10000) / 10000} SUPRA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    className="w-full py-4 bg-teal-400 text-black font-bold text-lg rounded-lg hover:bg-teal-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleTransaction}
                    disabled={isTransactionDisabled()}
                  >
                    {loading.transaction
                      ? "Processing..."
                      : loading.balances
                      ? "Loading..."
                      : !account
                      ? "Connect Wallet"
                      : isModalVisible
                      ? `${
                          activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                        }ing...`
                      : amountValidationError
                      ? `Minimum ${MINIMUM_AMOUNT} ${inputToken}`
                      : activeTab.toUpperCase()}
                  </button>

                  {activeTab === "unstake" && (
                    <div className="flex justify-center items-center bg-[#2B2B2B]/60 rounded-lg border border-gray-700 overflow-hidden w-full h-full mt-5 py-5 px-5 sm:px-2">
                      <span className="text-white font-normal text-sm">
                        Unstake requests are claimable after 48 hours. Track
                        them in the Withdraw tab.
                      </span>
                    </div>
                  )}

                  {/* Transaction Status */}
                  {errors.transaction && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <p className="text-red-400 text-sm">
                        Error: {errors.transaction}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-black p-6 mb-4 border border-gray-800 rounded-lg flex flex-col gap-3">
          <div className="flex w-full justify-between items-center">
            <span className="text-[#D8FDFA] font-normal text-base">
              Total SUPRA Locked
            </span>
            <span className="text-[#D8FDFA] font-medium text-base">
              {stakedSUPRA}
            </span>
          </div>
          <div className="flex w-full justify-between items-center">
            <span className="text-[#D8FDFA] font-normal text-base">
              stSUPRA Supply
            </span>
            <span className="text-[#D8FDFA] font-medium text-base">
              {stSUPRASupply}
            </span>
          </div>
        </div>
      </div>

      {/* Loading/Success Modal (similar to OpenTrove) */}
      <Dialog
        visible={loadingModalVisible}
        onHide={() => setLoadingModalVisible(false)}
        closable={false}
      >
        <div className="dialog-overlay flex items-center justify-center h-full">
          <div
            className="dialog-content w-[90%] max-w-[380px] bg-black p-6 flex flex-col justify-around border border-gray-400"
            style={{ height: "600px" }}
          >
            <div className="p-5">
              {loadingMessage === "Waiting for transaction to confirm.." ||
              loadingMessage ===
                "Waiting for claim transaction to confirm.." ? (
                <>
                  <Image
                    src={conf || "/placeholder.svg"}
                    alt="loading"
                    width={150}
                    className="flex justify-center items-center w-full"
                  />
                  <div className="my-5 ml-[6rem] mt-12"></div>
                  <div className="waiting-message font-poppins font-bold text-[white]">
                    {loadingMessage}
                  </div>
                </>
              ) : loadingMessage.includes("successful") ||
                loadingMessage === "Claim successful" ? (
                <>
                  <Image
                    src={tick || "/placeholder.svg"}
                    alt="success"
                    width={150}
                    className="flex justify-center items-center w-full"
                  />
                  <div className="waiting-message font-poppins font-bold text-[white]">
                    {loadingMessage}
                  </div>
                  <div className="text-black w-full mt-4 bg-[#222222] flex text-sm flex-col p-4 space-y-2">
                    {loadingMessage === "Claim successful" ? (
                      // CLAIM SUCCESS MODAL
                      <>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            Withdrawals claimed:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {getClaimableWithdrawals.length || 1}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            You received:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {withdrawalBeingProcessed?.amount?.toFixed(2) ||
                              "0.00"}{" "}
                            SUPRA
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            Transaction hash:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[white] font-medium text-sm">
                              {shortenedHash}
                            </span>
                            <Link
                              href={`https://suprascan.io/tx/${lastTransaction.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                src={arrow || "/placeholder.svg"}
                                alt="external link"
                                className="h-4 cursor-pointer"
                              />
                            </Link>
                          </div>
                        </div>
                      </>
                    ) : activeTab === "stake" ? (
                      // STAKE SUCCESS MODAL
                      <>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            You staked:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {amounts[activeTab]} {inputToken}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            You received:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {receiveAmount.toFixed(2)} {receiveToken}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            Transaction hash:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[white] font-medium text-sm">
                              {shortenedHash}
                            </span>
                            <Link
                              href={`https://suprascan.io/tx/${lastTransaction.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                src={arrow || "/placeholder.svg"}
                                alt="external link"
                                className="h-4 cursor-pointer"
                              />
                            </Link>
                          </div>
                        </div>
                      </>
                    ) : activeTab === "unstake" ? (
                      // UNSTAKE SUCCESS MODAL - Updated for 2 days
                      <>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            You unstaked:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {amounts[activeTab]} {inputToken}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            Available to claim:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            After 2 days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            Transaction hash:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[white] font-medium text-sm">
                              {shortenedHash}
                            </span>
                            <Link
                              href={`https://suprascan.io/tx/${lastTransaction.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                src={arrow || "/placeholder.svg"}
                                alt="external link"
                                className="h-4 cursor-pointer"
                              />
                            </Link>
                          </div>
                        </div>
                      </>
                    ) : (
                      // WITHDRAW SUCCESS MODAL (if you have instant withdraw)
                      <>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            You received:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {getClaimableWithdrawals
                              .reduce((total, w) => {
                                const amount =
                                  typeof w.stSupraAmount === "string"
                                    ? parseFloat(w.stSupraAmount)
                                    : w.stSupraAmount;
                                return total + (isNaN(amount) ? 0 : amount);
                              }, 0)
                              .toFixed(2)}{" "}
                            {receiveToken}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            Transaction hash:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[white] font-medium text-sm">
                              {shortenedHash}
                            </span>
                            <Link
                              href={`https://suprascan.io/tx/${lastTransaction.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                src={arrow || "/placeholder.svg"}
                                alt="external link"
                                className="h-4 cursor-pointer"
                              />
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : transactionRejected ? (
                <>
                  <Image
                    src={rej || "/placeholder.svg"}
                    alt="rejected"
                    width={150}
                    className="flex justify-center items-center w-full"
                  />
                  <div className="waiting-message font-poppins font-bold text-[white] w-full flex justify-center items-center">
                    {loadingMessage}
                  </div>
                </>
              ) : (
                <Image
                  src={conf || "/placeholder.svg"}
                  alt="loading"
                  width={150}
                  className="flex justify-center items-center w-full"
                />
              )}

              {(lastTransaction.success ||
                loadingMessage === "Claim successful") && (
                <button
                  className="mt-[8px] p-3 w-full text-black font-poppins font-bold hover:bg-[#2b4e51] bg-[#1DBDAF]"
                  onClick={handleClose}
                >
                  Close
                </button>
              )}
              {(transactionRejected ||
                (!lastTransaction.success && showCloseButton)) && (
                <>
                  <p className="font-poppins text-[white] text-xs mt-2 mb-4 flex justify-center items-center w-full">
                    {transactionRejected
                      ? "Transaction was rejected. Please try again."
                      : ""}
                  </p>
                  <Button
                    className="mt-0.5 ml-7 hover:bg-[#2b4e51] font-bold rounded-none md:w-[14rem] text-black font-poppins bg-[#1dbdaf]"
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
