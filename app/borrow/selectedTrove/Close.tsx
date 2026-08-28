"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import Link from "next/link";
import Image from "next/image";
import arrow from "../../assets/arrow.svg";
import rej from "../../assets/images/TxnError.gif";
import info from "../../assets/images/info.svg";
import conf from "../../assets/images/Loader 1.gif";
import tick from "../../assets/images/Done_Solido.gif";
import "../../../app/App.css";
import "./closed.css";
import "../../../components/stabilityPool/Modal.css";
import { Button } from "@/components/ui/button";
import { Tooltip } from "primereact/tooltip";
import { BCS, TxnBuilderTypes, HexString } from "supra-l1-sdk";
import { useWallet } from "../../../context/WalletContext";
import {
  module_address,
  module_name,
  supra_coin,
  stsupra_coin,
} from "@/constants/constants";
import { useRouter } from "next/navigation";
import alert from "../../assets/images/alert.svg";
import { ArrowRight } from "lucide-react";

interface Props {
  entireDebtAndColl: number;
  debt: number;
  liquidationReserve: number;
  debtwithoutDecimals: number;
  balanceAmount: number;
  displayValue?: "SUPRA" | "stSUPRA";
}

export const CloseTrove: React.FC<Props> = ({
  entireDebtAndColl,
  debt,
  liquidationReserve,
  debtwithoutDecimals,
  balanceAmount,
  displayValue = "SUPRA",
}) => {
  const { isInstalled, account, balance } = useWallet();
  let supraProvider: any =
    typeof window !== "undefined" && (window as any)?.starkey?.supra;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLowBalance, setIsLowBalance] = useState(false);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [afterLoad, setAfterload] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [transactionRejected, setTransactionRejected] = useState(false);

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [hash, setHash] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(false);
  // displayValue is now passed as a prop

  const router = useRouter();

  useEffect(() => {
    if (account && account != "undefined") {
      setIsConnected(true);
      checkCashBalance();
    } else {
      setIsConnected(false);
    }
  }, [account]);

  const handleClose = useCallback(() => {
    setLoadingModalVisible(false);
    setUserModal(false);
    setIsModalVisible(false);
    setTransactionRejected(false);

    if (isSuccess) {
      router.push("/borrow"); // Redirect to trove page on successful close
    } else {
      router.refresh();
      window.location.reload();
    }
  }, [router, isSuccess]);

  const checkCashBalance = async () => {
    try {
      if (Number(balanceAmount) < debt - liquidationReserve) {
        setIsLowBalance(true);
      }

      setAfterload(false);
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
    }
  };

  const handleTroveClose = async (cash: number, collateral: number) => {
    setisLoading(true);
    setIsModalVisible(true);
    cash = Math.floor(Number(cash) * 100000000);
    collateral = Math.floor(Number(collateral) * 100000000);

    try {
      const provider = window.starkey?.supra;
      if (!provider) {
        throw new Error("Wallet provider not found");
      }

      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const optionalTransactionPayloadArgs = {
        txExpiryTime,
      };

      const rawTx = [
        account,
        0,
        module_address, // cdpContract
        module_name,
        "close_trove",
        displayValue === "SUPRA" ? [supra_coin] : [stsupra_coin],
        [],
        optionalTransactionPayloadArgs,
      ];

      const data = await supraProvider.createRawTransactionData(rawTx);
      if (!data) {
        throw new Error("Failed to create raw transaction data");
      }

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
      console.error("Error in handle:", err);
    } finally {
      setisLoading(false);
    }
  };
  useEffect(() => {
    if (error) {
      console.error("Write contract error:");
      setTransactionRejected(true);
      setUserModal(true);
    }
  }, [error]);

  useEffect(() => {
    if (isLoading) {
      setIsModalVisible(false);
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);
    } else if (isSuccess) {
      setLoadingMessage("Trove closed successfully.");
      setLoadingModalVisible(true);
    } else if (transactionRejected) {
      setLoadingMessage("Transaction was rejected");
      setLoadingModalVisible(true);
    }
  }, [isSuccess, isLoading, transactionRejected]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCloseButton(true);
    }, 180000);
    return () => clearTimeout(timer);
  }, []);

  const shortenedHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`; // Shorten the hash

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
      <div className="h-6"></div>
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
      </div> */}
      <div className="md:w-[60rem] flex md:-ml-0 w-[2rem] bg-black">
        <div className="relative text-white text-base flex flex-col  gap-2 p-5 md:p-10">
          <div className="space-y-7">
            {/* collateral */}
            <div className="flex md:gap-52 justify-between">
              <span className="flex">
                <span className="md:ml-0 ml-1 text-sm body-text text-white font-medium">
                  Collateral
                </span>
                <Image
                  width={15}
                  className="toolTipHolding5 ml_5 -mt-[3px]"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins "
                  target=".toolTipHolding5"
                  mouseTrack
                  content="Total amount of collateral supplied in the position."
                  mouseTrackLeft={10}
                />
              </span>
              {Number(entireDebtAndColl) <= 0 ? (
                "--"
              ) : (
                <span className="body-text font-medium text-sm md:mr-0 mr-4 whitespace-nowrap text-white">
                  {displayValue === "stSUPRA"
                    ? Number(entireDebtAndColl).toFixed(6)
                    : Number(entireDebtAndColl).toFixed(2)}{" "}
                  {displayValue}
                </span>
              )}
            </div>
            {/* debt */}
            <div className="flex justify-between">
              <div className="flex">
                <span className="md:ml-0 ml-1 text-sm body-text text-white font-medium">
                  Trove Debt
                </span>
                <Image
                  width={15}
                  className="toolTipHolding6 ml_5 -mt-[5px]"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins"
                  target=".toolTipHolding6"
                  mouseTrack
                  content="The amount of stablecoin you owe."
                  mouseTrackLeft={10}
                />
              </div>
              {Number(debt) <= 0 ? (
                "---"
              ) : (
                <span className="body-text font-medium text-sm md:mr-0 mr-4 whitespace-nowrap text-white">
                  {Number(debt).toFixed(2)} CASH
                </span>
              )}
            </div>
            {/* liquidation reserve */}
            <div className="flex justify-between">
              <div className="flex">
                <span className="md:ml-0 ml-1 text-sm body-text font-medium text-white">
                  Liquidation Reserve
                </span>
                <Image
                  width={15}
                  className="toolTipHolding7 ml_5 -mt-[px]"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins"
                  target=".toolTipHolding7"
                  mouseTrack
                  content="The refundable amount of debt set aside as a buffer to cover potential liquidation. This reserve compensates for the gas fees paid by the liquidator."
                  mouseTrackLeft={10}
                />
              </div>
              {Number(liquidationReserve) <= 0 ? (
                "--"
              ) : (
                <span className="body-text md:mr-0 mr-4 font-medium text-sm text-white">
                  {Number(liquidationReserve).toFixed(2)} CASH
                </span>
              )}
            </div>
            {/* wallet balance */}
            <div className="flex justify-between">
              <div className="flex">
                <span className="body-text font-medium text-white text-sm ml-1 md:ml-0">
                  Required Balance
                </span>
                <Image
                  width={15}
                  className="toolTipHoldingRequired ml_5"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins"
                  target=".toolTipHoldingRequired"
                  mouseTrack
                  content="The amount of $CASH required to close the trove."
                  mouseTrackLeft={10}
                />
              </div>
              <span className="body-text font-medium text-sm mr-4 md:mr-0 text-white">
                {afterLoad ? (
                  <div className="h-2 mr-20 text-left">
                    <div className="hex-loader"></div>
                  </div>
                ) : (
                  `${Number(debt - liquidationReserve).toFixed(2)} CASH`
                )}
              </span>
            </div>

            {/* wallet balance */}
            <div className="flex justify-between">
              <div className="flex">
                <span className="body-text font-medium text-white text-sm ml-1 md:ml-0">
                  Wallet Balance
                </span>
                <Image
                  width={15}
                  className="toolTipHoldingWallet ml_5"
                  src={info}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="custom-tooltip font-poppins"
                  target=".toolTipHoldingWallet"
                  mouseTrack
                  content="The amount of $CASH in your wallet."
                  mouseTrackLeft={10}
                />
              </div>
              <span className="body-text font-medium text-sm mr-4 md:mr-0 text-white">
                {afterLoad ? (
                  <div className="h-2 mr-20 text-left">
                    <div className="hex-loader"></div>
                  </div>
                ) : (
                  `${Number(balanceAmount).toFixed(2)} CASH`
                )}
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              handleTroveClose(
                Number(debtwithoutDecimals),
                Number(entireDebtAndColl)
              )
            }
            disabled={isLowBalance || afterLoad}
            className={` mt-20 md:w-full md:ml-0 ml-1 w-[18.2rem] h-[3rem] bg-[#1DBDAF] font-bold text-black title-text ${isLowBalance || afterLoad
                ? "bg-black border border-gray-400 text-gray-400 cursor-not-allowed opacity-50"
                : "hover:bg-[#2b4e51] cursor-pointer"
              }`}
          >
            Close Trove
          </button>
          <div className="text-red-500 text-sm font-medium body-text w-full ml-1">
            {isLowBalance ? "Low balance: Unable to close trove" : null}
          </div>
        </div>
        <Dialog
          visible={loadingModalVisible}
          onHide={() => setLoadingModalVisible(false)}
        >
          <div className="dialog-overlay flex items-center justify-center">
            <div
              className="dialog-content w-[90%] max-w-[380px]  bg-[#222222]  p-6 flex flex-col justify-around border border-gray-400"
              style={{ height: "450px" }}
            >
              <div className="p-5">
                {loadingMessage === "Waiting for transaction to confirm.." ? (
                  <>
                    <Image src={conf} alt="rectangle" width={150} />
                    <div className="my-5 ml-[6rem] mt-12"></div>
                    <div className="waiting-message font-bold font-poppins text-[#1DBDAF]">
                      {loadingMessage}
                    </div>
                  </>
                ) : loadingMessage === "Trove closed successfully." ? (
                  <>
                    <Image src={tick} alt="tick" width={150} />
                    <div className="waiting-message font-bold font-poppins text-[#1DBDAF]">
                      {loadingMessage}
                    </div>
                    <div className="text-black w-full mt-4 bg-[#2F2F2F] ftext-sm lex flex-col p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white font-medium text-sm">
                          You repaid:
                        </span>
                        <span className="text-[#1DBDAF] font-medium text-sm">
                          {" "}
                          {Number(debt).toFixed(2)} CASH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white font-medium text-sm">
                          You withdrew:
                        </span>
                        <span className="text-[#1DBDAF] font-medium text-sm">
                          {displayValue === "stSUPRA"
                            ? Number(entireDebtAndColl).toFixed(6)
                            : Number(entireDebtAndColl).toFixed(2)}{" "}
                          {displayValue}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white font-medium text-sm">
                          Transaction hash:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[#1DBDAF] font-medium text-sm">
                            {shortenedHash}
                          </span>
                          <Link
                            href={`https://suprascan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Image
                              src={arrow}
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
                    <Image src={rej} alt="rejected" width={150} />
                    <div className="my-5 ml-[6rem] mb-5"></div>
                    <div className="waiting-message font-bold font-poppins text-[#1DBDAF]">
                      {loadingMessage}
                    </div>
                  </>
                ) : (
                  <>
                    <Image src={conf} alt="box" width={150} />
                    <div className="waiting-message font-poppins text-[#1DBDAF]">
                      {loadingMessage}
                    </div>
                  </>
                )}

                {isSuccess && (
                  <button
                    className="mt-[8px]  p-3 text-black w-full font-poppins hover:bg-[#2b4e51] bg-[#1dbdaf]"
                    onClick={handleClose}
                  >
                    Close
                  </button>
                )}
                {(transactionRejected || (!isSuccess && showCloseButton)) && (
                  <>
                    <p className="body-text text-[#1DBDAF] text-xs">
                      {transactionRejected
                        ? "Transaction was rejected. Please try again."
                        : "Some Error Occurred On Network Please Try Again After Some Time.. 🤖"}
                    </p>
                    <Button
                      className=" mt-0.5 p-3 rounded-none md:w-[20rem] text-black font-poppins hover:bg-[#2b4e51] bg-[#1dbdaf]"
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
