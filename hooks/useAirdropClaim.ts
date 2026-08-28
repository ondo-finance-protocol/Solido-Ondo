"use client";

import { useState } from "react";
import { BCS } from "supra-l1-sdk";
import airdropData from "@/data/airdrop-data.json";

const CONTRACT_ADDRESS =
  "0xdccd527fafcdb956a27b78b7b26bd754698f1363a18ccfe42339ed744eb6faf4";
const MODULE_NAME = "airdrop";
const FUNCTION_NAME = "claim";

interface ClaimResult {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  hash: string;
  errorMessage: string;
  claimAirdrop: (address: string) => Promise<void>;
}

function getProofForAddress(inputAddress: string) {
  let normalizedInput = inputAddress.toLowerCase();

  if (!normalizedInput.startsWith("0x")) {
    normalizedInput = `0x${normalizedInput}`;
  }

  const userData = airdropData.users.find(
    (user) => user.address.toLowerCase() === normalizedInput
  );

  if (!userData) {
    return { success: false, error: "Address not found", data: null };
  }

  return { success: true, error: null, data: userData };
}

export function useAirdropClaim(
  account: string | undefined,
  supraProvider: any
): ClaimResult & { reset: () => void } {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hash, setHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const claimAirdrop = async (address: string) => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage("");
    setHash("");

    try {
      if (!address.startsWith("0x") || address.length !== 66) {
        throw new Error("Invalid address format");
      }

      const lookupResult = getProofForAddress(address);
      if (!lookupResult.success || !lookupResult.data) {
        throw new Error(lookupResult.error || "Not eligible for airdrop");
      }

      const userAirdrop = lookupResult.data;
      if (!supraProvider) throw new Error("Wallet provider not found");
      if (!account) throw new Error("Please connect your wallet first");

      if (account.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Connected wallet does not match claiming address");
      }

      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const optionalTransactionPayloadArgs = { txExpiryTime };
      const proofBytesArray = userAirdrop.proof.map((p) =>
        Uint8Array.from(Buffer.from(p.replace(/^0x/, ""), "hex"))
      );

      const serializer = new BCS.Serializer();

      serializer.serializeU32AsUleb128(proofBytesArray.length);
      for (const proofBytes of proofBytesArray) {
        serializer.serializeBytes(proofBytes);
      }
      const serializedProofs = serializer.getBytes();

      const args = [
        BCS.bcsSerializeUint64(userAirdrop.amount),
        BCS.bcsSerializeUint64(userAirdrop.index),
        serializedProofs,
      ];

      const rawTx = [
        account,
        0,
        CONTRACT_ADDRESS,
        MODULE_NAME,
        FUNCTION_NAME,
        [],
        args,
        optionalTransactionPayloadArgs,
      ];

      const data = await supraProvider.createRawTransactionData(rawTx);
      if (!data) throw new Error("Failed to create raw transaction");

      const params = { data, from: account, to: CONTRACT_ADDRESS, chainId: 8 };
      const txHash = await supraProvider.sendTransaction(params);
      if (!txHash) throw new Error("Transaction was rejected. Please try again.");

      setHash(txHash);
      setIsSuccess(true);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
    setHash("");
    setErrorMessage("");
  };

  return { isLoading, isSuccess, isError, hash, errorMessage, claimAirdrop, reset };
}
