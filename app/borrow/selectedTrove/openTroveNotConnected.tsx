import React, { useEffect, useState } from "react";

import img1 from "../../assets/images/Group 771.png";
import img3 from "../../assets/images/SUPRA.png";
import img4 from "../../assets/images/CIRCLE2.png";
import floatpusd from "../../assets/images/floatPUSD2.png";

import Image from "next/image";
import "../../../app/App.css";
import { formatLargeNumber } from "../../../components/getActualDecimal";
import ORE from "../../assets/images/ORE.png";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import ConnectWallet from "@/components/Connectxion";
import xion from "../../assets/images/Unknown 1.png";
import floatpusd1 from "../../assets/images/Group 1086.png";
import floatpusd2 from "../../assets/images/Group 1088.png";

const OpenTroveNotConnected = () => {
  const [minDebt, setMinDebt] = useState(0);
  const [borrowRate, setBorrowRate] = useState(0);
  const [cCr, setCCR] = useState(0);
  const [mCR, setMCR] = useState(0);
  const [fetchedPrice, setFetchedPrice] = useState(0);
  const [pusdMintedCore, setPusdMintedCore] = useState(0);
  const [LR, setLR] = useState(0);
  const [systemCollRatio, setSystemCollRatio] = useState(0);
  const [recoveryMode, setRecoveryMode] = useState<boolean>();
  const [pusdMinted, setPusdMinted] = useState(0);

  const [loading, setLoading] = useState(true); // Loading state for client initialization

  return (
    <div
      className="md:pt-4  md:p-5 h-full px-2 pt-4 md:h-screen"
      style={{ backgroundColor: "white" }}
    >
      <div
        className=" shadow-lg   md:w-full  m-2"
        style={{ backgroundColor: "#014774" }}
      >
        <div className="md:container flex flex-col md:flex-row  justify-between">
          <div className=" hidden md:block">
            <Image
              src={floatpusd2}
              // height={200}
              alt="home"
              className="md:ml-0 ml-[20%]"
            />
          </div>
          <div className="flex flex-col items-center">
            <h6 className=" text-center font-poppins font-medium text-2xl md:text-[27px] text-white md:mb-2 mt-4 ">
              Sign in to access your Trove{" "}
            </h6>
            <div className="flex flex-col items-center md:flex-row">
              <h6 className="font-poppins text-center font-medium text-lg text-white mb-2 md:mb-0 md:mr-1">
                Mint $CASH stablecoin by depositing{" "}
              </h6>

              <Image
                src={xion}
                alt="home"
                height={20}
                className="md:-mt-1 inline-block"
              />
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src={floatpusd1}
              // height={200}
              alt="home"
              className="md:ml-0 ml-[20%]"
            />
          </div>
        </div>
      </div>
      <div className="md:container pt-2  font-poppins flex flex-col md:flex-row justify-between">
        <div className="">
          <div className="grid space-y-5 w-full max-w-sm items-start gap-2 mx-auto   p-5">
            <div className="">
              <Label
                htmlFor="items"
                className="font-poppins text-xl text-md text-[#014774] "
                style={{ fontWeight: "500" }}
              >
                Deposit collateral to mint CASH
              </Label>

              <div className=" flex mb-4 mt-[8px] items-center border  md:w-[481px] border-[#a5bcca] bg-[white] overflow-hidden ">
                <div className="flex items-center h-[3.5rem]">
                  <Image src={img3} alt="home" className="ml-1" width={40} />
                  <h3 className=" font-poppins ml-1 font-medium text-black">
                    SUPRA
                  </h3>
                  <h3 className="h-full border border-gray-100 mx-3 text-[#014774]"></h3>
                </div>
                <input
                  id="items"
                  placeholder="Enter the amount of collateral"
                  disabled
                  onChange={(e) => {
                    const newCollValue = e.target.value;
                  }}
                  className="font-poppins text-sm font-medium  placeholder-[#618ba6] whitespace-nowrap cursor-not-allowed h-[3.5rem] flex-grow"
                  style={{ backgroundColor: "white" }}
                />
              </div>

              <span className="font-poppins font-medium text-[#618ba6] text-sm ">
                Wallet Balance{" "}
                {/* <span className="text-white font-poppins ml-0.5">0.00</span> */}
              </span>
              <div className="text-white flex flex-col md:flex-row md:gap-x-10">
                <div className="flex flex-row">
                  <div className="text-[#014774] mt-2  font-poppins whitespace-nowrap mr-2 font-medium">
                    {" "}
                    0.00 SUPRA{""}
                  </div>
                  <div className="text-[#618ba6] mt-2 font-poppins font-medium">
                    $0.00{" "}
                  </div>
                </div>
                <div>
                  {" "}
                  <div className="flex md:ml-2 gap-x-4 md:gap-x-2 w-full  md:-mr-2  ">
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(25)}
                    >
                      25%
                    </Button>
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(50)}
                    >
                      50%
                    </Button>
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(75)}
                    >
                      75%
                    </Button>
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(100)}
                    >
                      90%
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid space-y-5 w-full max-w-sm items-start gap-2 mx-auto   p-5">
            <div className="">
              <Label
                htmlFor="items"
                className="font-poppins text-xl text-md text-[#014774]"
                style={{ fontWeight: "500" }}
              >
                Great you got 0.00 CASH to mint
              </Label>

              <div className=" flex mb-4 mt-[8px] items-center border  md:w-[481px] border-[#a5bcca] bg-[white] overflow-hidden ">
                <div className="flex items-center h-[3.5rem]">
                  <Image src={img4} alt="home" className="ml-1" width={40} />
                  <h3 className="text-black font-poppins ml-1 font-medium">
                    CASH
                  </h3>
                  <h3 className="h-full border border-gray-100 mx-3 text-[#014774]"></h3>
                </div>
                <input
                  id="items"
                  placeholder="Enter the amount you want to mint"
                  disabled
                  onChange={(e) => {
                    const newCollValue = e.target.value;
                  }}
                  className="font-poppins text-sm font-medium  placeholder-[#618ba6] whitespace-nowrap cursor-not-allowed h-[3.5rem] flex-grow"
                  style={{ backgroundColor: "white" }}
                />
              </div>

              <span className="font-poppins font-medium text-[#618ba6] text-sm ">
                Available{" "}
                {/* <span className="text-white font-poppins ml-0.5">0.00</span> */}
              </span>
              <div className="text-white flex flex-col md:flex-row md:gap-x-10">
                <div className="flex flex-row">
                  <div className="text-[#014774] mt-2  font-poppins whitespace-nowrap mr-2 font-medium">
                    {" "}
                    0.00 CASH{""}
                  </div>
                  <div className="text-[#618ba6] mt-2 font-poppins font-medium">
                    $0.00{" "}
                  </div>
                </div>
                <div>
                  {" "}
                  <div className="flex md:ml-2 gap-x-4 md:gap-x-2 w-full  md:-mr-2  ">
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(25)}
                    >
                      25%
                    </Button>
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(50)}
                    >
                      50%
                    </Button>
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(75)}
                    >
                      75%
                    </Button>
                    <Button
                      disabled={true}
                      className={`text-sm border  bg-white  font-poppins border-[#a5bcca] text-[#618ba6] `}
                      // onClick={() => handlePercentageClick(100)}
                    >
                      90%
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <button
              className=" mt-5 md:-ml-0 -ml-4  h-[3rem] px-10 bg-[#014774] title-text text-[white] font-medium
   
      cursor-not-allowed opacity-50
      
  "
              style={{ cursor: "not-allowed" }}
              disabled={true}
            >
              Login to get started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenTroveNotConnected;
