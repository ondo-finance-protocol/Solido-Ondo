/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { Label } from "@/components/ui/label";
import Decimal from "decimal.js";
import info from "@/app/assets/images/info.svg";
import btc from "../../assets/images/SUPRA.png";
import rej from "../../assets/images/TxnError.gif";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import arrow from "../../assets/arrow.svg";
import conf from "../../assets/images/Loader 1.gif";
import tick from "../../assets/images/Done_Solido.gif";
import { useEffect, useState } from "react";
import Image from "next/image";
import icircle from "@/app/assets/images/info.svg";
import { Button } from "@/components/ui/button";
import "./opentroves.css";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import ORE from "../../assets/images/CASH2.png";
import info1 from "../../assets/images/info1.svg";
import FullScreenLoader from "@/components/FullScreenLoader";
import stBTC from "../../assets/images/flow/stSupra.png";
import { useWallet } from "../../../context/WalletContext";
import DynamicInput from "@/components/DynamicInput";
import { usePathname } from "next/navigation";

// Import custom hooks
import {
  useBalance,
  useTokenPrice,
  useProtocolConfig,
  useTroveCalculations,
  useOpenTrove,
} from "../../../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export const OpenTrove = () => {
  // const [displayValue, setDisplayValue] = useState<"SUPRA" | "tBTC">("SUPRA");
  const supraProvider: any =
    typeof window !== "undefined" && (window as any)?.starkey?.supra;
  const { isInstalled, account, balance } = useWallet();
  const pathname = usePathname();

  const [isClientLoading, setIsClientLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [transactionRejected, setTransactionRejected] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [selectedPercentageBTC, setSelectedPercentageBTC] = useState(null);
  const [gassAvail, setGassAvail] = useState(true);
  const { toast } = useToast();
  const [userInputs, setUserInputs] = useState({
    collatoral: "",
    borrow: "",
  });
  const router = useRouter();

  // useEffect(() => {
  //   const query = window.location.search.replace("?", ""); // Remove "?" from query string
  //   setDisplayValue(query === "tBTC" ? "tBTC" : "SUPRA");
  // }, []);
  const displayValue: "SUPRA" | "stSUPRA" = pathname.includes("/borrow/stsupra")
    ? "stSUPRA"
    : "SUPRA";
  const {
    balance: stSupraBalance,
    isLoading: isBalanceLoading,
    error,
  } = useBalance(displayValue, account);
  const {
    price: fetchedPrice,
    isLoading: isPriceLoading,
    error: priceError,
  } = useTokenPrice(displayValue);
  const {
    config,
    isLoading: isConfigLoading,
    error: configError,
    response,
  } = useProtocolConfig(displayValue as "SUPRA" | "stSUPRA");
  const {
    isLoading: isTroveLoading,
    isSuccess,
    isError,
    hash,
    openTrove,
  } = useOpenTrove(displayValue as "SUPRA" | "stSUPRA", account, supraProvider);

  // Set balance based on token type
  const balanceData = displayValue === "SUPRA" ? balance ?? 0 : stSupraBalance;

  // Calculate trove values
  const calculations = useTroveCalculations(
    userInputs.collatoral,
    userInputs.borrow,
    fetchedPrice,
    config.mcr,
    config.borrowRate,
    config.liquidationReserve
  );

  // Derived values
  const shortenedHash = hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : "";
  const imageSrc = displayValue === "SUPRA" ? btc : stBTC;
  const divideBy = Number(config.mcr) / 100;
  const maxBorrow = calculations.maxBorrow;
  const loanToValue = calculations.loanToValue;
  const liquidationPrice = calculations.liquidationPrice;
  const totalCollateral = calculations.totalCollateral;
  // Check if both inputs are entered
  const bothInputsEntered =
    userInputs.collatoral !== "0" &&
    userInputs.collatoral !== "" &&
    userInputs.borrow !== "0" &&
    userInputs.borrow !== "";
  const collateralEntered =
    userInputs.collatoral !== "0" && userInputs.collatoral.trim() !== "";

  // Add this helper function to calculate minimum collateral needed
  const calculateMinimumCollateralNeeded = () => {
    if (!fetchedPrice || !config.mcr || !config.minDebt) return null;

    const mcrDecimal = Number(config.mcr) / 100;

    const minCollateralNeeded =
      ((config.minDebt + config.liquidationReserve) * mcrDecimal) /
      fetchedPrice;

    return minCollateralNeeded;
  };

  // Add this helper function to format the minimum collateral message
  const getMinimumCollateralMessage = () => {
    const minCollateralNeeded = calculateMinimumCollateralNeeded();

    if (!minCollateralNeeded) return null;

    const formattedCollateralAmount =
      displayValue === "SUPRA"
        ? Math.ceil(minCollateralNeeded).toLocaleString()
        : minCollateralNeeded.toFixed(6);

    const dollarValue = (minCollateralNeeded * fetchedPrice).toFixed(2);

    return {
      amount: formattedCollateralAmount,
      dollarValue: dollarValue,
      token: displayValue,
    };
  };

  // Check if user is connected
  useEffect(() => {
    if (account && account !== "undefined") {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [account]);

  // Update modal visibility based on transaction state
  useEffect(() => {
    if (isTroveLoading) {
      setIsModalVisible(false);
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);
    } else if (isSuccess) {
      setLoadingMessage("Trove opened successfully");
      setLoadingModalVisible(true);
    } else if (transactionRejected) {
      setLoadingMessage("Transaction was rejected");
      setLoadingModalVisible(true);
    } else {
      setLoadingModalVisible(false);
    }
  }, [isSuccess, isTroveLoading, transactionRejected]);

  // Handle transaction error
  useEffect(() => {
    if (isError) {
      console.error("Write contract error:");
      setTransactionRejected(true);
      setUserModal(true);
    }
  }, [isError]);

  // Hide modal when hash is available
  useEffect(() => {
    if (hash) {
      setIsModalVisible(false);
    }
  }, [hash]);

  // Change this useEffect
  useEffect(() => {
    const requiredCollateral = Number(balanceData ?? 0);
    // FIXED VERSION:
    if (Number(userInputs.collatoral ?? 0) <= requiredCollateral) {
      setGassAvail(false);
    } else {
      setGassAvail(true); // User doesn't have enough collateral, disable button
    }
  }, [userInputs, balanceData]);
  // Show close button after 3 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCloseButton(true);
    }, 180000);
    return () => clearTimeout(timer);
  }, []);

  // Handle balance loading error
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching balance",
        description: error.message,
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }, [error, toast]);

  // Handle price loading error
  useEffect(() => {
    if (priceError) {
      toast({
        variant: "destructive",
        title: "Error fetching price",
        description: priceError.message,
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }, [priceError, toast]);

  // Handle config loading error

  // Hardcoded addresses
  const CASH =
    "0x27954378db5424cc3993e4e581975607440835f320d21aefade9909ccdc80628::cdp_multi::CASH";
  const SUPRA_COIN = "0x1::supra_coin::SupraCoin";
  const VAULT_SHARE =
    "0xa077104315d58de4a9e23dc66a4947e659609c0f95932a61f58089bc6c1bc729::vault_core::VaultShare";

  const handleOpenTrove = async () => {
    setIsModalVisible(true);
    await openTrove(Number(userInputs.borrow), Number(userInputs.collatoral));
  };


  // Handle closing modals
  const handleClose = () => {
    setLoadingModalVisible(false);
    setUserModal(false);
    router.refresh();
    window.location.reload();
  };

  // Dialog header
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

  return (
    <>
      {isClientLoading ? (
        <FullScreenLoader />
      ) : (
        <>
          <div className="h-full pt-3 font-poppins md:ml-0 px-5">
            <div
              className="flex justify-start -ml-6 items-center px-7 pt-3 cursor-pointer"
              onClick={() => {
                router.push("/borrow");
              }}
            >
              <ArrowLeft width={50} size={30} stroke="grey" />

              <p className="text-black font-medium flex gap-2">
                <Image src={imageSrc} alt="trove" height={40} width={40} />
                <p className="mt-2 text-white">{displayValue} Trove</p>
              </p>
            </div>
            <div className="container flex flex-col xl:flex-row p-8 xl:p-0 justify-between gap-x-20">
              <div className="grid  w-full md:w-1/2 items-start space-y-4 gap-2 text-white md:p-5">
                <div className="w-full">
                  <Label
                    htmlFor="items"
                    className="font-poppins ml-[-12px] md:ml-0 text-xl text-md text-[#1DBDAF]"
                    style={{
                      fontWeight: "500",
                      fontSize: "19px",
                      color: "white",
                    }}
                  >
                    Deposit collateral to mint $CASH
                  </Label>

                  <DynamicInput
                    id="depositCollateral"
                    label=""
                    icon={imageSrc}
                    symbol={displayValue}
                    placeholder="Enter the amount of collateral"
                    value={userInputs.collatoral}
                    onChange={(newValue) => {
                      let collValue = newValue;
                      const walletBalance = Number(balanceData);

                      if (!collValue || collValue === "0") {
                        setUserInputs({
                          collatoral: collValue,
                          borrow: "0",
                        });
                      } else {
                        setUserInputs({
                          ...userInputs,
                          collatoral: collValue,
                        });
                      }
                    }}
                    walletBalance={Number(balanceData)}
                    dollarValue={(
                      parseFloat(userInputs.collatoral || "0") * fetchedPrice
                    ).toFixed(2)}
                    dollarValueBalance={Number(
                      Number(balanceData) * fetchedPrice
                    ).toFixed(2)}
                    maxLength={8}
                    decimals={displayValue === "SUPRA" ? 2 : 6}
                    isLoading={isBalanceLoading || isPriceLoading}
                    isDisabled={!isConnected}
                    showPercentages={true}
                    errorMessage={
                      Number.parseFloat(userInputs.collatoral) >
                        Number(balanceData)
                        ? "Insufficient balance"
                        : ""
                    }
                    infoText="The amount of collateral asset in your wallet address."
                  />
                </div>
                {collateralEntered && Number(maxBorrow) <= config.minDebt && (
                  <div className="w-full rounded-lg">
                    <div className="flex items-center">
                      <p className="text-sm text-red-700 font-medium">
                        {(() => {
                          const message = getMinimumCollateralMessage();
                          if (!message) {
                            return `You need more ${displayValue} to open a trove. Minimum debt requirement is ${config.minDebt} CASH.`;
                          }
                          return `You need at least ${message.amount} ${message.token} (≈$${message.dollarValue}) to open a trove.`;
                        })()}
                      </p>
                    </div>
                  </div>
                )}
                {collateralEntered &&
                  Number.parseFloat(userInputs.collatoral) <=
                  Number(balanceData) && (
                    <>
                      <div className="w-full">
                        <Label
                          htmlFor="items"
                          className="font-poppins ml-[-12px] md:ml-0 text-2xl  text-[white]"
                          style={{ fontWeight: "500", fontSize: "19px" }}
                        >
                          Great, you got{" "}
                          <span className="font-poppins  text-[white] font-medium">
                            {maxBorrow >= 0
                              ? Math.floor(maxBorrow * 100) / 100
                              : "0.00"}{" "}
                            CASH
                          </span>{" "}
                          to mint
                        </Label>

                        <DynamicInput
                          id="borrowCash"
                          label=""
                          icon={ORE}
                          symbol="CASH"
                          placeholder="Enter the amount you want to mint"
                          value={userInputs.borrow}
                          onChange={(newValue) => {
                            setUserInputs({
                              ...userInputs,
                              borrow: newValue,
                            });
                          }}
                          walletBalance={maxBorrow >= 0 ? Number(maxBorrow) : 0}
                          dollarValue={Number(userInputs.borrow || "0").toFixed(
                            2
                          )}
                          dollarValueBalance={Number(
                            maxBorrow >= 0 ? Number(maxBorrow) : 0
                          ).toFixed(2)}
                          maxLength={6}
                          isLoading={false}
                          isDisabled={!isConnected}
                          showPercentages={true}
                          errorMessage={
                            Number.parseFloat(userInputs.borrow) >
                              Number(maxBorrow)
                              ? "Insufficient balance"
                              : Number(userInputs.borrow) < config.minDebt &&
                                Number(userInputs.borrow) > 0
                                ? `Borrow amount should be greater than ${config.minDebt}`
                                : Number(loanToValue) >= 40 &&
                                  Number(userInputs.borrow) >= config.minDebt
                                  ? "Your LTV is too high and Trove can be liquidated."
                                  : ""
                          }
                          infoText="The amount of $CASH you can borrow using the collateral asset you have entered."
                          balanceLabel="Available"
                        />

                        <Link
                          href={
                            displayValue === "SUPRA"
                              ? `/borrow/supra`
                              : `/borrow/stsupra`
                          }
                        >
                          <button
                            onClick={handleOpenTrove}
                            className={`mt-5 md:-ml-0 -ml-4 w-[300px] md:w-[500px] h-[3rem] font-poppins font-medium text-black
                                ${isBalanceLoading ||
                                isPriceLoading ||
                                isConfigLoading ||
                                gassAvail ||
                                !userInputs.borrow ||
                                !userInputs.collatoral ||
                                loanToValue > 100 / Number(divideBy) ||
                                Number.parseFloat(userInputs.borrow) >
                                maxBorrow ||
                                Number.parseFloat(userInputs.collatoral) >
                                Number(balanceData) ||
                                Number.parseFloat(userInputs.borrow) <
                                config.minDebt ||
                                isModalVisible
                                ? "cursor-not-allowed border text-gray-400 border-gray-400 bg-[black]"
                                : "hover:bg-[#2b4e51] bg-[#1DBDAF]"
                              }`}
                            disabled={
                              isBalanceLoading ||
                              isPriceLoading ||
                              isConfigLoading ||
                              gassAvail ||
                              !userInputs.borrow ||
                              !userInputs.collatoral ||
                              loanToValue > 100 / Number(divideBy) ||
                              Number.parseFloat(userInputs.borrow) >
                              maxBorrow ||
                              Number.parseFloat(userInputs.collatoral) >
                              Number(balanceData) ||
                              Number.parseFloat(userInputs.borrow) <
                              config.minDebt ||
                              isModalVisible
                            }
                          >
                            {isModalVisible ? (
                              "Opening Trove..."
                            ) : !gassAvail ? (
                              "Open Trove"
                            ) : (
                              <div className="relative group">
                                <div>Open Trove</div>
                                {/* Tooltip */}
                                <span className="absolute top-[125%] font-poppins left-1/2 -translate-x-1/2 w-[300px] bg-[#222222] text-[#1DBDAF] text-xs font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                  Ensure you have sufficient {displayValue} in
                                  your wallet to open a trove.
                                </span>
                              </div>
                            )}
                          </button>
                        </Link>
                      </div>
                    </>
                  )}
              </div>

              {bothInputsEntered &&
                Number(userInputs.borrow) >= config.minDebt &&
                Number.parseFloat(userInputs.collatoral) <=
                Number(balanceData) ? (
                <div
                  className="w-[300px] md:w-[400px] lg:w-1/2 mt-[55px]  p-5   h-fit space-y-5 text-white"
                  style={{ backgroundColor: "#222222" }}
                >
                  {isConfigLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full bg-gray-700" />
                      <Skeleton className="h-8 w-full bg-gray-700" />
                      <Skeleton className="h-8 w-full bg-gray-700" />
                      <Skeleton className="h-8 w-full bg-gray-700" />
                      <Skeleton className="h-8 w-full bg-gray-700" />
                    </div>
                  ) : (
                    <>
                      {/* Loan to value */}
                      <div className="flex whitespace-nowrap justify-between">
                        <div className="flex items-center">
                          <span className="font-poppins text-lg font-medium text-gray-400">
                            Loan-To-Value
                          </span>
                          <Image
                            width={15}
                            className="toolTipp ml_5"
                            src={info || "/placeholder.svg"}
                            data-pr-tooltip=""
                            alt="info"
                          />
                          <Tooltip
                            className="custom-tooltip font-poppins "
                            target=".toolTipp"
                            content="It is a ratio that measures the amount of a loan compared to the value of the collateral."
                            mouseTrack
                            mouseTrackLeft={10}
                          />
                        </div>
                        {!isTroveLoading ? (
                          <span
                            className={`overflow-x-clip text-lg font-poppins font-medium ${loanToValue <= 20
                                ? "text-green-500"
                                : loanToValue <= 40
                                  ? "text-yellow-500"
                                  : loanToValue <= 50
                                    ? "text-orange-500"
                                    : "text-red-500"
                              }`}
                          >
                            {loanToValue.toFixed(2)} %{" "}
                          </span>
                        ) : (
                          "--"
                        )}
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
                              {config.liquidationThreshold
                                ? Math.round(
                                  Number(
                                    (1 / config.liquidationThreshold) * 10000
                                  )
                                ).toFixed(2)
                                : "-"}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Liquidation price */}
                      <div className="flex justify-between">
                        <div className="items-center flex">
                          <span className=" text-lg font-poppins font-medium text-gray-400">
                            Liquidation Price
                          </span>
                        </div>
                        <span className=" text-lg font-poppins font-medium">
                          ${liquidationPrice.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex flex-row  ">
                        {" "}
                        <Image
                          src={info1 || "/placeholder.svg"}
                          alt="info"
                          className="mr-2 mt-[-1rem] 2xl:mt-0"
                        />
                        <p className="text-sm text-gray-400 font-poppins font-medium ">
                          If the market price falls below the liquidation price,
                          the Trove maybe liquidated.{" "}
                        </p>{" "}
                      </div>
                      <div>
                        <hr className="border-[#827f77] border-1" />
                      </div>
                      {/* Borrowed Amount */}
                      <div className="flex font-poppins whitespace-nowrap justify-between">
                        <div className="flex items-center">
                          <span className="font-poppins text-sm font-medium text-gray-400">
                            Borrowed Amount
                          </span>
                          <Image
                            width={15}
                            className="toolTipHoldingfee7 ml_5 "
                            src={info || "/placeholder.svg"}
                            data-pr-tooltip=""
                            alt="info"
                          />
                          <Tooltip
                            className="custom-tooltip font-poppins "
                            target=".toolTipHoldingfee7"
                            mouseTrack
                            content="The amount of $CASH you are borrowing."
                            mouseTrackLeft={10}
                          />
                        </div>
                        <span className="font-poppins text-sm font-poppins font-medium">
                          {Number(userInputs.borrow).toFixed(2)} CASH
                        </span>
                      </div>
                      {/* Liquidity reserve */}
                      <div className="flex font-poppins whitespace-nowrap justify-between">
                        <div className="flex items-center">
                          <span className="font-poppins text-sm font-medium text-gray-400">
                            Liquidation Reserve
                          </span>
                          <Image
                            width={15}
                            className="toolTipHolding7 ml_5 -mt-[px]"
                            src={info || "/placeholder.svg"}
                            data-pr-tooltip=""
                            alt="info"
                          />
                          <Tooltip
                            className="custom-tooltip font-poppins "
                            target=".toolTipHolding7"
                            mouseTrack
                            content="The refundable amount of debt set aside as a buffer to cover potential liquidation. This reserve compensates for the gas fees paid by the liquidator."
                            mouseTrackLeft={10}
                          />
                        </div>
                        <span className="font-poppins text-sm font-poppins font-medium">
                          {config.liquidationReserve.toFixed(2)} CASH
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-poppins font-medium text-gray-400">
                            Borrowing Fee
                          </span>
                          <Image
                            width={15}
                            className="toolTipHolding12 ml_5"
                            src={info || "/placeholder.svg"}
                            data-pr-tooltip=""
                            alt="info"
                          />
                          <Tooltip
                            className="custom-tooltip font-poppins "
                            target=".toolTipHolding12"
                            mouseTrack
                            content="One-time fee charged on the borrowed amount."
                            mouseTrackLeft={10}
                          />
                        </div>
                        <span className="text-sm font-poppins font-medium">
                          {calculations.expectedFee.toFixed(2)} CASH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className=" text-lg font-poppins font-medium text-gray-400">
                            Total Debt
                          </span>{" "}
                          <Image
                            width={15}
                            className="toolTipHolding16 ml_5"
                            src={info || "/placeholder.svg"}
                            data-pr-tooltip=""
                            alt="info"
                          />
                          <Tooltip
                            className="custom-tooltip font-poppins "
                            target=".toolTipHolding16"
                            content="Total amount of stablecoin borrowed + liquidation reserve + borrowing fee."
                            mouseTrack
                            mouseTrackLeft={10}
                          />
                        </div>
                        {Number(calculations.expectedDebt) >
                          config.liquidationReserve ? (
                          <span className=" text-lg font-poppins font-medium">
                            {calculations.expectedDebt.toFixed(2)} CASH
                          </span>
                        ) : (
                          "---"
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="r md:w-1/2 w-full mt-[55px] p-5 border-border-[white]-200  h-fit space-y-5  text-white"></div>
              )}
            </div>
          </div>
          <Dialog
            visible={loadingModalVisible}
            onHide={() => setLoadingModalVisible(false)}
          >
            <div className="dialog-overlay flex items-center justify-center">
              <div
                className="dialog-content w-[90%] max-w-[380px]  bg-black
  p-6 flex flex-col justify-around border border-gray-400"
                style={{ height: "450px" }}
              >
                <div className="p-5">
                  {loadingMessage === "Waiting for transaction to confirm.." ? (
                    <>
                      <Image
                        src={conf || "/placeholder.svg"}
                        alt="rectangle"
                        width={150}
                      />

                      <div className="my-5 ml-[6rem] mt-12"></div>
                      <div className="waiting-message font-poppins font-bold  text-[white]">
                        {loadingMessage}
                      </div>
                    </>
                  ) : loadingMessage === "Trove opened successfully" ? (
                    <>
                      <Image
                        src={tick || "/placeholder.svg"}
                        alt="tick"
                        width={150}
                      />

                      <div className="waiting-message font-poppins font-bold  text-[white]">
                        {loadingMessage}
                      </div>
                      <div className="text-black w-full mt-4 bg-[#222222] flex text-sm flex-col p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            You deposited:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {userInputs.collatoral} {displayValue}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            You borrowed:
                          </span>
                          <span className="text-[white] font-medium text-sm">
                            {userInputs.borrow} CASH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[white] font-medium text-sm">
                            Transaction hash:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[white] font-medium text-sm">
                              {shortenedHash}
                            </span>
                            <Link
                              href={`https://suprascan.io/tx/${hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                src={arrow || "/placeholder.svg"}
                                alt="copy"
                                className="h-4 cursor-pointer"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : transactionRejected ? (
                    <>
                      {" "}
                      <Image
                        src={rej || "/placeholder.svg"}
                        alt="rejected"
                        width={150}
                      />
                      <div className="my-5 ml-[6rem] mb-5"></div>
                      <div className="waiting-message font-poppins font-bold text-[white]">
                        {loadingMessage}
                      </div>
                    </>
                  ) : (
                    <Image
                      src={conf || "/placeholder.svg"}
                      alt="box"
                      width={150}
                    />
                  )}

                  {isSuccess && (
                    <button
                      className="mt-[8px] p-3 w-full text-black font-poppins font-bold hover:bg-[#2b4e51] bg-[#1DBDAF]"
                      onClick={handleClose}
                    >
                      Close
                    </button>
                  )}
                  {(transactionRejected || (!isSuccess && showCloseButton)) && (
                    <>
                      <p className="font-poppins text-[white] text-xs mt-2 mb-4">
                        {transactionRejected
                          ? "Transaction was rejected. Please try again."
                          : "Some Error Occurred On Network Please Try Again After Some Time.. 🤖"}
                      </p>
                      <Button
                        className=" mt-0.5 p-3 hover:bg-[#2b4e51] font-bold rounded-none md:w-[14rem] text-black font-poppins bg-[#1dbdaf] "
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
        </>
      )}
    </>
  );
};
