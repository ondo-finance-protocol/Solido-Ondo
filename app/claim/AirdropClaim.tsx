"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@/context/WalletContext";
import { useAirdropClaim } from "@/hooks/useAirdropClaim";
import airdropData from "@/data/airdrop-data.json";
import supraCoins from "@/app/assets/supra-coins-1.png";
import tick from "@/app/assets/images/Done_Solido.gif";
import rej from "@/app/assets/images/TxnError.gif";
import arrow from "@/app/assets/arrow.svg";

interface AirdropClaimProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function getProofForAddress(inputAddress: string) {
  // Normalize to lowercase and ensure starts with 0x
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

export default function AirdropClaim({ isOpen, onClose, onSuccess }: AirdropClaimProps) {
  const { account } = useWallet();
  const [eligibleAmount, setEligibleAmount] = useState<number | null>(null);

  // ✅ Safely access the Supra provider (browser only)
  const supraProvider: any =
    typeof window !== "undefined" ? (window as any)?.starkey?.supra : null;

  // ✅ Hook for claim logic
  const { isLoading, isSuccess, isError, hash, errorMessage, claimAirdrop, reset } =
    useAirdropClaim(account, supraProvider);

  // ✅ Check eligibility
  useEffect(() => {
    if (account) {
      const result = getProofForAddress(account);
      if (result.success && result.data) {
        setEligibleAmount(result.data.amount / 100000000);
      } else {
        setEligibleAmount(null);
      }
    } else {
      setEligibleAmount(null);
    }
  }, [account]);

  const handleClaim = async () => {
    if (!account) {
      alert("⚠️ Please connect your wallet first");
      return;
    }
    await claimAirdrop(account);
  };

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative w-[320px] md:w-[380px] bg-black text-white shadow-lg p-10 border border-gray-700 ">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* ---- NORMAL STATE ---- */}
        {!isSuccess && !isError && (
          <>
            <div className="flex justify-center mb-4">
              <Image src={supraCoins} alt="SUPRA Coins" width={200} height={200} />
            </div>

            <h2 className="text-center text-2xl font-semibold mb-2">
              {eligibleAmount ? (
                <>
                  You've earned{" "}
                  <span>{eligibleAmount.toFixed(2)} SUPRA!</span>
                </>
              ) : (
                "Not eligible for this Airdrop."
              )}
            </h2>

            {eligibleAmount && (
              <p className="text-center text-gray-300 text-sm mb-6">
                Click below to transfer your earnings to your wallet.
              </p>
            )}

            {eligibleAmount !== null && eligibleAmount > 0 && (
              <button
                onClick={handleClaim}
                disabled={isLoading}
                className="w-full bg-[#00C0AF] text-black font-semibold py-3 border-2 border-[#00C0AF] hover:bg-transparent hover:text-[#00C0AF] transition-colors disabled:bg-gray-500 disabled:border-gray-500"
              >
                {isLoading ? "Claiming..." : "Claim Now"}
              </button>
            )}
          </>
        )}

        {/* ---- SUCCESS STATE ---- */}
        {isSuccess && hash && (
          <div className="flex flex-col items-center justify-center text-left mt-2">
            <Image src={tick} alt="Claim Success" width={205} height={208} />
            <h3 className="text-xl font-semibold mt-4 text-white">
              Claim Successful!
            </h3>

            {/* Info Box */}
            <div className="w-full bg-[#222222] p-4 mt-4 text-left">
              <p className="text-sm text-gray-300 mb-2">
                You claimed:{" "}
                <span className="text-white font-bold">
                  {eligibleAmount?.toFixed(2)} SUPRA
                </span>
              </p>
              <p className="text-sm text-gray-300 flex items-center">
                Transaction hash:&nbsp;
                <a
                  href={`https://suprascan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center underline text-gray-300 cursor-pointer"
                >
                  {hash.slice(0, 6)}...{hash.slice(-4)}
                  <Image
                    src={arrow}
                    alt="arrow"
                    className="h-4 w-4 ml-1"
                  />
                </a>
              </p>
            </div>

            <button
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              className="mt-6 w-full py-3 bg-[#00C0AF] text-black font-semibold hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        )
        }

        {/* ---- ERROR STATE ---- */}
        {
          isError && (
            <div className="flex flex-col items-center justify-center text-center mt-2">
              <Image src={rej} alt="Claim Failed" width={100} height={100} />
              <h4 className="text-lg font-semibold mt-4 text-white">
                {errorMessage || "Something went wrong."}
              </h4>
              <button
                onClick={onClose}
                className="mt-6 w-full py-3 bg-[#00C0AF] text-black font-semibold hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          )
        }
      </div >
    </div >
  );
}
