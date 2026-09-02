//accounts.length
"use client";
import { Label } from "@/components/ui/label";
import tBTC from "../../assets/images/flow/stSupra.png";
import Link from "next/link";
import arrow from "../../assets/arrow.svg";
import conf from "../../assets/images/Loader 1.gif";
import rec2 from "../../assets/images/Loader 2.gif";
import tick from "../../assets/images/Done_Solido.gif";
import rej from "../../../app/assets/images/TxnError.gif";
import icircle from "../../assets/images/info.svg";
import Decimal from "decimal.js";
import { ethers, toBigInt } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import { useDebounce } from "react-use";
import Image from "next/image";
import img3 from "../../assets/images/SUPRA.png";
import img4 from "../../assets/images/CASH2.png";
import info from "../../assets/images/info.svg";
import "../../../components/stabilityPool/Modal.css";
import "../../../app/App.css";
import { Button } from "@/components/ui/button";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import { toast } from "react-toastify";
import info1 from "../../assets/images/info.svg";
import axios from "axios";
import { BCS, TxnBuilderTypes, HexString } from "supra-l1-sdk";
import { useWallet } from "../../../context/WalletContext";
import {
  module_address,
  supra_coin,
  stsupra_coin,
} from "@/constants/constants";
import { useRouter } from "next/navigation";
import alert from "../../assets/images/alert.svg";
import DynamicInput from "@/components/DynamicInput";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  coll: number;
  debt: number;
  lr: number;
  fetchedPrice: number;
  minDebt: number;
  borrowRate: number;

  mCR: number;
  troveStatus?: string;
  liquidationThreshold?: number;
  balanceAmount?: number;
  displayValue?: "SUPRA" | "stSUPRA";
}

export const Repay: React.FC<Props> = ({
  coll,
  debt,
  lr,
  fetchedPrice,
  minDebt,
  mCR,
  liquidationThreshold,
  balanceAmount,
  displayValue = "SUPRA",
}) => {
  const [userInputs, setUserInputs] = useState({
    lusdAmount: "",
    coll: "",
  });
  const { isInstalled, account, balance } = useWallet();

  let supraProvider: any =
    typeof window !== "undefined" && (window as any)?.starkey?.supra;

  const [hasGotStaticData, setHasGotStaticData] = useState(false);
  // displayValue is now passed as a prop
  const [totalDebt, setTotalDebt] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [ltv, setLtv] = useState(0);
  const [price, setPrice] = useState(0);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [totalColl, setTotalColl] = useState(0);
  // const { isConnected } = useAccount();
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [userInputColl, setUserInputColl] = useState(0);
  const [userInputDebt, setUserInputDebt] = useState(0);
  const [newAvailColl, setNewAvailColl] = useState(0);
  const [staticLtv, setStaticLtv] = useState(0);

  const [transactionRejected, setTransactionRejected] = useState(false);

  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [selectedPercentageBTC, setSelectedPercentageBTC] = useState(null);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [hash, setHash] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (account && account != "undefined") {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [account]);

  const handleClose = useCallback(() => {
    setLoadingModalVisible(false);
    setUserModal(false);
    setIsModalVisible(false);
    setTransactionRejected(false);
    router.refresh();

    window.location.reload();
  }, [router]);

  useEffect(() => {
    const pow = Decimal.pow(10, 18);
    const _1e18 = toBigInt(pow.toFixed());
    const fetchedData = async () => {
      if (!account) return null;

      const collDecimal = new Decimal(coll.toString());
    };
    const getStaticData = async () => {
      if (!account) return null;

      const ltvValue =
        (Number(debt) * 100) / (Number(coll) * Number(fetchedPrice) || 1);
      setStaticLtv(ltvValue);
      setHasGotStaticData(true);
    };
    fetchedData();
    getStaticData();
  }, [account]);

  const shortenedHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`; // Shorten the hash

  // displayValue is now passed as a prop, no need to parse from URL
  useDebounce(
    () => {
      makeCalculations(userInputs.lusdAmount, userInputs.coll);
    },
    10,
    [userInputs.lusdAmount, userInputs.coll]
  );

  const handleRepay = async (cash: number, collateral: number) => {
    setisLoading(true);
    setIsModalVisible(true);
    cash = Math.floor(Number(cash) * 100000000);
    collateral = Math.floor(Number(collateral) * 100000000);

    try {
      const provider = window.starkey?.supra;
      if (!provider) {
        throw new Error("Wallet provider not found");
      }

      // Set expiration time for raw transaction to 30 seconds
      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const optionalTransactionPayloadArgs = {
        txExpiryTime,
      };

      const rawTx = [
        account,
        0,
        module_address, // cdpContract
        "cdp_multi",
        "repay_or_withdraw",
        displayValue === "SUPRA" ? [supra_coin] : [stsupra_coin],
        [
          BCS.bcsSerializeUint64(collateral), // Supra amount
          BCS.bcsSerializeUint64(cash), // CASH amount
        ],
        optionalTransactionPayloadArgs,
      ];

      // Create raw transaction data

      const data = await supraProvider.createRawTransactionData(rawTx);
      if (!data) {
        throw new Error("Failed to create raw transaction data");
      }

      // Send transaction
      const params = {
        data: data,
        from: account,
        to: module_address,
        chainId: 8,
        value: "",
      };

      const txHash = await supraProvider.sendTransaction(params);

      if (!txHash) {
        throw new Error("Transaction failed");
      }

      setisLoading(false);
      setIsSuccess(true);
      setHash(txHash);
    } catch (err) {
      setError(true);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      //   setError(`Error: ${errorMessage}`);
      console.error("Error in handle:", err);
    } finally {
      setisLoading(false);
    }
  };

  const makeCalculations = async (xLusdAmount: string, xColl: string) => {
    try {
      const lusdValue = Number(xLusdAmount);
      const collValue = Number(xColl);

      const debtTotal = Number(debt) - lusdValue;
      setTotalDebt(debtTotal);

      const collTotal = Number(coll) - collValue;
      setTotalColl(collTotal);

      const ltvValue =
        (debtTotal * 100) / ((collTotal || 1) * Number(fetchedPrice));
      setLtv(ltvValue);

      const liquidationRatio = Number(liquidationThreshold) / 100;
      const liquidationPriceValue = (liquidationRatio * debtTotal) / collTotal;

      setLiquidationPrice(liquidationPriceValue);
      const newAvailColl =
        Number(coll) - (divideBy * debtTotal) / Number(fetchedPrice);

      setNewAvailColl(newAvailColl);

      {
        parseFloat(userInputs.coll) > 0
          ? setUserInputColl(1)
          : setUserInputColl(0);
      }
      {
        parseFloat(userInputs.lusdAmount) > 0
          ? setUserInputDebt(1)
          : setUserInputDebt(0);
      }
    } catch (error) {
      console.error(error, "Error in makeCalculations");
    }
  };

  const divideBy = Number(mCR) / 100;
  const liquidationRatio = Number(liquidationThreshold) / 100;
  const availableToBorrow = price / divideBy - Number(debt);
  const liquidation = liquidationRatio * (Number(debt) / Number(coll));
  const totalAvailableRepay = Number(debt) - minDebt - lr;

  const isCollInValid = parseFloat(userInputs.coll) > newAvailColl;
  const isDebtInValid = parseFloat(userInputs.lusdAmount) > totalAvailableRepay;

  const newLTV: number = parseFloat(
    ((Number(debt) * 100) / (Number(coll) * Number(fetchedPrice))).toFixed(2)
  );

  const condition =
    userInputColl + userInputDebt >= 1 ||
    parseFloat(userInputs.coll) < Number(coll) ||
    parseFloat(userInputs.lusdAmount) < Number(debt);

  const renderHeader = () => {
    return (
      <div className="flex justify-content-between align-items-center">
        <Button
          className="p-button-rounded p-button-text"
          onClick={() => setUserModal(false)}
        >
          Close
        </Button>
      </div>
    );
  };

  useEffect(() => {
    if (error) {
      console.error("Write contract error:");
      setTransactionRejected(true);
      setUserModal(true);
    }
  }, [error]);
  const imageSrc = displayValue === "SUPRA" ? img3 : tBTC;

  useEffect(() => {
    if (isLoading) {
      setIsModalVisible(false);
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);
    } else if (isSuccess) {
      setLoadingMessage("Trove updated successfully");
      setLoadingModalVisible(true);
    } else if (transactionRejected) {
      setLoadingMessage("Transaction was rejected");
      setLoadingModalVisible(true);
    }
  }, [isSuccess, isLoading, transactionRejected]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCloseButton(true);
    }, 200000);
    return () => clearTimeout(timer);
  }, []);
  const marginClass =
    parseFloat(userInputs.coll) > 0 ? "md:-ml-[7rem]" : "md:-ml-[5rem]";

  return (
    <>
      {" "}
      {/* <div
        className="
        relative flex flex-row flex-wrap justify-center text-center items-center w-[300px]
        sm:w-[546px] sm:h-[60px] mx-auto text-sm font-poppins p-2 font-thin gap-1
      "
        style={{
          background:
            "linear-gradient(4.83deg, #272727 22.03%, rgba(39, 39, 39, 0) 125.74%)",
        }}
      >
        Earn 8% APY + Boosted Solido Points with Supra&apos;s first LST.
        <a
          href="/stake"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1DBDAF] ml-1 flex items-center gap-1"
        >
          STAKE SUPRA
          <ArrowRight width={15} height={15} />
        </a>
      </div>{" "} */}
      <div className="flex-col flex md:flex-row md:justify-between gap-16">
        {/* LEFT */}

        <div className="grid w-full md:w-1/2 space-y-7 items-start gap-2 py-7 pr-7 md:py-5 md:pr-5 md:pl-2">
          <div className="flex flex-col">
            <Label
              className="font-poppins font-medium2 text-xl text-md text-transparent"
              style={{
                fontWeight: "500",
                fontSize: "19px",
                color: "white",
              }}
            >
              Repay $CASH
            </Label>

            <DynamicInput
              id="depositCollateral"
              label=""
              icon={img4}
              symbol="CASH"
              placeholder="Enter the amount to return"
              value={userInputs.lusdAmount}
              onChange={(newValue) => {
                setUserInputs({
                  ...userInputs,
                  lusdAmount: newValue,
                });
              }}
              walletBalance={Math.min(
                Number(totalAvailableRepay),
                Number(balanceAmount)
              )}
              dollarValue={parseFloat(userInputs.lusdAmount || "0").toFixed(2)}
              dollarValueBalance={Number(
                Math.min(Number(totalAvailableRepay), Number(balanceAmount))
              ).toFixed(2)}
              maxLength={6}
              isLoading={false}
              isDisabled={!isConnected}
              showPercentages={true}
              errorMessage={
                parseFloat(userInputs.lusdAmount) > totalAvailableRepay
                  ? "Amount exceeds available to repay"
                  : ""
              }
              infoText="The maximum amount of $CASH you can repay in order to ensure that you still have a position with total debt greater than the sum of minimum debt allowed by the protocol and liquidation reserve."
              balanceLabel="Available"
            />
          </div>
          <div className="flex flex-col">
            <div className="">
              <Label
                htmlFor="items"
                className="font-poppins font-medium2 text-xl text-md text-transparent"
                style={{
                  fontWeight: "500",
                  fontSize: "19px",
                  color: "white",
                }}
              >
                Withdraw Collateral
              </Label>
            </div>

            <DynamicInput
              id="collWithdraw"
              label=""
              icon={imageSrc}
              symbol={displayValue}
              placeholder="Enter the amount of collateral"
              value={userInputs.coll}
              onChange={(newValue) => {
                setUserInputs({
                  ...userInputs,
                  coll: newValue,
                });
              }}
              walletBalance={newAvailColl}
              dollarValue={(
                parseFloat(userInputs.coll || "0") * Number(fetchedPrice)
              ).toFixed(2)}
              dollarValueBalance={Number(
                Number(newAvailColl) * fetchedPrice
              ).toFixed(2)}
              maxLength={8}
              decimals={displayValue === "stSUPRA" ? 6 : 2}
              isLoading={false}
              isDisabled={!isConnected}
              showPercentages={true}
              errorMessage={
                Number(userInputs.coll) > newAvailColl
                  ? "Amount exceeds available to withdraw"
                  : !isCollInValid &&
                    !isDebtInValid &&
                    ltv >= 40 &&
                    (parseFloat(userInputs.coll) > 0 ||
                      parseFloat(userInputs.lusdAmount) > 0)
                  ? "Your LTV is too high and Trove can be liquidated"
                  : ""
              }
              infoText="The maximum amount of collateral you can withdraw to ensure that your LTV is below liquidation threshold."
              balanceLabel="Available"
            />
          </div>
          <button
            onClick={() =>
              handleRepay(
                Number(userInputs.lusdAmount),
                Number(userInputs.coll)
              )
            }
            className={` mt-9 md:-ml-0 w-full font-poppins font-bold h-[3rem]
             ${
               isDebtInValid ||
               isCollInValid ||
               userInputColl + userInputDebt == 0
                 ? "bg-black text-gray-400 border border-gray-400 cursor-not-allowed"
                 : " hover:bg-[#2b4e51]  cursor-pointer bg-[#1dbdaf]  text-black"
             }`}
            disabled={
              isDebtInValid ||
              isCollInValid ||
              userInputColl + userInputDebt == 0
            }
          >
            UPDATE TROVE
          </button>
        </div>

        {/* RIGHT */}
        <div
          className="px-1 pl-5 w-full md:px-6 md:-ml-6 md:w-[450px] pt-9 md:h-[21rem] md:pt-10 md:mt-10 text-sm"
          style={{ backgroundColor: "#222222" }}
        >
          <div className="flex flex-col gap-y-2">
            {/* naya ltv */}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 flex items-center">
                <span className="body-text text-lg whitespace-nowrap text-gray-400 font-medium">
                  Loan-To-Value
                </span>
                <Image
                  width={15}
                  className="toolTipHolding9 ml_5 cursor-pointer"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="font-poppins font-medium2"
                  target=".toolTipHolding9"
                  content="It is a ratio that measures the amount of a loan compared to the value of the collateral."
                  mouseTrack
                  mouseTrackLeft={10}
                />
              </div>
              <div className="md:w-1/2 text-lg whitespace-nowrap body-text flex justify-end pl-2">
                <div className="flex items-center gap-x-2">
                  <span
                    className={`overflow-x-clip text-lg font-poppins font-medium ${
                      newLTV <= 20
                        ? "text-green-500"
                        : newLTV <= 40
                        ? "text-yellow-500"
                        : newLTV <= 50
                        ? "text-orange-500"
                        : "text-red-500"
                    }`}
                  >
                    {Number(newLTV).toFixed(2)}%
                  </span>
                  {userInputColl + userInputDebt >= 1 &&
                    Number(userInputs.coll) < Number(coll) &&
                    Number(userInputs.lusdAmount) < Number(debt) && (
                      <div className="flex justify-center items-center gap-x-2">
                        <span className="text-sm">
                          <FaArrowRightLong />
                        </span>
                        <span
                          className={`overflow-x-clip text-lg font-poppins font-medium ${
                            ltv <= 20
                              ? "text-green-500"
                              : ltv <= 40
                              ? "text-yellow-500"
                              : ltv <= 50
                              ? "text-orange-500"
                              : "text-red-500"
                          }`}
                        >
                          {" "}
                          {Number(ltv).toFixed(2)}%
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
            {/* liquidation ltv */}
            <div className="flex flex-col md:flex-row ">
              <div className="md:w-1/2 flex items-center">
                <span className="body-text text-lg whitespace-nowrap text-gray-400 font-medium">
                  Liquidation LTV
                </span>
                <Image
                  width={15}
                  className="toolTipHoldingltv ml_5"
                  src={info || "/placeholder.svg"}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins "
                  target=".toolTipHoldingltv"
                  content="Threshold LTV at which your Trove will be liquidated."
                  mouseTrack
                  mouseTrackLeft={10}
                />
              </div>
              <div className="md:w-1/2 text-lg whitespace-nowrap body-text flex justify-end pl-2">
                <div className="flex items-center gap-x-2">
                  <span className="font-medium body-text">
                    {liquidationThreshold
                      ? Math.round(
                          Number((1 / liquidationThreshold) * 10000)
                        ).toFixed(2)
                      : "-"}
                    %
                  </span>
                </div>
              </div>
            </div>
            {/* naya liquidation */}
            <div className="flex flex-col md:flex-row ">
              <div className="md:w-1/2 flex items-center">
                <span className="body-text text-lg whitespace-nowrap text-gray-400 font-medium">
                  Liquidation Price
                </span>
              </div>
              <div className="md:w-1/2 text-lg whitespace-nowrap body-text flex justify-end pl-2">
                <div className="flex items-center gap-x-2">
                  <span className="font-medium body-text">
                    ${Number(liquidation).toFixed(4)}
                  </span>
                  {userInputColl + userInputDebt >= 1 &&
                    Number(userInputs.coll) < Number(coll) &&
                    Number(userInputs.lusdAmount) < Number(debt) && (
                      <div className="flex justify-center items-center gap-x-2">
                        <span className="text-sm">
                          <FaArrowRightLong />
                        </span>
                        <span className={"text-lg body-text font-medium"}>
                          ${Number(liquidationPrice).toFixed(4)}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
            <div className="flex flex-row mt-4">
              {" "}
              <Image
                src={info1}
                alt="info"
                className="mr-2 mt-[-1rem]"
                width={21}
                height={21}
              />
              <p className="text-xs text-gray-400 body-text font-medium 2xl:-mt-2">
                If the market price falls below the liquidation price, the Trove
                maybe liquidated.{" "}
              </p>{" "}
            </div>
            <div>
              <hr className="border-[#827f77] border-1 mt-4 mb-4" />
            </div>

            {/* naya total debt */}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 flex items-center">
                <span className="body-text text-sm whitespace-nowrap text-gray-400 font-medium">
                  Total Debt
                </span>
                <Image
                  width={15}
                  className="toolTipHolding11 ml_5 cursor-pointer"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="font-poppins font-medium2"
                  target=".toolTipHolding11"
                  content="Total amount of stablecoin borrowed + liquidation reserve + borrowing fee."
                  mouseTrack
                  mouseTrackLeft={10}
                />
              </div>
              <div className="md:w-1/2 text-sm whitespace-nowrap body-text flex justify-end pl-2">
                <div className="flex items-center gap-x-2">
                  <span className="font-medium body-text">
                    {Number(debt).toFixed(2)} CASH
                  </span>
                  {userInputDebt == 1 &&
                    parseFloat(userInputs.lusdAmount) < Number(debt) && (
                      <div className="flex justify-center items-center gap-x-2">
                        <span className="text-sm">
                          <FaArrowRightLong />
                        </span>
                        <span className={"text-sm body-text font-medium"}>
                          {Number(totalDebt).toFixed(2)} CASH
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* naya total collateral */}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 flex items-center">
                <span className="body-text text-sm whitespace-nowrap text-gray-400 font-medium">
                  Total Collateral
                </span>
                <Image
                  width={15}
                  className="toolTipHolding12  ml_5 cursor-pointer"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="font-poppins font-medium2"
                  target=".toolTipHolding12"
                  mouseTrack
                  content="Total amount of collateral supplied in the position."
                  mouseTrackLeft={10}
                />
              </div>
              <div className="md:w-1/2 text-sm whitespace-nowrap body-text flex justify-end pl-2">
                <div className="flex items-center gap-x-2">
                  <span className="font-medium body-text">
                    {Number(coll).toFixed(displayValue === "stSUPRA" ? 6 : 2)}{" "}
                    {displayValue}
                  </span>
                  {userInputColl > 0 &&
                    parseFloat(userInputs.coll) < Number(coll) && (
                      <div className="flex justify-center items-center gap-x-2">
                        <span className="text-sm">
                          <FaArrowRightLong />
                        </span>
                        <span className={`text-sm body-text font-medium`}>
                          {" "}
                          {Number(totalColl).toFixed(
                            displayValue === "stSUPRA" ? 6 : 2
                          )}{" "}
                          {displayValue}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Dialog
          visible={loadingModalVisible}
          onHide={() => setLoadingModalVisible(false)}
        >
          <div className="dialog-overlay flex items-center justify-center">
            <div
              className="dialog-content w-[90%] max-w-[380px]  bg-black p-6 flex flex-col justify-around border border-gray-400"
              style={{ height: "450px" }}
            >
              {" "}
              <div className="flex flex-col items-center">
                {loadingMessage === "Waiting for transaction to confirm.." ? (
                  <>
                    <Image src={conf} alt="rectangle" width={150} />
                    <div className="my-5 ml-[6rem] mt-12"></div>
                    <div className="waiting-message font-bold font-poppins  text-[#1DBDAF] text-center mt-4">
                      {loadingMessage}
                    </div>
                  </>
                ) : loadingMessage === "Trove updated successfully" ? (
                  <>
                    <Image src={tick} alt="tick" width={100} />
                    <div className="waiting-message font-bold font-poppins  text-[#1DBDAF] text-center mt-4">
                      {loadingMessage}
                    </div>
                    <div className="text-black w-full h-auto mt-4 bg-[#222222] p-4 rounded-md">
                      {userInputs.lusdAmount && (
                        <p className="text-[#1DBDAF] mt-2 text-sm flex justify-between font-medium">
                          <p className="text-[white] text-sm font-medium">
                            You repaid:
                          </p>
                          {Number(userInputs.lusdAmount) < 0.01
                            ? parseFloat(userInputs.lusdAmount).toFixed(4)
                            : parseFloat(userInputs.lusdAmount).toFixed(2)}{" "}
                          CASH
                        </p>
                      )}
                      {userInputs.coll && (
                        <p className="text-[#1DBDAF] mt-2 text-sm flex justify-between font-medium">
                          <p className="text-[white] text-sm font-medium">
                            You withdrew:
                          </p>
                          {displayValue === "stSUPRA"
                            ? parseFloat(userInputs.coll).toFixed(6)
                            : Number(userInputs.coll) < 0.01
                            ? parseFloat(userInputs.coll).toFixed(4)
                            : parseFloat(userInputs.coll).toFixed(2)}{" "}
                          {displayValue}
                        </p>
                      )}
                      <p className="text-[#1DBDAF] mt-2 flex justify-between text-smfont-medium">
                        <p className="text-[white] font-medium text-sm">
                          Transaction hash:
                        </p>
                        <div className="flex gap-2 text-sm">
                          <p>{shortenedHash}</p>
                          <Link
                            href={`https://suprascan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Image
                              src={arrow}
                              alt="copy"
                              className="h-6 cursor-pointer"
                            />
                          </Link>
                        </div>
                      </p>
                    </div>
                  </>
                ) : transactionRejected ? (
                  // <Image src={rej} alt="rejected" width={140} />
                  <>
                    {" "}
                    <Image src={rej} alt="rejected" width={150} />
                    <div className="my-5 ml-[6rem] mb-5"></div>
                    <div className="waiting-message font-poppins font-bold text-[#1DBDAF] text-center mt-4">
                      {loadingMessage}
                    </div>
                  </>
                ) : (
                  <Image src={conf} alt="box" width={140} />
                )}
                <div className="waiting-message font-poppins  text-[#1DBDAF]">
                  {/* {loadingMessage} */}
                </div>
                {isSuccess && (
                  <button
                    className="mt-1 p-3 text-black font-bold font-poppins w-full hover:bg-[#2b4e51] bg-[#1DBDAF]"
                    onClick={handleClose}
                  >
                    Close
                  </button>
                )}
                {(transactionRejected || (!isSuccess && showCloseButton)) && (
                  <>
                    <p className="font-poppins  text-[#1DBDAF] text-xs mt-2 mb-2">
                      {transactionRejected
                        ? "Transaction was rejected. Please try again."
                        : "Some Error Occurred On Network Please Try Again After Some Time.. 🤖"}
                    </p>
                    <Button
                      className=" mt-0.5 p-3 font-bold text-black rounded-none md:w-[20rem] font-poppins  hover:bg-[#2b4e51] bg-[#1DBDAF]"
                      onClick={handleClose}
                    >
                      Try again
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </>
  );
};
