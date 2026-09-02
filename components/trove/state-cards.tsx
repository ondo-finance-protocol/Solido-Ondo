import Image from "next/image";
import info from "@/app/assets/icircle.svg";
import { Tooltip } from "primereact/tooltip";

interface StatsCardProps {
  label: string;
  value: string;
  suffix?: string;
  text?: string;
}

export function StatsCard({ label, value, suffix, text }: StatsCardProps) {
  return (
    <div className="flex flex-col gap-2 text-center md:text-left">
      <div className="text-[#5B87A3] text-base font-semibold flex justify-center md:justify-start gap-2">
        {label}{" "}
        <Image
          src={info || "/placeholder.svg"}
          alt="info"
          className="h-4 w-4 mt-[4px] toolTipHolding17 cursor-pointer"
        />
        <Tooltip
          className="font-poppins font-medium2 "
          target=".toolTipHolding17"
          mouseTrack
          mouseTrackLeft={10}
          content={text || "Information about this field"}
        />
      </div>
      <div className="text-[#014774] text-xl font-semibold">
        {value} {suffix}
      </div>
    </div>
  );
}
