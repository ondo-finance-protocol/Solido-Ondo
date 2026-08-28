// context/WalletContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { termsUtils } from "../lib/termsConfig";

declare global {
  interface Window {
    starkey?: {
      supra?: {
        balance: (
          walletAddress: string
        ) => Promise<{ formattedBalance: string }>;
        connect: () => Promise<string[]>;
        disconnect?: () => Promise<void>;
        sendTransaction?: (txPayload: any) => Promise<any>;
      };
    };
  }
}

interface WalletContextType {
  isInstalled: boolean;
  account: string;
  balance: string;
  supraProvider: any | null;  // ✅ Expose provider
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const defaultContext: WalletContextType = {
  isInstalled: false,
  account: "",
  balance: "",
  supraProvider: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const supraProvider: any =
    typeof window !== "undefined" ? window?.starkey?.supra : null;

  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [isDisconnected, setIsDisconnected] = useState<boolean>(false);

  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== "undefined" && "starkey" in window) {
        setIsInstalled(true);

        if (!isDisconnected) {
          const storedAccount =
            typeof window !== "undefined"
              ? window.localStorage?.getItem("walletAccount")
              : null;

          if (storedAccount && storedAccount !== account) {
            setAccount(storedAccount);
            fetchBalance(storedAccount);
          }
        }
      }
    };

    checkWallet();
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, [account, isDisconnected]);

  const fetchBalance = async (walletAddress: string) => {
    try {
      if (supraProvider) {
        const fetchedBalance = await supraProvider.balance(walletAddress);
        setBalance(fetchedBalance.formattedBalance);
      }
    } catch (err) {
      console.error("Balance Fetch Failed:", err);
    }
  };

  const connectWallet = async () => {
    try {
      if (supraProvider) {
        setIsDisconnected(false);
        const accounts = await supraProvider.connect();
        const connectedAccount = accounts[0];
        if (connectedAccount !== account) {
          setAccount(connectedAccount);
          window.localStorage.setItem("walletAccount", connectedAccount);
          await fetchBalance(connectedAccount);
        }
      }
    } catch (err) {
      console.error("Connection Failed:", err);
    }
  };

  const disconnectWallet = async () => {
    const previousAccount = account;
    setIsDisconnected(true);

    try {
      if (supraProvider?.disconnect) {
        await supraProvider.disconnect();
      }
    } catch (error) {
      console.warn("Failed to disconnect from StarKey wallet:", error);
    }

    setAccount("");
    setBalance("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("walletAccount");
    }

    if (previousAccount && previousAccount !== "undefined") {
      try {
        termsUtils.clearSessionCacheForAddress(previousAccount);
      } catch (error) {
        console.warn("Could not clear terms session cache:", error);
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isInstalled,
        account,
        balance,
        supraProvider, // ✅ provide this to consumers
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
