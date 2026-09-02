import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog } from "primereact/dialog";
import { SupraClient, BCS, TxnBuilderTypes, HexString } from "supra-l1-sdk";
import { useWallet } from "../../context/WalletContext";
import {
  module_address,
  module_name,
  stable_coin,
  supra_coin,
  stsupra_coin
} from "@/constants/constants";
import { formatLargeNumber } from "@/components/getActualDecimal";
import stSupraLogo from "@/app/assets/images/flow/stSupra.png";


// Components
import FullScreenLoader from "@/components/FullScreenLoader";
import AddressDisplayLiquidation from "../../components/AddressDisplayLiquidation";

// Assets
import supraLogo from "../assets/images/SUPRA.png";
import errorImage from "../assets/images/TxnError.gif";
import loadingImage from "../assets/images/Loader 1.gif";
import successImage from "../assets/images/Done_Solido.gif";
import arrowIcon from "../assets/arrow.svg";

// Styles
import "./index.css";
import "../../app/App.css";

interface Position {
  _id: string;
  collateralAddress: string;
  walletAddress: string;
  totalCollateral: string;
  totalDebt: string;
  nltv: string;
  NICR: number;
  positionID?: number;
  status?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalRecords: number;
}

interface ProtocolMetric {
  token: string;
  minDebt: number;
  liquidationReserve: number;
  liquidationThreshold: number;
  price: number;
  liquidationPenalty: number;
}

export default function LiquidatePositions() {
  const { isInstalled, account, balance } = useWallet();
  const supraProvider =
    typeof window !== "undefined" && (window as any)?.starkey?.supra;

  // Collateral and asset selection
  const [activeCollateralType, setActiveCollateralType] = useState("SUPRA");

  // Position data states
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [currentLiquidationPosition, setCurrentLiquidationPosition] =
    useState<Position | null>(null);

  // Pagination states
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalRecords: 0,
  });

  // Protocol parameters
  const [collateralPrice, setCollateralPrice] = useState(0);
  const [minimumDebt, setMinimumDebt] = useState(0);
  const [liquidationReserve, setLiquidationReserve] = useState(0);
  const [liquidationThreshold, setLiquidationThreshold] = useState(0);
  const [liquidationPenalty, setLiquidationPenalty] = useState(0);

  // User data
  const [cashBalance, setCashBalance] = useState(0);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);

  // Transaction states
  const [transactionHash, setTransactionHash] = useState("");
  const [isTransactionSuccessful, setIsTransactionSuccessful] = useState(false);
  const [isTransactionRejected, setIsTransactionRejected] = useState(false);
  const [transactionError, setTransactionError] = useState(false);

  // Modal states
  const [isPrimaryModalVisible, setIsPrimaryModalVisible] = useState(false);
  const [isTransactionModalVisible, setIsTransactionModalVisible] =
    useState(false);
  const [transactionStatusMessage, setTransactionStatusMessage] = useState("");
  const [showCloseButton, setShowCloseButton] = useState(false);

  const shortenedHash = `${transactionHash.slice(
    0,
    6
  )}...${transactionHash.slice(-4)}`;

  const stSupraAddress = "0x81846514536430ea934c7270f86cf5b067e2a2faef0e91379b4f284e91c7f53c";

  const fetchPositionsData = async (page = 1, pageSize = 25) => {
    if (collateralPrice <= 0) return;

    try {
      setIsLoadingPositions(true);

      // Determine which collateral to fetch
      const collateralAddress =
        activeCollateralType === "SUPRA" ? "0x1" : stSupraAddress;

      // Fetch positions from API
      const response = await axios.get(
        `https://api.solido.money/positions/sortedNICR?collAddress=${collateralAddress}&page=${page}&pageSize=${pageSize}`
      );

      const data = response.data.data || response.data.positions || response.data;
      const totalRecords =
        response.data.pagination?.totalPositions ||
        response.data.totalRecords ||
        data.length;

      // Process positions: filter by collateral & calculate nltv
      const processedPositions = data
        .filter((item: any) =>
          activeCollateralType === "SUPRA"
            ? item.collAddress === "0x1"
            : item.collAddress.toLowerCase() === stSupraAddress.toLowerCase()
        )
        .map((item: any) => {
          const totalCollateral = Number(item.coll || item.totalCollateral) || 0;
          const totalDebt = Number(item.debt || item.totalDebt) || 0;
          const NICR = Number(item.NICR) || 0;

          const nltvValue = NICR * collateralPrice * 100;

          return {
            _id: item.positionID || item._id,
            collateralAddress: item.collAddress,
            walletAddress: item.walletAddress,
            totalCollateral: totalCollateral.toString(),
            totalDebt: totalDebt.toString(),
            NICR,
            nltv: nltvValue.toString(),
            status: item.status,
          };
        })
        .filter((item: any) => !isNaN(Number(item.nltv)));

      setPositions(processedPositions);
      setFilteredPositions(processedPositions);
      setPaginationState({
        page,
        pageSize,
        totalRecords,
      });
    } catch (error) {
      console.error("Error fetching positions data:", error);
    } finally {
      setIsLoadingPositions(false);
    }
  };


  // Handle DataTable pagination
  const handlePageChange = (event: any) => {
    const newPage = event.page + 1; // PrimeReact uses 0-based indexing
    const newPageSize = event.rows;

    setPaginationState((prev) => ({
      ...prev,
      page: newPage,
      pageSize: newPageSize,
    }));

    fetchPositionsData(newPage, newPageSize);
  };

  // Fetch protocol configuration
  const fetchProtocolConfig = async () => {
    try {
      const response = await axios.get(
        "https://api.solido.money/protocol/metrics"
      );
      if (response.data) {
        const metrics = response.data.metrics;
        const activeMetric = metrics.find(
          (metric: ProtocolMetric) => metric.token === activeCollateralType
        );

        if (activeMetric) {
          setMinimumDebt(activeMetric.minDebt);
          setLiquidationReserve(activeMetric.liquidationReserve);
          setLiquidationThreshold(activeMetric.liquidationThreshold);
          setCollateralPrice(activeMetric.price);
          setLiquidationPenalty(activeMetric.liquidationPenalty);
        }
      } else {
        throw new Error("Invalid protocol metrics data received");
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching protocol metrics:", err.message);
      } else {
        console.error("Unexpected error while fetching protocol metrics:", err);
      }
    }
  };

  // Fetch user's CASH balance
  const fetchCashBalance = async () => {
    if (!SupraClient || !account || account.length === 0) {
      return;
    }

    try {
      const supraClient = new SupraClient("https://rpc-mainnet.supra.com/");

      try {
        const rawBalance = await supraClient?.getAccountCoinBalance(
          HexString.ensure(account),
          stable_coin
        );
        const convertedBalance =
          typeof rawBalance === "bigint"
            ? Number(rawBalance.toString()) / 100000000
            : rawBalance / 100000000;
        setCashBalance(convertedBalance);
        localStorage.setItem("cashBalance", convertedBalance.toString());
      } catch (resourceError) {
        setCashBalance(0);
        localStorage.setItem("cashBalance", "0");
      }
    } catch (err) {
      console.error("Error fetching CASH balance:", err);
      setCashBalance(0);
    }
  };

  // Close modal and refresh data
  const handleCloseModal = useCallback(() => {
    setIsTransactionModalVisible(false);
    setIsPrimaryModalVisible(false);
    setIsTransactionRejected(false);
    window.location.reload();
  }, []);

  // Execute liquidation transaction
  const handleLiquidate = async (
    walletAddress: string,
    totalDebt: string,
    position: Position
  ) => {
    setIsSubmitting(true);
    setIsPrimaryModalVisible(true);
    setCurrentLiquidationPosition(position);

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
        module_address,
        module_name,
        "liquidate",
        [activeCollateralType === "SUPRA" ? supra_coin : stsupra_coin],
        [
          BCS.bcsToBytes(
            TxnBuilderTypes.AccountAddress.fromHex(walletAddress.toLowerCase())
          ),
        ],
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

      setIsTransactionSuccessful(true);
      setTransactionHash(txHash);
    } catch (err) {
      setTransactionError(true);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error in handleLiquidate:", errorMessage);
      setIsTransactionRejected(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update UI with transaction status
  useEffect(() => {
    if (transactionError) {
      console.error("Transaction error detected");
      setIsTransactionRejected(true);
    }
  }, [transactionError]);

  // Update modal state based on transaction status
  useEffect(() => {
    if (isSubmitting) {
      setIsPrimaryModalVisible(false);
      setTransactionStatusMessage("Waiting for transaction to confirm..");
      setIsTransactionModalVisible(true);
    } else if (isTransactionSuccessful) {
      setTransactionStatusMessage("Liquidated successfully.");
      setIsTransactionModalVisible(true);
    } else if (isTransactionRejected) {
      setTransactionStatusMessage("Transaction was rejected");
      setIsTransactionModalVisible(true);
    }
  }, [isTransactionSuccessful, isSubmitting, isTransactionRejected]);

  // Show close button after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCloseButton(true);
    }, 180000); // 3 minutes
    return () => clearTimeout(timer);
  }, []);

  // Load initial data when component mounts or dependencies change
  useEffect(() => {
    fetchProtocolConfig();
    fetchCashBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, activeCollateralType]);

  // Update position data when price or collateral type changes
  useEffect(() => {
    fetchPositionsData(paginationState.page, paginationState.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collateralPrice, activeCollateralType]);

  // Render liquidate button with appropriate state
  const renderLiquidateButton = (position: Position) => {
    const canLiquidate = parseFloat(position.nltv) < liquidationThreshold;
    const hasEnoughCash = cashBalance > parseFloat(position.totalDebt);
    const isButtonDisabled = !(canLiquidate && hasEnoughCash);

    return (
      <div className="p-5">
        <button
          onClick={() =>
            handleLiquidate(
              position.walletAddress,
              position.totalDebt,
              position
            )
          }
          className={`w-[113px] h-[38px] 
            ${isButtonDisabled
              ? "bg[black] text-gray-400 border border-gray-400 cursor-not-allowed " // Disabled styles
              : "bg-gradient-to-r from-[#1DBDAF] via-[#1DBDAF] to-[#1dbdaf] text-black" // Enabled styles
            }`}
          disabled={isButtonDisabled}
        >
          Liquidate
        </button>
        {isButtonDisabled && (
          <div className="relative group ">
            {/* Tooltip */}
            <span className="absolute bottom-[10%] left-0 font-poppins w-[200px] bg-[#2F2F2F] text-[#1DBDAF] text-xs font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
              Either this position cannot be liquidated or you do not have
              enough $CASH in your wallet.
            </span>
          </div>
        )}
      </div>
    );
  };

  // Show loading state
  if (isLoadingPositions) {
    return <FullScreenLoader />;
  }

  return (
    <div className="card w-full ">
      {/* Collateral type selection tabs */}
      <div className="pb-1 threeButtons gap-x-4 flex items-right w-full h-10 my-2">
        {/* SUPRA Tab */}
        <div
          className={`items-center gap-2 flex w-auto px-4 text-lg body-text border-2 border-[#1DBDAF] h-fit p-1 cursor-pointer ${activeCollateralType === "SUPRA"
              ? "bg-[#1DBDAF] text-white"
              : "text-white"
            }`}
          onClick={() => setActiveCollateralType("SUPRA")}
        >
          <Image src={supraLogo} alt="SUPRA" width={40} className="p-1" />
          <p
            className={`body-text text-xs font-semibold ${activeCollateralType === "SUPRA" ? "text-white" : "text-white"
              }`}
          >
            SUPRA
          </p>
        </div>

        {/* stSUPRA Tab */}
        <div
          className={`items-center gap-2 flex w-auto px-4 text-lg body-text border-2 border-[#1DBDAF] h-fit p-1 cursor-pointer ${activeCollateralType === "stSUPRA"
              ? "bg-[#1DBDAF] text-white"
              : "text-white"
            }`}
          onClick={() => setActiveCollateralType("stSUPRA")}
        >
          <Image src={stSupraLogo} alt="stSUPRA" width={40} className="p-1" />
          <p
            className={`body-text text-xs font-semibold ${activeCollateralType === "stSUPRA" ? "text-white" : "text-white"
              }`}
          >
            stSUPRA
          </p>
        </div>
      </div>



      {/* Position data table */}
      <div className="w-full mt-6 border-2 border-[#1DBDAF] overflow-x-auto">
        <DataTable
          tableStyle={{ minWidth: "61rem" }}
          value={filteredPositions}
          dataKey="_id"
          paginator
          first={(paginationState.page - 1) * paginationState.pageSize}
          rows={paginationState.pageSize}
          totalRecords={paginationState.totalRecords}
          onPage={handlePageChange}
          style={{ color: "white", marginBottom: "20px" }}
          rowClassName={() => "border-gray-300 body-text"}
          scrollable={true}
          className="min-w-[500px] w-full"
          lazy
        >
          <Column
            field="walletAddress"
            header={
              <div className="body-text text-xs md:text-base text-black pl-4 md:pl-12 flex items-center">
                Wallet Address
              </div>
            }
            body={(rowData: Position) => (
              <AddressDisplayLiquidation address={rowData.walletAddress} />
            )}
            bodyClassName="body-text pl-4 md:pl-12 text-white"
          />
          <Column
            field="totalCollateral"
            header={
              <span className="body-text text-black text-xs md:text-base">
                Total Collateral
              </span>
            }
            body={(rowData: Position) =>
              `${formatLargeNumber(Number(rowData.totalCollateral))} ${rowData?.collateralAddress === "0x1" ? "SUPRA" : "stSUPRA"
              }`
            }
            bodyClassName="body-text text-white"
          />
          <Column
            field="totalDebt"
            header={
              <span className="body-text text-black text-xs md:text-base">
                Total Debt
              </span>
            }
            body={(rowData: Position) =>
              `${formatLargeNumber(Number(rowData.totalDebt))} CASH`
            }
            bodyClassName="body-text text-white"
          />

          <Column
            field="nltv"
            header={
              <span className="body-text text-black flex items-center gap-2 relative group text-xs md:text-base">
                Trove LTV
                <div className="relative"></div>
              </span>
            }
            body={(rowData: Position) => {
              const ltvRatio = 10000 / Number(rowData.nltv);
              let textColor = "white";
              if (ltvRatio <= 20) {
                textColor = "green";
              } else if (ltvRatio <= 40) {
                textColor = "yellow";
              } else if (ltvRatio < 50) {
                textColor = "orange";
              } else {
                textColor = "red";
              }
              return (
                <span className="body-text" style={{ color: textColor }}>
                  {ltvRatio.toFixed(2)} %
                </span>
              );
            }}
          />
          <Column
            body={renderLiquidateButton}
            style={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Transaction status modal */}
      <Dialog
        visible={isTransactionModalVisible}
        onHide={() => setIsTransactionModalVisible(false)}
      >
        <div className="dialog-overlay">
          <div className="dialog-content bg-black border border-gray-400">
            <div className="p-5">
              {transactionStatusMessage ===
                "Waiting for transaction to confirm.." ? (
                <>
                  <Image src={loadingImage} alt="loading" width={150} />
                  <div className="my-5 ml-[6rem] mt-12"></div>
                </>
              ) : transactionStatusMessage === "Liquidated successfully." ? (
                <>
                  <Image src={successImage} alt="success" width={100} />
                  <div className="waiting-message font-bold font-poppins text-[#1DBDAF] text-center mt-4">
                    {transactionStatusMessage}
                  </div>
                  <div className="text-black w-full h-auto mt-4 bg-[#222222] p-4 rounded-md">
                    <p className="text-[#1DBDAF] mt-2 text-sm flex justify-between font-medium">
                      <p className="text-[white] text-sm font-medium">
                        You repaid:
                      </p>
                      {currentLiquidationPosition &&
                        formatLargeNumber(
                          Number(currentLiquidationPosition.totalDebt)
                        )}{" "}
                      CASH
                    </p>

                    <p className="text-[#1DBDAF] mt-2 text-sm flex justify-between font-medium">
                      <p className="text-[white] text-sm font-medium">
                        You received:
                      </p>
                      {liquidationReserve}CASH+
                      {currentLiquidationPosition &&
                        formatLargeNumber(
                          Number(
                            (Number(currentLiquidationPosition.totalDebt) *
                              (1 + liquidationPenalty)) /
                            collateralPrice
                          )
                        )}{" "}
                      SUPRA
                    </p>

                    <p className="text-[#1DBDAF] mt-2 flex justify-between text-smfont-medium">
                      <p className="text-[white] font-medium text-sm">
                        Transaction hash:
                      </p>
                      <div className="flex gap-2 text-sm">
                        <p>{shortenedHash}</p>
                        <Link
                          href={`https://suprascan.io/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src={arrowIcon}
                            alt="view transaction"
                            className="h-6 cursor-pointer"
                          />
                        </Link>
                      </div>
                    </p>
                  </div>
                </>
              ) : isTransactionRejected ? (
                <>
                  <Image src={errorImage} alt="rejected" width={150} />
                  <div className="my-5 ml-[6rem] mb-5"></div>
                </>
              ) : (
                <Image src={loadingImage} alt="loading" width={150} />
              )}
              <div className="waiting-message title-text2 text-[#1DBDAF]">
                {transactionStatusMessage}
              </div>
              {isTransactionSuccessful && (
                <button
                  className="mt-1 p-3 text-white title-text2 hover:bg-[#41eee0] bg-[#1DBDAF]"
                  onClick={handleCloseModal}
                >
                  Liquidation Successful
                </button>
              )}
              {(isTransactionRejected ||
                (!isTransactionSuccessful && showCloseButton)) && (
                  <>
                    <p className="body-text text-[#1DBDAF] text-xs">
                      {isTransactionRejected
                        ? "Transaction was rejected. Please try again."
                        : "Some Error Occurred On Network Please Try Again After Some Time.. 🤖"}
                    </p>
                    <Button
                      className="mt-0.5 p-3 rounded-none md:w-[20rem] text-white title-text2 hover:bg-[#41eee0] bg-[#1DBDAF]"
                      onClick={handleCloseModal}
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
  );
}
