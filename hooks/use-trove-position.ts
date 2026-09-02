/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback } from "react";
import axios, { type AxiosError } from "axios";
import {
  supra_coin,
  module_address,
  module_name,
  stsupra_coin,
  module_address_mainnet_flow,
} from "@/constants/constants";
import { useWallet } from "@/context/WalletContext";

interface TrovePositions {
  supraSupply: number;
  supraTroveStatus: boolean;
  stSupraSupply: number;
  stSupraTroveStatus: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// API client with default config
const api = axios.create({
  baseURL: "https://rpc-mainnet.supra.com/rpc/v1",
  // timeout: 10000,
});

export function useTrovePositions(): TrovePositions {
  const [supraSupply, setSupraSupply] = useState<number>(0);
  const [supraTroveStatus, setSupraTroveStatus] = useState<boolean>(false);
  const [stSupraSupply, setStSupraSupply] = useState<number>(0);
  const [stSupraTroveStatus, setStSupraTroveStatus] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { account } = useWallet();

  // Helper function to fetch position for Supra coin
  const fetchPosition = async (): Promise<any[]> => {
    try {
      const response = await api.post("/view", {
        function: `${module_address}::${module_name}::get_user_position`,
        type_arguments: [supra_coin],
        arguments: [account],
      });

      if (!response.data?.result) {
        throw new Error(`No data received for Supra coin`);
      }

      return response.data.result as any[];
    } catch (err) {
      // Handle specific error types
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 404) {
          throw new Error(`Position not found for Supra coin`);
        }
        if (axiosError.code === "ECONNABORTED") {
          throw new Error("Request timeout - please try again");
        }
      }
      throw err;
    }
  };

  const fetchStsupraPosition = async (): Promise<any[]> => {
    try {
      const response = await api.post("/view", {
        function: `${module_address}::${module_name}::get_user_position`,
        type_arguments: [stsupra_coin],
        arguments: [account],
      });

      if (!response.data?.result) {
        throw new Error(`No data received for stSUPRA coin`);
      }
      return response.data.result as any[];
    } catch (err) {
      // Handle specific error types
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 404) {
          throw new Error(`Position not found for stSUPRA coin`);
        }
        if (axiosError.code === "ECONNABORTED") {
          throw new Error("Request timeout - please try again");
        }
      }
      throw err;
    }
  };

  // Memoized fetch function
  const fetchPositions = useCallback(async () => {
    if (!account) {
      setError("No wallet connected");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch both SUPRA and stSUPRA positions in parallel
      const [supraResult, stSupraResult] = await Promise.allSettled([
        fetchPosition(),
        fetchStsupraPosition(),
      ]);

      // Handle SUPRA position
      if (supraResult.status === "fulfilled") {
        setSupraSupply(supraResult.value[1] / 1e8);
        setSupraTroveStatus(supraResult.value[2]);
      } else {
        console.warn("Failed to fetch SUPRA position:", supraResult.reason);
        setSupraSupply(0);
        setSupraTroveStatus(false);
      }

      // Handle stSUPRA position
      if (stSupraResult.status === "fulfilled") {
        setStSupraSupply(stSupraResult.value[1] / 1e12); // Different decimal precision for stSUPRA
        setStSupraTroveStatus(stSupraResult.value[2]);
      } else {
        console.warn("Failed to fetch stSUPRA position:", stSupraResult.reason);
        setStSupraSupply(0);
        setStSupraTroveStatus(false);
      }

      // Only set error if both requests failed
      if (
        supraResult.status === "rejected" &&
        stSupraResult.status === "rejected"
      ) {
        throw new Error("Failed to fetch any trove positions");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching position:", err);
    } finally {
      setIsLoading(false);
    }
  }, [account]); // Removed fetchPosition from dependencies

  // Initial fetch on mount or when account changes
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Expose refetch function for manual updates
  const refetch = useCallback(async () => {
    await fetchPositions();
  }, [fetchPositions]);

  return {
    supraSupply,
    supraTroveStatus,
    stSupraSupply,
    stSupraTroveStatus,
    isLoading,
    error,
    refetch,
  };
}

// Optional: Add a retry mechanism for failed requests
export function useRetryableTrovePositions(maxRetries = 3): TrovePositions {
  const [retryCount, setRetryCount] = useState(0);
  const positions = useTrovePositions();

  useEffect(() => {
    if (positions.error && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        positions.refetch();
      }, Math.min(1000 * Math.pow(2, retryCount), 10000)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [positions.error, retryCount, maxRetries, positions.refetch]);

  return positions;
}

// Hook to get position for specific token type
export function useTrovePosition(tokenType: "SUPRA" | "stSUPRA") {
  const {
    supraSupply,
    supraTroveStatus,
    stSupraSupply,
    stSupraTroveStatus,
    isLoading,
    error,
    refetch,
  } = useTrovePositions();

  if (tokenType === "SUPRA") {
    return {
      supply: supraSupply,
      troveStatus: supraTroveStatus,
      isLoading,
      error,
      refetch,
    };
  } else {
    return {
      supply: stSupraSupply,
      troveStatus: stSupraTroveStatus,
      isLoading,
      error,
      refetch,
    };
  }
}
