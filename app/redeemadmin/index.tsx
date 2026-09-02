/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  stsupra_coin,
} from "@/constants/constants";
import { formatLargeNumber } from "@/components/getActualDecimal";

// Components
import FullScreenLoader from "@/components/FullScreenLoader";
import AddressDisplayLiquidation from "../../components/AddressDisplayLiquidation";

// Assets
import supraLogo from "../assets/images/SUPRA.png";
import stSUPRA from "@/app/assets/images/flow/stSupra.png";
import errorImage from "../assets/images/TxnError.gif";
import loadingImage from "../assets/images/Loader 1.gif";
import successImage from "../assets/images/Done_Solido.gif";
import arrowIcon from "../assets/arrow.svg";

// Styles
import "../liquidate/index.css";
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
  redeemAmount?: string;
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
  redemptionFee: number;
  redemptionGratuity: number;
}

interface OperationStatus {
  open_trove: boolean;
  borrow: boolean;
  deposit: boolean;
  redeem: boolean;
}

const COLLATERAL_TYPES = {
  SUPRA: "SUPRA",
  stSUPRA: "stSUPRA",
} as const;

const COLLATERAL_ADDRESSES = {
  SUPRA: "0x1",
  stSUPRA: "0x81846514536430ea934c7270f86cf5b067e2a2faef0e91379b4f284e91c7f53c",
} as const;

const COLLATERAL_TYPE_ARGS = {
  SUPRA: supra_coin,
  stSUPRA: stsupra_coin,
} as const;

interface RedeemPositionsProps {
  onCollateralChange?: (collateral: keyof typeof COLLATERAL_TYPES) => void;
}

export default function RedeemPositions({ onCollateralChange }: RedeemPositionsProps) {
  const { isInstalled, account, balance, connectWallet } = useWallet();
  let supraProvider = useMemo(
    () =>
      typeof window !== "undefined"
        ? (window as any)?.starkey?.supra
        : null,
    []
  );

  // Core state
  const [activeCollateralType, setActiveCollateralType] =
    useState<keyof typeof COLLATERAL_TYPES>("SUPRA");
  
  // Notify parent component when collateral type changes
  useEffect(() => {
    if (onCollateralChange) {
      onCollateralChange(activeCollateralType);
    }
    // Emit custom event for page.tsx
    const event = new CustomEvent('collateralTypeChanged', { detail: activeCollateralType });
    window.dispatchEvent(event);
  }, [activeCollateralType, onCollateralChange]);

  const [positions, setPositions] = useState<Position[]>([]);
  const [currentRedeemPosition, setCurrentRedeemPosition] =
    useState<Position | null>(null);
  const [operationStatus, setOperationStatus] =
    useState<OperationStatus | null>(null);

  // Pagination
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalRecords: 0,
  });

  // Protocol parameters
  const [protocolData, setProtocolData] = useState({
    collateralPrice: 0,
    minimumDebt: 0,
    liquidationReserve: 0,
    liquidationThreshold: 0,
    redemptionFee: 0,
    redemptionGratuity: 0,
  });

  // Redemption calculations
  const [redemptionValues, setRedemptionValues] = useState({
    totalRedeemedCollateral: 0,
    totalRedemptionFee: 0,
    netReceivedCollateral: 0,
    expectedCollateralAmount: 0,
  });

  const [currentRedemptionAmount, setCurrentRedemptionAmount] = useState("");
  const [cashBalance, setCashBalance] = useState(0);

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [isLoadingOperationStatus, setIsLoadingOperationStatus] =
    useState(true);

  // Transaction states
  const [transactionState, setTransactionState] = useState({
    hash: "",
    isSuccessful: false,
    isRejected: false,
    hasError: false,
    statusMessage: "",
  });

  // Modal states
  const [modalState, setModalState] = useState({
    isPrimaryVisible: false,
    isTransactionVisible: false,
    showCloseButton: false,
  });

  // Transaction results
  const [redemptionResults, setRedemptionResults] = useState({
    redeemedCashAmount: 0,
    receivedCollateralAmount: 0,
  });

  // Memoized values
  const shortenedHash = useMemo(
    () =>
      transactionState.hash
        ? `${transactionState.hash.slice(0, 6)}...${transactionState.hash.slice(
            -4
          )}`
        : "",
    [transactionState.hash]
  );

  const filteredPositions = useMemo(
    () =>
      positions.map((pos) => ({
        ...pos,
        redeemAmount: pos.redeemAmount || "",
      })),
    [positions]
  );

  // Get current type argument based on active collateral
  const currentTypeArg = useMemo(
    () => COLLATERAL_TYPE_ARGS[activeCollateralType],
    [activeCollateralType]
  );

  // Calculate redemption values
  const calculateRedemptionValues = useCallback(
    (amount: string) => {
      const cashAmount = parseFloat(amount);
      if (
        isNaN(cashAmount) ||
        cashAmount <= 0 ||
        protocolData.collateralPrice <= 0
      ) {
        setRedemptionValues({
          totalRedeemedCollateral: 0,
          totalRedemptionFee: 0,
          netReceivedCollateral: 0,
          expectedCollateralAmount: 0,
        });
        return;
      }

      const estimatedAmount = cashAmount / protocolData.collateralPrice;
      const fee =
        estimatedAmount *
        ((protocolData.redemptionGratuity + protocolData.redemptionFee) / 100);
      const netReceived = (estimatedAmount - fee) * 0.99;

      setRedemptionValues({
        totalRedeemedCollateral: estimatedAmount,
        totalRedemptionFee: fee,
        netReceivedCollateral: netReceived,
        expectedCollateralAmount: Math.round(netReceived * 100000000),
      });
    },
    [
      protocolData.collateralPrice,
      protocolData.redemptionGratuity,
      protocolData.redemptionFee,
    ]
  );

  // Handle redeem input change
  const handleRedeemInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, position: Position) => {
      const value = e.target.value;
      const numValue = parseFloat(value);

      let finalValue = value;
      if (!isNaN(numValue) && numValue > cashBalance) {
        finalValue = cashBalance.toString();
      }

      const updatedPositions = positions.map((pos) =>
        pos._id === position._id ? { ...pos, redeemAmount: finalValue } : pos
      );
      setPositions(updatedPositions);
      setCurrentRedemptionAmount(finalValue);
      calculateRedemptionValues(finalValue);
    },
    [cashBalance, positions, calculateRedemptionValues]
  );

  interface RPCResponse {
    result: any[];
  }

  // Fetch operation status
  const fetchOperationStatus = useCallback(async () => {
    if (!account) return;

    try {
      setIsLoadingOperationStatus(true);

      const operationStatus = await axios.post<RPCResponse>(
        "https://rpc-mainnet.supra.com/rpc/v2/view",
        {
          function: `${module_address}::${module_name}::get_operation_status`,
          type_arguments: [currentTypeArg],
          arguments: [],
        }
      );

      if (
        operationStatus &&
        operationStatus.data &&
        Array.isArray(operationStatus.data.result) &&
        operationStatus.data.result.length > 0
      ) {
        setOperationStatus({
          open_trove: operationStatus.data.result[0] || false,
          borrow: operationStatus.data.result[1] || false,
          deposit: operationStatus.data.result[2] || false,
          redeem: operationStatus.data.result[3] || false,
        });
      }
    } catch (error) {
      console.error("Error fetching operation status:", error);
      setOperationStatus({
        open_trove: false,
        borrow: false,
        deposit: false,
        redeem: false,
      });
    } finally {
      setIsLoadingOperationStatus(false);
    }
  }, [account, currentTypeArg]);

  // Set operation status
  const setOperationStatusTransaction = useCallback(
    async (redeemStatus: boolean) => {
      supraProvider = (window as any)?.starkey?.supra;
      if (!supraProvider || !account) {
        await connectWallet();
      }

      const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
      const rawTx = [
        account,
        0,
        module_address,
        module_name,
        "set_operation_status",
        [currentTypeArg],
        [
          BCS.bcsSerializeBool(true), // open_trove
          BCS.bcsSerializeBool(true), // borrow
          BCS.bcsSerializeBool(true), // deposit
          BCS.bcsSerializeBool(redeemStatus), // redeem
        ],
        { txExpiryTime },
      ];

      const data = await supraProvider.createRawTransactionData(rawTx);
      const params = {
        data,
        from: account,
        to: module_address,
        chainId: 8,
        value: "",
      };

      return await supraProvider.sendTransaction(params);
    },
    [supraProvider, account, currentTypeArg]
  );

  // Handle start/pause redeem
  const handleToggleRedeem = useCallback(
    async (enable: boolean) => {
      try {
        await setOperationStatusTransaction(enable);
        await fetchOperationStatus(); // Refresh status
      } catch (error) {
        console.error(
          `Error ${enable ? "starting" : "pausing"} redeem:`,
          error
        );
        alert(
          `Failed to ${
            enable ? "start" : "pause"
          } redeem operation. Please try again.`
        );
      }
    },
    [setOperationStatusTransaction, fetchOperationStatus]
  );

  // Fetch positions data
  const fetchPositionsData = useCallback(
    async (page = 1, pageSize = 25) => {
      if (protocolData.collateralPrice <= 0) return;

      try {
        setIsLoadingPositions(true);
        const collateralAddress = COLLATERAL_ADDRESSES[activeCollateralType];

        const response = await axios.get(
          `https://api.solido.money/positions/sortedNICR?collAddress=${collateralAddress}&page=${page}&pageSize=${pageSize}`
        );

        const data =
          response.data.data || response.data.positions || response.data;
        const totalRecords =
          response.data.pagination?.totalPositions ||
          response.data.totalRecords ||
          data.length;

        const processedPositions = data
          .map((item: any) => {
            const collateralValue =
              Number.parseFloat(item.coll || item.totalCollateral) *
              protocolData.collateralPrice;

            return {
              _id: item.positionID || item._id,
              collateralAddress: item.collAddress || item.collateralAddress,
              walletAddress: item.walletAddress,
              totalCollateral: (item.coll || item.totalCollateral).toString(),
              totalDebt: (item.debt || item.totalDebt).toString(),
              NICR: Number(item.NICR),
              nltv: (
                Number(item.NICR) *
                protocolData.collateralPrice *
                100
              ).toString(),
              status: item.status,
              redeemAmount: "",
            };
          })
          .filter((item: any) => !isNaN(item.nltv));

        setPositions(processedPositions);
        setPaginationState({ page, pageSize, totalRecords });
      } catch (error) {
        console.error("Error fetching positions:", error);
      } finally {
        setIsLoadingPositions(false);
      }
    },
    [protocolData.collateralPrice, activeCollateralType]
  );

  // Fetch protocol config
  const fetchProtocolConfig = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://api.solido.money/protocol/metrics"
      );
      const metrics = response.data?.metrics;
      const activeMetric = metrics?.find(
        (metric: ProtocolMetric) => metric.token === activeCollateralType
      );

      if (activeMetric) {
        setProtocolData({
          minimumDebt: activeMetric.minDebt,
          liquidationReserve: activeMetric.liquidationReserve,
          liquidationThreshold: activeMetric.liquidationThreshold,
          collateralPrice: activeMetric.price,
          redemptionFee: activeMetric.redemptionFee || 0,
          redemptionGratuity: activeMetric.redemptionGratuity || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching protocol metrics:", error);
    }
  }, [activeCollateralType]);

  // Fetch CASH balance
  const fetchCashBalance = useCallback(async () => {
    if (!account) {
      setCashBalance(0);
      return;
    }

    try {
      const supraClient = new SupraClient("https://rpc-mainnet.supra.com/");
      const rawBalance = await supraClient.getAccountCoinBalance(
        HexString.ensure(account),
        stable_coin
      );
      const convertedBalance =
        typeof rawBalance === "bigint"
          ? Number(rawBalance.toString()) / 100000000
          : rawBalance / 100000000;
      setCashBalance(convertedBalance);
    } catch (error) {
      console.error("Error fetching CASH balance:", error);
      setCashBalance(0);
    }
  }, [account]);

  // Handle redeem transaction
  const handleRedeem = useCallback(
    async (walletAddress: string, redeemAmount: string, position: Position) => {
      const cashAmount = parseFloat(redeemAmount);
      if (!redeemAmount || isNaN(cashAmount) || cashAmount <= 0) return;

      setIsSubmitting(true);
      setModalState((prev) => ({ ...prev, isPrimaryVisible: true }));
      setCurrentRedeemPosition(position);

      setRedemptionResults({
        redeemedCashAmount: cashAmount,
        receivedCollateralAmount: redemptionValues.netReceivedCollateral,
      });

      try {
        if (!supraProvider) throw new Error("Wallet provider not found");

        const txExpiryTime = Math.ceil(Date.now() / 1000) + 30;
        const cashAmountInSmallestUnit = BigInt(
          Math.floor(cashAmount * 100000000)
        );
        const expectedCollateralAmountBigInt = BigInt(
          redemptionValues.expectedCollateralAmount
        );

        const rawTx = [
          account,
          0,
          module_address,
          module_name,
          "redeem",
          [currentTypeArg],
          [
            BCS.bcsToBytes(
              TxnBuilderTypes.AccountAddress.fromHex(
                walletAddress.toLowerCase()
              )
            ),
            BCS.bcsSerializeUint64(cashAmountInSmallestUnit),
            BCS.bcsSerializeUint64(expectedCollateralAmountBigInt),
          ],
          { txExpiryTime },
        ];

        const data = await supraProvider.createRawTransactionData(rawTx);
        const params = {
          data,
          from: account,
          to: module_address,
          chainId: 8,
          value: "",
        };

        const txHash = await supraProvider.sendTransaction(params);

        setTransactionState({
          hash: txHash,
          isSuccessful: true,
          isRejected: false,
          hasError: false,
          statusMessage: "Redemption successful.",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setTransactionState({
          hash: "",
          isSuccessful: false,
          isRejected: true,
          hasError: true,
          statusMessage: `Transaction failed: ${errorMessage}`,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [supraProvider, account, redemptionValues, currentTypeArg]
  );

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setModalState({
      isPrimaryVisible: false,
      isTransactionVisible: false,
      showCloseButton: false,
    });
    setTransactionState({
      hash: "",
      isSuccessful: false,
      isRejected: false,
      hasError: false,
      statusMessage: "",
    });
    window.location.reload();
  }, []);

  // Handle pagination
  const handlePageChange = useCallback(
    (event: any) => {
      const newPage = event.page + 1;
      const newPageSize = event.rows;
      setPaginationState((prev) => ({
        ...prev,
        page: newPage,
        pageSize: newPageSize,
      }));
      fetchPositionsData(newPage, newPageSize);
    },
    [fetchPositionsData]
  );

  // Render redeem input
  const renderRedeemInput = useCallback(
    (position: Position) => {
      const hasEnoughCash = cashBalance > 0;
      const isValidAmount =
        position.redeemAmount &&
        parseFloat(position.redeemAmount) > 0 &&
        parseFloat(position.redeemAmount) <= cashBalance;
      const isButtonDisabled =
        !hasEnoughCash || !isValidAmount || !operationStatus?.redeem;

      return (
        <div className="p-5 flex items-center gap-3">
          <div className="relative">
            <input
              type="number"
              placeholder="CASH amount"
              value={position.redeemAmount}
              onChange={(e) => handleRedeemInputChange(e, position)}
              className="w-28 h-10 px-3 bg-gray-800 text-white border border-gray-600 rounded-md focus:border-[#1DBDAF] focus:outline-none transition-colors"
              max={cashBalance}
              disabled={!operationStatus?.redeem}
            />
          </div>

          <button
            onClick={() =>
              handleRedeem(
                position.walletAddress,
                position.redeemAmount || "0",
                position
              )
            }
            className={`px-6 h-10 rounded-md font-medium transition-all duration-200 ${
              isButtonDisabled
                ? "bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600"
                : "bg-gradient-to-r from-[#1DBDAF] to-[#17a085] text-white hover:from-[#17a085] hover:to-[#1DBDAF] shadow-lg hover:shadow-xl"
            }`}
            disabled={isButtonDisabled}
          >
            Redeem
          </button>

          {isButtonDisabled && (
            <div className="relative group">
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-bold cursor-help">
                !
              </div>
              <span className="absolute bottom-6 left-0 w-48 bg-gray-800 text-yellow-400 text-xs px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg border border-gray-600">
                {!operationStatus?.redeem
                  ? "Redemptions are currently disabled"
                  : !hasEnoughCash
                  ? "Insufficient $CASH balance"
                  : "Enter a valid CASH amount"}
              </span>
            </div>
          )}
        </div>
      );
    },
    [
      cashBalance,
      operationStatus?.redeem,
      handleRedeemInputChange,
      handleRedeem,
    ]
  );

  // Effects
  useEffect(() => {
    if (account) {
      fetchProtocolConfig();
      fetchCashBalance();
      fetchOperationStatus();
    }
  }, [
    account,
    activeCollateralType,
    fetchProtocolConfig,
    fetchCashBalance,
    fetchOperationStatus,
  ]);

  useEffect(() => {
    fetchPositionsData(paginationState.page, paginationState.pageSize);
  }, [protocolData.collateralPrice, activeCollateralType, fetchPositionsData]);

  useEffect(() => {
    if (isSubmitting) {
      setModalState((prev) => ({
        ...prev,
        isPrimaryVisible: false,
        isTransactionVisible: true,
      }));
      setTransactionState((prev) => ({
        ...prev,
        statusMessage: "Waiting for transaction to confirm..",
      }));
    } else if (transactionState.isSuccessful || transactionState.isRejected) {
      setModalState((prev) => ({ ...prev, isTransactionVisible: true }));
    }
  }, [
    isSubmitting,
    transactionState.isSuccessful,
    transactionState.isRejected,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setModalState((prev) => ({ ...prev, showCloseButton: true }));
    }, 180000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoadingPositions || isLoadingOperationStatus) {
    return <FullScreenLoader />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Operation Status Controls */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white font-poppins">
            Redemption Controls - {activeCollateralType}
          </h2>
          <div className="flex items-center gap-4">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                operationStatus?.redeem
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {operationStatus?.redeem ? "ENABLED" : "DISABLED"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleRedeem(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors duration-200"
              >
                Enable
              </button>
              <button
                onClick={() => handleToggleRedeem(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors duration-200"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Redemption Calculation Panel */}
      <div className="mb-8 p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border-2 border-[#1DBDAF]/30 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-6 text-center font-poppins">
          Redemption Calculator
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              label: "Wallet Balance",
              value: `${formatLargeNumber(cashBalance)} CASH`,
              color: "text-blue-400",
            },
            {
              label: "Redeemed Collateral",
              value: `${redemptionValues.totalRedeemedCollateral.toFixed(
                4
              )} ${activeCollateralType}`,
              color: "text-[#1DBDAF]",
            },
            {
              label: "Redemption Fee",
              value: `${redemptionValues.totalRedemptionFee.toFixed(4)} ${activeCollateralType}`,
              color: "text-yellow-400",
            },
            {
              label: "Net Received",
              value: `${redemptionValues.netReceivedCollateral.toFixed(
                4
              )} ${activeCollateralType}`,
              color: "text-green-400",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <p className="text-gray-400 text-sm mb-2 font-medium">
                {item.label}
              </p>
              <p className={`${item.color} font-semibold text-lg`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Collateral Type Selection */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              activeCollateralType === "SUPRA"
                ? "bg-[#1DBDAF] border-[#1DBDAF] text-white shadow-lg"
                : "bg-gray-800 border-gray-600 text-gray-300 hover:border-[#1DBDAF]/50"
            }`}
            onClick={() => setActiveCollateralType("SUPRA")}
          >
            <Image
              src={supraLogo}
              alt="SUPRA"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="font-semibold">SUPRA</span>
          </div>
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              activeCollateralType === "stSUPRA"
                ? "bg-[#1DBDAF] border-[#1DBDAF] text-white shadow-lg"
                : "bg-gray-800 border-gray-600 text-gray-300 hover:border-[#1DBDAF]/50"
            }`}
            onClick={() => setActiveCollateralType("stSUPRA")}
          >
            <Image
              src={stSUPRA}
              alt="stSUPRA"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="font-semibold">stSUPRA</span>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        <DataTable
          value={filteredPositions}
          dataKey="_id"
          paginator
          first={(paginationState.page - 1) * paginationState.pageSize}
          rows={paginationState.pageSize}
          totalRecords={paginationState.totalRecords}
          onPage={handlePageChange}
          className="min-w-full"
          rowClassName={() =>
            "border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
          }
          lazy
        >
          <Column
            field="walletAddress"
            header={
              <span className="text-gray-300 font-medium">Wallet Address</span>
            }
            body={(rowData: Position) => (
              <AddressDisplayLiquidation address={rowData.walletAddress} />
            )}
            className="text-white p-4"
          />
          <Column
            field="totalCollateral"
            header={
              <span className="text-gray-300 font-medium">
                Total Collateral
              </span>
            }
            body={(rowData: Position) => (
              <span className="text-white font-medium">
                {formatLargeNumber(Number(rowData.totalCollateral))}{" "}
                {activeCollateralType}
              </span>
            )}
            className="p-4"
          />
          <Column
            field="totalDebt"
            header={
              <span className="text-gray-300 font-medium">Total Debt</span>
            }
            body={(rowData: Position) => (
              <span className="text-white font-medium">
                {formatLargeNumber(Number(rowData.totalDebt))} CASH
              </span>
            )}
            className="p-4"
          />
          <Column
            field="nltv"
            header={
              <span className="text-gray-300 font-medium">Trove LTV</span>
            }
            body={(rowData: Position) => {
              const ltvRatio = 10000 / Number(rowData.nltv);
              const getColor = (ltv: number) => {
                if (ltv <= 20) return "text-green-400";
                if (ltv <= 40) return "text-yellow-400";
                if (ltv < 50) return "text-orange-400";
                return "text-red-400";
              };
              return (
                <span className={`font-semibold ${getColor(ltvRatio)}`}>
                  {ltvRatio.toFixed(2)}%
                </span>
              );
            }}
            className="p-4"
          />
          <Column
            body={renderRedeemInput}
            className="p-4 text-center"
            header={<span className="text-gray-300 font-medium">Action</span>}
          />
        </DataTable>
      </div>

      {/* Transaction Modal */}
      <Dialog
        visible={modalState.isTransactionVisible}
        onHide={() =>
          setModalState((prev) => ({ ...prev, isTransactionVisible: false }))
        }
        className="transaction-modal"
        contentClassName="bg-gray-900 border border-gray-700 rounded-xl"
      >
        <div className="p-8 text-center">
          <div className="mb-6">
            {isSubmitting ? (
              <Image
                src={loadingImage}
                alt="loading"
                width={100}
                className="mx-auto"
              />
            ) : transactionState.isSuccessful ? (
              <Image
                src={successImage}
                alt="success"
                width={100}
                className="mx-auto"
              />
            ) : transactionState.isRejected ? (
              <Image
                src={errorImage}
                alt="error"
                width={100}
                className="mx-auto"
              />
            ) : null}
          </div>

          <h3 className="text-xl font-semibold text-white mb-4">
            {isSubmitting
              ? "Processing Transaction"
              : transactionState.isSuccessful
              ? "Redemption Successful!"
              : "Transaction Failed"}
          </h3>

          <p className="text-gray-400 mb-6">{transactionState.statusMessage}</p>

          {transactionState.isSuccessful && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Redeemed CASH:</span>
                <span className="text-white font-semibold">
                  {redemptionResults.redeemedCashAmount.toFixed(2)} CASH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Received {activeCollateralType}:</span>
                <span className="text-[#1DBDAF] font-semibold">
                  {redemptionResults.receivedCollateralAmount.toFixed(4)}{" "}
                  {activeCollateralType}
                </span>
              </div>
              {transactionState.hash && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Transaction:</span>
                  <Link
                    href={`https://supra.com/tx/${transactionState.hash}`}
                    target="_blank"
                    className="text-[#1DBDAF] hover:underline flex items-center gap-1"
                  >
                    {shortenedHash}
                    <Image src={arrowIcon} alt="arrow" width={12} height={12} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {(modalState.showCloseButton || !isSubmitting) && (
            <Button
              onClick={handleCloseModal}
              className="w-full bg-[#1DBDAF] hover:bg-[#17a085] text-white"
            >
              Close
            </Button>
          )}
        </div>
      </Dialog>
    </div>
  );
}