import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import icircle from "../../assets/icircle.svg";
import ORE from "../../assets/images/CIRCLE2.png";

interface BorrowInputProps {
  maxBorrow: number;
  userInputs: {
    collateral: string;
    borrow: string;
  };
  isConnected: boolean;
  handleBorrowChange: (value: string) => void;
  handlePercentageClick: (percentage: number) => void;
  minDebt: number;
}

export const BorrowInput = ({
  maxBorrow,
  userInputs,
  isConnected,
  handleBorrowChange,
  handlePercentageClick,
  minDebt,
}: BorrowInputProps) => {
  return (
    <div className="w-full">
      <Label
        htmlFor="items"
        className="font-poppins ml-[-12px] md:ml-0 text-2xl text-[#014774]"
        style={{ fontWeight: "500", fontSize: "19px" }}
      >
        Great, you got{" "}
        <span className="font-poppins text-[#014774] font-medium">
          {maxBorrow >= 0 ? Math.floor(maxBorrow * 100) / 100 : "0.00"} CASH
        </span>{" "}
        to mint
      </Label>
      <div
        className="flex w-[300px] md:w-[460px] items-center md:space-x-2 mt-[10px] -ml-3 md:-ml-0 border border-gray-400"
        style={{
          backgroundColor: "white",
          marginBottom: "1rem",
        }}
      >
        <div className="flex items-center h-[3.5rem]">
          <Image
            src={ORE || "/placeholder.svg"}
            alt="CASH"
            className="ml-1"
            width={40}
          />
          <h3 className="text-[black] font-poppins font-medium hidden md:block mx-1">
            CASH
          </h3>
          <h3 className="h-full border border-gray-400 text-[#014774] mx-4"></h3>
        </div>
        <input
          id="quantity"
          placeholder="Enter the amount you want to mint"
          value={userInputs.borrow}
          onChange={(e) => handleBorrowChange(e.target.value)}
          className="flex-grow text-xs focus:outline-none text-[#618ba6] placeholder-[#618ba6] font-poppins font-medium h-[3.5rem]"
          style={{
            backgroundColor: "white",
            marginLeft: "-0.5rem",
          }}
        />
        <span className="md:max-w-[fit] md:p-2 mr-1 md:mr-0 font-medium text-[#618ba6] text-sm font-poppins h-full">
          ${Number(userInputs.borrow).toFixed(2)}
        </span>
      </div>
      <span className="font-poppins mb-2 font-medium text-[#618ba6] flex gap-2 text-sm">
        Available{" "}
        <div className="relative group">
          <Image
            src={icircle || "/placeholder.svg"}
            alt="info"
            className="h-[17px] cursor-pointer relative group"
          />
          <span className="absolute top-1/2 left-full transform -translate-y-1/2 w-[200px] bg-[#ECEEEF] text-[#014774] text-xs font-thin px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            The amount of $CASH you can borrow using the collateral asset you
            have entered.
          </span>
        </div>
      </span>

      <div className="pt-2 flex md:flex-row flex-col items-center justify-between mt-[-1rem]">
        <span className="text-sm font-poppins w-full font-medium whitespace-nowrap flex flex-row">
          <span className="text-[#014774] font-poppins font-medium text-sm">
            {maxBorrow >= 0 ? Math.floor(maxBorrow * 100) / 100 : "0.00"} CASH
          </span>
          <span className="text-[#618ba6] ml-1 font-poppins font-medium text-sm">
            ${maxBorrow >= 0 ? Math.floor(maxBorrow * 100) / 100 : "0.00"}
          </span>
        </span>
        <div className="flex flex-col mr-[12px] md:flex-row w-full justify-between items-center -mt-1">
          <div className="flex gap-x-4 md:gap-x-2 w-full mt-2">
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClick(25)}
            >
              25%
            </Button>
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClick(50)}
            >
              50%
            </Button>
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClick(75)}
            >
              75%
            </Button>
            <Button
              disabled={!isConnected}
              className={`text-sm border bg-white font-poppins hover:bg-white border-[#a5bcca] text-[#618ba6]`}
              onClick={() => handlePercentageClick(90)}
            >
              90%
            </Button>
          </div>
        </div>
      </div>
      {Number(userInputs.borrow) < minDebt && Number(userInputs.borrow) > 0 && (
        <span className="text-red-500 font-poppins font-medium">
          Borrow amount should be greater than {minDebt}
        </span>
      )}
    </div>
  );
};
