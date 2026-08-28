"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface MetricsResponse {
  status: string;
  success: boolean;
  metrics: {
    token: string;
    price: number;
    totalColl: number;
    totalDebt: number;
    [key: string]: any;
  }[];
  [key: string]: any;
}

/**
 * Hook to fetch token price from the protocol
 * @param tokenType - The type of token to fetch price for ('SUPRA' or 'stSUPRA')
 * @returns Object containing price data, loading state, error, and a refetch function
 */
export function useTokenPrice(tokenType: "SUPRA" | "stSUPRA" | undefined) {
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!tokenType) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<MetricsResponse>(
        "https://api.solido.money/protocol/metrics"
      );

      if (response.data && response.data.success) {
        const metrics = response.data.metrics || [];
        let fetchedPrice = 0;

        // Find the matching token in metrics array
        const tokenData = metrics.find((metric) => metric.token === tokenType);

        if (tokenData && typeof tokenData.price === "number") {
          fetchedPrice = tokenData.price;
          setPrice(fetchedPrice);
        } else {
          throw new Error(`Price data for ${tokenType} not found`);
        }
      } else {
        throw new Error("Invalid response from metrics API");
      }
    } catch (err) {
      console.error(`Error fetching ${tokenType} price:`, err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, [tokenType]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        await fetchPrice();
      } catch (err) {
        if (isMounted) {
          console.error(`Error in useEffect:`, err);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fetchPrice]);

  return { price, isLoading, error, refetch: fetchPrice };
}
