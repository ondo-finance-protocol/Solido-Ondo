import type React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "./info-tooltip";
import { formatLargeNumber } from "../getActualDecimal";

interface StatCardProps {
  icon: string | any;
  label: string;
  value: string;
  value2?: string;
  prefix?: string;
  suffix?: string;
  isLoading?: boolean;
  tooltipContent?: React.ReactNode;
}

export function StatCard({
  icon,
  label,
  value,
  value2,
  prefix = "",
  suffix = "",
  isLoading = false,
  tooltipContent,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-x-2 ">
      <Image
        src={icon || "/placeholder.svg"}
        alt={label}
        width={40}
        height={40}
        className="hidden md:flex"
      />
      <div className="flex  md:hidden">
        <Image
          src={icon || "/placeholder.svg"}
          alt={label}
          width={40}
          height={40}
        />
      </div>
      <div>
        <div className="flex gap-1 items-center">
          <h1 className="text-white font-poppins font-medium md:text-sm text-xs">
            {label}
          </h1>
          {tooltipContent && <InfoTooltip content={tooltipContent} />}
        </div>
        <h1 className="md:text-sm text-xs text-gray-400 font-poppins font-medium whitespace-nowrap">
          {isLoading ? (
            <Skeleton className="w-16 h-4 bg-gray-300 rounded-md animate-pulse" />
          ) : (
            <>
              {suffix}
              {value}
            </>
          )}
        </h1>
      </div>
    </div>
  );
}
