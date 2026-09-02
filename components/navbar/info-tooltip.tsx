import type React from "react";
import Image from "next/image";
import info from "@/app/assets/images/info.svg";

interface InfoTooltipProps {
  content: React.ReactNode;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <div className="tooltip-container relative -mt-1">
      <Image
        className="toolTipHolding4 font-poppins font-medium"
        src={info || "/placeholder.svg"}
        alt="info"
        width={16}
        height={16}
      />
      <div className="absolute z-10 hidden tooltip-content">{content}</div>
    </div>
  );
}
