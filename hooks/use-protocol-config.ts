"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface ProtocolConfig {
  minDebt: number;
  mcr: number; // Minimum Collateralization Ratio
  borrowRate: number;
  liquidationReserve: number;
  liquidationThreshold: number;
}

interface ProtocolMetric {
  token: string;
  minDebt: number;
  MCR: number;
  borrowRate: number;
  liquidationReserve: number;
  liquidationThreshold: number;
  price: number;
  totalColl: number;
  totalDebt: number;
  pauseFunctionResponses: {
    open_trove: boolean;
    borrow: boolean;
    deposit: boolean;
    redeem: boolean;
  };
  [key: string]: any;
}

/**
 * Hook to fetch protocol configuration parameters
 * @param tokenType - The type of token to fetch config for ('SUPRA' or 'stSUPRA')
 * @returns Object containing protocol configuration and loading state
 */
export function useProtocolConfig(tokenType: "SUPRA" | "stSUPRA") {
  const [config, setConfig] = useState<ProtocolConfig>({
    minDebt: 0,
    mcr: 0,
    borrowRate: 0,
    liquidationReserve: 0,
    liquidationThreshold: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          "https://api.solido.money/protocol/metrics"
        );
        setResponse(response.data);

        if (response.data && response.data.metrics) {
          const metrics = response.data.metrics as ProtocolMetric[];

          const tokenMetric = metrics.find(
            (metric) => metric.token === tokenType
          );

          if (tokenMetric) {
            setConfig({
              minDebt: tokenMetric.minDebt,
              mcr: tokenMetric.MCR,
              borrowRate: tokenMetric.borrowRate / 100,
              liquidationReserve: tokenMetric.liquidationReserve,
              liquidationThreshold: tokenMetric.liquidationThreshold,
            });
          } else {
            throw new Error(
              `No configuration found for token type: ${tokenType}`
            );
          }
        } else {
          throw new Error("Invalid config data received");
        }
      } catch (err) {
        console.error(`Error fetching protocol config for ${tokenType}:`, err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [tokenType]);

  useEffect(() => {
    if (error) {
      console.error(`Error fetching protocol config for ${tokenType}:`, error);
    }
  }, [error, tokenType]);

  return { config, isLoading, error, response };
}
