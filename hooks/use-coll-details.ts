import { useWallet } from "@/context/WalletContext";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Create a shared axios instance with better configuration
const api = axios.create({
  baseURL: "https://api.solido.money",
  timeout: 15000, // Increased timeout to 15 seconds
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  data: any;
  timestamp: number;
}

const cache: CacheData = {
  data: null,
  timestamp: 0,
};

interface TokenMetrics {
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
  pauseFunctionResponses: {
    open_trove: boolean;
    borrow: boolean;
    deposit: boolean;
    redeem: boolean;
  };
}

export const useCollDetails = () => {
  const { account } = useWallet();
  const [state, setState] = useState({
    btcDebt: 0,
    supraDebt: 0,
    btcConfig: null as any,
    supraConfig: null as any,
    isLoading: false,
    error: null as string | null,
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const now = Date.now();

      // Check cache
      if (
        !forceRefresh &&
        cache.data &&
        now - cache.timestamp < CACHE_DURATION
      ) {
        const { btcDebt, supraDebt, btcConfig, supraConfig } = cache.data;
        setState((prev) => ({
          ...prev,
          btcDebt,
          supraDebt,
          btcConfig,
          supraConfig,
        }));
        return;
      }

      const response = await api.get("/protocol/metrics");
      const metrics = response.data?.metrics as TokenMetrics[];

      if (!metrics || !Array.isArray(metrics)) {
        throw new Error("Invalid metrics data format");
      }

      const btcMetric = metrics.find((m) => m.token === "stSUPRA");
      const supraMetric = metrics.find((m) => m.token === "SUPRA");

      if (!btcMetric || !supraMetric) {
        throw new Error("Required token metrics not found");
      }

      // Extract debt values
      const btcDebt = btcMetric.totalDebt;
      const supraDebt = supraMetric.totalDebt;

      // Create config objects
      const btcConfig = {
        minDebt: btcMetric.minDebt,
        mcr: btcMetric.MCR,
        borrowRate: btcMetric.borrowRate,
        liquidationReserve: btcMetric.liquidationReserve,
        liquidationThreshold: btcMetric.liquidationThreshold,
        maxMint: btcMetric.maxMint,
        price: btcMetric.price,
      };

      const supraConfig = {
        minDebt: supraMetric.minDebt,
        mcr: supraMetric.MCR,
        borrowRate: supraMetric.borrowRate,
        liquidationReserve: supraMetric.liquidationReserve,
        liquidationThreshold: supraMetric.liquidationThreshold,
        maxMint: supraMetric.maxMint,
        price: supraMetric.price,
      };

      // Update cache
      cache.data = { btcDebt, supraDebt, btcConfig, supraConfig };
      cache.timestamp = now;

      // Update state
      setState((prev) => ({
        ...prev,
        btcDebt,
        supraDebt,
        btcConfig,
        supraConfig,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(() => fetchData(true), CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchData]);

  const calculateMaxLtv = useCallback((config: any) => {
    if (!config) return "—";
    return ((100 / config.mcr) * 100).toFixed(0) + "%";
  }, []);

  return {
    ...state,
    calculateMaxLtv,
    refreshData: () => fetchData(true),
  };
};
