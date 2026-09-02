import { useState } from "react";
import { BCS } from "supra-l1-sdk";
import {
  supra_coin,
  stsupra_coin,
  module_address,
  module_name,
} from "@/constants/constants";

interface OpenTroveResult {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  hash: string;
  openTrove: (cash: number, collateral: number) => Promise<void>;
}

/**
 * Hook to handle opening a trove transaction
 * @param tokenType - The type of token used as collateral ('SUPRA' or 'stSUPRA')
 * @param account - User's wallet address
 * @param supraProvider - Supra wallet provider
 * @returns Object containing transaction state and openTrove function
 */
export function useOpenTrove(
  tokenType: "SUPRA" | "stSUPRA",
  account: string | undefined,
  supraProvider: any
): OpenTroveResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [hash, setHash] = useState<string>("");

  const openTrove = async (cash: number, collateral: number) => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);

    // Convert to smallest units
    cash = Math.floor(Number(cash) * 1e8);
    // Different decimal precision for different tokens
    collateral =
      tokenType === "SUPRA"
        ? Math.floor(Number(collateral) * 1e8)
        : Math.floor(Number(collateral) * 1e8);

    try {
      const provider = supraProvider;
      if (!provider) {
        throw new Error("Wallet provider not found");
      }

      // Set expiration time for raw transaction to 30 seconds
      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const optionalTransactionPayloadArgs = {
        txExpiryTime,
      };

      const rawTx = [
        account,
        0,
        module_address,
        module_name,
        "open_trove",
        tokenType === "SUPRA" ? [supra_coin] : [stsupra_coin],
        [BCS.bcsSerializeUint64(collateral), BCS.bcsSerializeUint64(cash)],
        optionalTransactionPayloadArgs,
      ];

      // Create raw transaction data
      const data = await provider.createRawTransactionData(rawTx);
      if (!data) {
        throw new Error("Failed to create raw transaction data");
      }

      // Send transaction
      const params = {
        data: data,
        from: account,
        to: module_address,
        chainId: 8,
        value: "",
      };

      const txHash = await provider.sendTransaction(params);

      if (!txHash) {
        throw new Error("Transaction failed");
      }

      setHash(txHash);
      setIsSuccess(true);

      // Store wallet address in API if transaction is successful
    } catch (err) {
      console.error("Error in openTrove:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, isSuccess, isError, hash, openTrove };
}
