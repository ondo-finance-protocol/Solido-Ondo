import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import icircle from "../../assets/icircle.svg";

interface CollateralInputProps {
  displayValue: string;
  imageSrc: any;
  userInputs: {
    collateral: string;
    borrow: string;
  };
  totalCollateral: number;
  balanceData: number | string;
  isConnected: boolean;
  handleCollateralChange: (value: string) => void;
  handlePercentageClickBTC: (percentage: number) => void;
}

export const CollateralInput = ({
  displayValue,
  imageSrc,
  userInputs,
  totalCollateral,
  balanceData,
  isConnected,
  handleCollateralChange,
  handlePercentageClickBTC,
}: CollateralInputProps) => {
  return (
    <div className="w-full">
      <Label
        htmlFor="items"
        className="font-poppins ml-[-12px] md:ml-0 text-xl text-md text-[#014744]"
        style={{
          fontWeight: "500",
          fontSize: "19px",
          color: "#014774",
        }}
      >
        Deposit collateral to mint $CASH
      </Label>

      <div
        className="flex w-[300px] md:w-[460px] items-center space-x-2 mt-[10px] -ml-3 md:-ml-0 border border-gray-400"
        style={{ backgroundColor: "white", marginBottom: "1rem" }}
      >
        <div className="flex items-center h-[3.5rem]">
          <Image
            src={imageSrc || "/placeholder.svg"}
            alt="collateral"
            className="ml-1"
            width={40}
          />
          <h3 className="font-poppins ml-1 font-medium text-[black]">
            {displayValue}
          </h3>
          <h3 className="h-full border border-[#a5bcca] mx-3 text-[#014774]"></h3>
        </div>
        <input
          id="items"
          placeholder="Enter the amount of collateral"
          value={userInputs.collateral}
          onChange={(e) => handleCollateralChange(e.target.value)}
          className="font-poppins focus:outline-none font-medium text-xs text-[#618ba6] placeholder-[#618ba6] whitespace-nowrap h-[3.5rem] flex-grow"
          style={{ backgroundColor: "white" }}
        />
        <span className="md:max-w-[fit] md:p-2 mr-1 md:mr-0 font-medium text-sm text-[#618ba6] font-poppins h-full">
          ${totalCollateral.toFixed(2)}
        </span>
      </div>
      <span className="font-poppins font-medium text-[#618ba6] mb-2 text-sm flex gap-2 items-center">
        Wallet Balance{" "}
        <div className="relative group">
          <Image
            src={icircle || "/placeholder.svg"}
            alt="info"
            className="h-[17px] cursor-pointer relative group"
          />
          <span className="absolute top-1/2 left-full transform -translate-y-1/2 w-[200px] bg-[#ECEEEF] text-[#014774] text-xs font-thin px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            The amount of collateral asset in your wallet address.
          </span>
        </div>
      </span>

      <div className="pt-2 w-[400px] flex md:flex-row flex-col items-center justify-between mt-[-1rem]">
        <span
          className={`text-sm font-poppins w-full font-medium whitespace-nowrap flex flex-row ${
            Number.parseFloat(userInputs.collateral) > Number(balanceData)
              ? "text-red-500"
              : ""
          }`}
        >
          <span className="text-[#014774] font-poppins font-medium text-sm">
            {Number(balanceData).toFixed(3)} {displayValue}
          </span>
          <span className="text-[#618ba6] ml-1 font-poppins font-medium text-sm">
            $
            {(
              Number(balanceData) *
              (totalCollateral / (Number(userInputs.collateral) || 1))
            ).toFixed(3)}
          </span>
        </span>

        <div className="flex flex-col md:flex-row w-full justify-between items-center -mt-1 ml-4">
          <div className="flex gap-x-4 md:gap-x-2 w-full mt-2">
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClickBTC(25)}
            >
              25%
            </Button>
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClickBTC(50)}
            >
              50%
            </Button>
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClickBTC(75)}
            >
              75%
            </Button>
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClickBTC(90)}
            >
              90%
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
