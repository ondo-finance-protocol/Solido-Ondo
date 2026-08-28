"use client";

import { useState, useEffect } from "react";
import { SupraClient, HexString } from "supra-l1-sdk";
import { supra_coin, stsupra_coin } from "@/constants/constants";

export function useBalance(
  tokenType: "SUPRA" | "stSUPRA" | undefined,
  account: string | undefined
) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!account || account === "undefined") {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supraClient = new SupraClient("https://rpc-mainnet.supra.com/");

        const coinType =
          tokenType === "SUPRA"
            ? supra_coin
            : tokenType === "stSUPRA"
            ? stsupra_coin   // ✅ now using stsupra_coin
            : undefined;

        if (!coinType) return;

        let rawBalance: bigint;

        try {
          rawBalance = await supraClient.getAccountCoinBalance(
            HexString.ensure(account),
            coinType
          );
        } catch (err: any) {
          if (err?.message?.includes("Resource not found")) {
            rawBalance = 0n;
          } else {
            throw err;
          }
        }
        
        const convertedBalance = Number(rawBalance.toString()) / 1e8;

        if (isMounted) setBalance(convertedBalance);
      } catch (err) {
        console.error(`Error fetching ${tokenType} balance:`, err);
        if (isMounted)
          setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, [account, tokenType]);

  return { balance, isLoading, error };
}
