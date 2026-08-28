"use client";

import { useWallet } from "../../context/WalletContext";
import "../../app/App.css";
import NetworkChecker from "../NetworkChecker";
import AddressDialog from "../AddressDialog";
import { Button } from "@/components/ui/button";

interface ConnectButtonProps {
  isPadding?: boolean;
}

export default function ConnectButton({
  isPadding = false,
}: ConnectButtonProps) {
  const { isInstalled, account, connectWallet } = useWallet();

  return (
    <div className={`${isPadding ? "p-0" : "p-4"} flex flex-row gap-x-4`}>
      {account && account !== "undefined" && <NetworkChecker />}
      {account && account !== "undefined" ? (
        <AddressDialog address={account} />
      ) : (
        <Button
          onClick={connectWallet}
          // disabled={!isInstalled}
          className="md:w-full w-[90%] font-poppins font-medium bg-[#1dbdaf] text-black hover:bg-[#2b4e51]"
        >
          {isInstalled ? (
            "Connect Wallet"
          ) : (
            <a
              href="https://chromewebstore.google.com/detail/starkey-wallet-the-offici/hcjhpkgbmechpabifbggldplacolbkoh"
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer"
            >
              Get StarKey
            </a>
          )}
        </Button>
      )}
    </div>
  );
}
