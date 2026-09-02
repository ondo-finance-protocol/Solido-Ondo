import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface AddressDisplayProps {
  address: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address }) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const getTruncatedAddress = (addr: string): string => {
    if (!addr) return "";
    const first = addr.slice(0, 5);
    const last = addr.slice(-5);
    return `${first}...${last}`;
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center ">
      <span className="text-white body-text ">
        {getTruncatedAddress(address)}
      </span>
      <div className="relative">
        <button
          className="p-1.5  hover:bg-[#a5bcca] transition-colors"
          onClick={handleCopy}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-[#014774]" />
          ) : (
            <Copy className="h-4 w-4 text-[#618ba6]" />
          )}
          {isHovering && !isCopied && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2  title-text2 text-white text-xs px-2 py-1 whitespace-nowrap">
              Copy address
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddressDisplay;
