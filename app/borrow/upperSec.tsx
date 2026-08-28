import React from "react";
import Image from "next/image";
import trove1 from "../assets/trove1.svg";
import trove2 from "../assets/trove3.png";

const UpperSec: React.FC = () => {
  return (
    <div className="w-full md:h-[120px] text-white flex justify-between  p-4 items-center bg-[linear-gradient(90deg,_#222222_82.14%,_#1DBDAF_126.48%)]">
      <div className=" font-medium text-left ">
        <div className="text-lg md:text-xl lg:text-2xl">
          Mint $CASH stablecoin by depositing assets
        </div>{" "}
        <div className="text-base md:text-md  text-gray-400">
          Unlock instant liquidity and earn Solido points
        </div>
      </div>

      <div>
        <Image src={trove2} alt="trove2" width={160} />
      </div>
    </div>
  );
};

export default UpperSec;
