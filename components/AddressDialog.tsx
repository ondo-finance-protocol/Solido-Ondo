"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useWallet } from "@/context/WalletContext";

export default function AddressDialog({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const { disconnectWallet } = useWallet();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="font-poppins border border-[#1dbdaf] px-3 py-1  text-[#1dbdaf] hover:bg-[#1dbdaf] hover:text-white transition"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-2 border-gray-400 shadow-lg p-6 bg-[#222222] ">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#1dbdaf]">
            Wallet Address
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between bg-[#2F2F2F] px-4 py-2 rounded-lg">
          <p className="text-sm font-mono text-black truncate w-full">
            {address.slice(0, 10)}...{address.slice(-10)}
          </p>
          <Button
            size="icon"
            variant="ghost"
            onClick={copyToClipboard}
            className="hover:bg-gray-200"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-gray-500" />
            )}
          </Button>
        </div>
        {copied && (
          <p className="text-xs text-green-600 text-center mt-2">
            Copied to clipboard!
          </p>
        )}
        <Button
          onClick={disconnectWallet}
          className="mt-4 w-full bg-[#1dbdaf] text-black hover:bg-[#2b4e51] transition"
        >
          Disconnect Wallet
        </Button>
      </DialogContent>
    </Dialog>
  );
}
