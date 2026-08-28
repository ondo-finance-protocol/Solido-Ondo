import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Decimal from "decimal.js";
import { useState } from "react";
import icircle from "@/app/assets/images/info.svg";
import { formatLargeNumber } from "./getActualDecimal";

interface DynamicInputProps {
  id: string;
  label: string;
  icon: any;
  symbol: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  walletBalance: number;
  dollarValue: number | string;
  dollarValueBalance?: number | string;
  maxLength?: number;
  decimals?: number;
  isLoading?: boolean;
  showPercentages?: boolean;
  infoText?: string;
  errorMessage?: string;
  isDisabled?: boolean;
  maxValue?: number;
  balanceLabel?: string;
}

export default function DynamicInput({
  id,
  label,
  icon,
  symbol,
  placeholder,
  value,
  onChange,
  walletBalance,
  dollarValue,
  dollarValueBalance,
  maxLength = 8,
  decimals = 2,
  isLoading = false,
  showPercentages = true,
  infoText = "The amount of collateral asset in your wallet address.",
  errorMessage,
  isDisabled = false,
  maxValue,
  balanceLabel = "Wallet Balance",
}: DynamicInputProps) {
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  );

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    const percentageDecimal = new Decimal(percentage).div(100);
    let balanceToUse;
    if (percentage != 100)
      balanceToUse = maxValue !== undefined ? maxValue : walletBalance;
    else {
      // When percentage is 100%, subtract 2 from the balance
      // If the result would be negative, use 0 instead
      const rawBalance = maxValue !== undefined ? maxValue : walletBalance;
      balanceToUse = Math.max(0, rawBalance - 2);
    }
    if (!isNaN(balanceToUse)) {
      const newValue = new Decimal(balanceToUse).mul(percentageDecimal);
      onChange(newValue.toFixed(decimals));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Remove leading zeros while keeping valid numbers
    newValue = newValue.replace(/^0+(?=\d)/, "");

    // Regex to allow only valid decimal numbers - don't restrict by max value
    if (/^\d*\.?\d*$/.test(newValue)) {
      // Only check max length for display purposes
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="w-full">
      <Label
        htmlFor={id}
        className="font-poppins -ml-3 md:ml-0 text-base md:text-xl text-white font-medium"
      >
        {label}
      </Label>

      <div className="flex w-full max-w-[300px] md:max-w-none items-center space-x-2 mt-2.5 -ml-3 md:ml-0 border border-gray-400 bg-black mb-4">
        <div className="flex items-center h-14">
          <Image src={icon} alt={symbol} className="ml-1" width={40} />
          <h3 className="font-poppins ml-1 font-medium text-white hidden md:block">
            {symbol}
          </h3>
          <h3 className="h-full border mx-3 text-white"></h3>
        </div>
        <input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          disabled={isDisabled}
          className="font-poppins focus:outline-none font-medium text-xs md:text-sm text-gray-400 placeholder-gray-400 whitespace-nowrap h-14 flex-grow bg-black"
        />
        <span className="md:max-w-fit md:p-2 mr-1 md:mr-0 font-medium text-sm text-gray-400 font-poppins h-full">
          {isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            `$${
              typeof dollarValue === "number"
                ? dollarValue.toFixed(2)
                : dollarValue
            }`
          )}
        </span>
      </div>

      <span className="font-poppins font-medium text-gray-400 mb-2 text-sm flex gap-2 items-center">
        {balanceLabel}{" "}
        <div className="relative group">
          <Image
            src={icircle}
            alt="info"
            className="h-[17px] cursor-pointer relative group"
          />
          <span className="absolute top-1/2 left-full transform -translate-y-1/2 w-[200px] bg-[#222222] text-[#1DBDAF] text-xs font-thin px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            {infoText}
          </span>
        </div>
      </span>

      <div className="pt-2 w-full flex md:flex-row flex-col items-center justify-between -mt-4">
        <span className="text-sm font-poppins w-full font-medium whitespace-nowrap flex flex-row">
          {isLoading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <>
              <span
                className={`font-poppins font-medium text-sm ${
                  parseFloat(value) > walletBalance
                    ? "text-red-500"
                    : "text-white"
                }`}
              >
                {formatLargeNumber(walletBalance)} {symbol}
              </span>
              <span className="text-gray-400 ml-1 font-poppins font-medium text-sm">
                $
                {typeof dollarValueBalance === "number"
                  ? formatLargeNumber(dollarValueBalance)
                  : formatLargeNumber(Number(dollarValueBalance))}
              </span>
            </>
          )}
        </span>

        {showPercentages && (
          <div className="flex flex-col md:flex-row w-full justify-end items-center -mt-1 md:ml-4">
            <div className="flex gap-x-2 md:gap-x-2 w-full md:w-auto md:justify-end mt-2">
              {/* {[25, 50, 75, 90].map((percent) => (
                <Button
                  key={percent}
                  disabled={isDisabled}
                  className="text-xs md:text-sm border bg-black font-poppins text-white border-white hover:bg-black/80 px-2 py-1"
                  onClick={() => handlePercentageClick(percent)}
                >
                  {percent}%
                </Button>
              ))} */}
              {(id !== "depositCollateral"
                ? [25, 50, 75, 90]
                : [25, 50, 75, 100]
              ).map((percent) => (
                <Button
                  key={percent}
                  disabled={isDisabled}
                  className="text-xs md:text-sm border bg-black font-poppins text-white border-white hover:bg-black/80 px-2 py-1"
                  onClick={() => handlePercentageClick(percent)}
                >
                  {percent}%
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <span className="text-red-500 font-poppins md:text-base text-xs font-medium">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
