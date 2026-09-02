import React, { useState, useEffect } from "react";
import "../app/App.css";
import { Button } from "@/components/ui/button";
import { useWallet } from "../context/WalletContext";

const NetworkChecker = () => {
  let supraProvider: any =
    typeof window !== "undefined" && (window as any)?.starkey?.supra;
  const [chainId, setChainId] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const { account } = useWallet();

  const REQUIRED_CHAIN_ID = "8";

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.starkey?.supra && account) {
        try {
          const response = await supraProvider.getChainId();
          // Extract chainId from response and ensure it's a string
          const currentChainId =
            response.chainId?.toString() || response?.toString();
          setChainId(currentChainId);
          // Use strict equality after converting to string
          setIsWrongNetwork(currentChainId !== REQUIRED_CHAIN_ID);
        } catch (error) {
          console.error("Error checking network:", error);
        }
      }
    };

    checkNetwork();
  }, [account]);

  const switchNetwork = async () => {
    if (window.starkey?.supra) {
      try {
        await supraProvider.changeNetwork({
          chainId: REQUIRED_CHAIN_ID,
        });

        const response = await supraProvider.getChainId();
        const newChainId = response.chainId?.toString() || response?.toString();

        setChainId(newChainId);
        setIsWrongNetwork(newChainId !== REQUIRED_CHAIN_ID);
      } catch (error) {
        console.error("Error switching network:", error);
      }
    }
  };

  // Only render if account exists AND we're on the wrong network
  if (!account || !isWrongNetwork) return null;

  return (
    <Button
      variant="outline"
      onClick={switchNetwork}
      className="title-text2 ml-4 bg-white hover:bg-gray-100"
    >
      Switch to SUPRA Network
    </Button>
  );
};

export default NetworkChecker;
