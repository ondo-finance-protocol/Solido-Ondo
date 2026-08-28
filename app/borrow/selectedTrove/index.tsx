/* eslint-disable */
"use account";
import { Label } from "@radix-ui/react-label";
import Decimal from "decimal.js";
import Link from "next/link";
import tBTC from "../../assets/images/flow/stSupra.png";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useDebounce } from "react-use";
import { Skeleton } from "@/components/ui/skeleton";
import arrow from "../../assets/arrow.svg";
import { Button } from "@/components/ui/button";
import OpenTroveNotConnected from "./openTroveNotConnected";
import Image from "next/image";
import INACTIVE from "../../assets/images/INACTIVE.svg";
import ACTIVE from "../../assets/ACTIVE.svg";
import img2 from "../../assets/images/Group 663.svg";
import img3 from "../../assets/images/SUPRA.png";
import img4 from "../../assets/images/Group 666.svg";
import conf from "../../assets/images/Loader 1.gif";
import rec2 from "../../assets/images/Loader 2.gif";
import tick from "../../assets/images/Done_Solido.gif";
import rej from "../../assets/images/TxnError.gif";
import info from "../../assets/images/info.svg";
import { Knob } from "primereact/knob";
import { TabView, TabPanel } from "primereact/tabview";
import { Repay } from "./Repay";
import { CloseTrove } from "./Close";
import { OpenTrove } from "./OpenTrove";
import Layout from "./layout";
import { FaArrowRightLong } from "react-icons/fa6";
import "../../../app/App.css";
import "../../../components/stabilityPool/Modal.css";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import CASH from "@/app/assets/images/CASH2.png";

import info1 from "../../assets/images/info.svg";
import { SupraClient, BCS, TxnBuilderTypes, HexString } from "supra-l1-sdk";
import axios from "axios";
import { useWallet } from "../../../context/WalletContext";
import {
  module_address,
  module_address_mainnet_flow,
  module_name,
  stable_coin,
  supra_coin,
  stsupra_coin,
  stability_module,
} from "@/constants/constants";
import icircle from "../../assets/images/info.svg";
import { useBalance, useTokenPrice } from "@/hooks";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import back from "@/app/assets/back.svg";
import RedemptionHistory from "@/components/RedemptionTable";
import alert from "@/app/assets/images/alert-rename.svg";
import DynamicInput from "@/components/DynamicInput";
import { formatLargeNumber } from "@/components/getActualDecimal";
import { usePathname } from "next/navigation";

// Info Tooltip Component
const InfoTooltip = ({
  children,
  tooltip,
}: {
  children: any;
  tooltip: any;
}) => (
  <div className="relative group inline-flex items-center">
    {children}
    <Image src={info} alt="info" className="w-4 h-4 ml-1" />
    <div className="absolute bottom-full left-0 w-48 text-xs text-[#1dbdaf] bg-[#2f2f2f] rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 font-light p-2">
      {tooltip}
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status, ltv }: { status: string; ltv: number }) => {
  const getRiskLevel = (ltv: number) => {
    if (ltv <= 20) return "Low Liquidation Risk";
    if (ltv <= 40) return "Medium Liquidation Risk";
    return "High Liquidation Risk";
  };

  const getRiskStyles = (ltv: number) => {
    if (ltv <= 20) {
      return {
        bgClass: "bg-green-900/30",
        borderClass: "border-green-600",
        textClass: "text-green-400",
        dotClass: "bg-green-400",
      };
    } else if (ltv <= 40) {
      return {
        bgClass: "bg-yellow-900/30",
        borderClass: "border-yellow-600",
        textClass: "text-yellow-400",
        dotClass: "bg-yellow-400",
      };
    } else {
      return {
        bgClass: "bg-red-900/30",
        borderClass: "border-red-600",
        textClass: "text-red-400",
        dotClass: "bg-red-400",
      };
    }
  };

  const risk = getRiskLevel(ltv);
  const riskStyles = getRiskStyles(ltv);

  return (
    <div className="flex gap-2">
      <div
        className={`px-3 py-1 ${riskStyles.bgClass} border ${riskStyles.borderClass} rounded-full`}
      >
        <span
          className={`${riskStyles.textClass} text-sm font-medium flex items-center`}
        >
          <div
            className={`w-2 h-2 ${riskStyles.dotClass} rounded-full mr-2`}
          ></div>
          {risk}
        </span>
      </div>
      <div className="px-3 py-1 bg-green-900/30 border border-green-600 rounded-full">
        <span className="text-green-400 text-sm font-medium flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          {status}
        </span>
      </div>
    </div>
  );
};

const Borrow = () => {
  const { balance, account } = useWallet();

  // Get collateral type from route
  // const pathname =
  //   typeof window !== "undefined" ? window.location.pathname : "";
  const pathname = usePathname();
  // const [displayValue] = useState<"SUPRA" | "stSUPRA">(
  //   getCollateralFromPath() as "SUPRA" | "stSUPRA"
  // );
  const displayValue: "SUPRA" | "stSUPRA" = pathname.includes("/borrow/stsupra")
    ? "stSUPRA"
    : "SUPRA";
  const getCollateralFromPath = () => {
    if (pathname.includes("/borrow/stsupra")) return "stSUPRA";
    if (pathname.includes("/borrow/supra")) return "SUPRA";
    return "SUPRA"; // default
  };

  const [searchParams] = useSearchParams();
  const [isTroveStatusLoading, setIsTroveStatusLoading] = useState(false);

  const [troveStatus, setTroveStatus] = useState("");

  const router = useRouter();
  const { balance: tbtcBalance } = useBalance(displayValue, account);

  let supraProvider: any =
    typeof window !== "undefined" && (window as any)?.starkey?.supra;
  const [userInputs, setUserInputs] = useState({
    depositCollateral: "",
    borrow: "",
  });

  const [borrowingFee, setBorrowingFee] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [hasPriceFetched, setHasPriceFetched] = useState(false);
  const [hasGotStaticData, setHasGotStaticData] = useState(false);
  const [newDebt, setNewDebt] = useState(0);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const [availableBorrow, setAvailableBorrow] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [response, setResponse] = useState(null);
  const [liquidationThreshold, setLiquidationThreshold] = useState(0);

  // static
  const [staticLiquidationPrice, setStaticLiquidationPrice] = useState(0);
  const [staticLtv, setStaticLtv] = useState(0);
  const [newUserColl, setNewUserColl] = useState("0");

  const [userInputColl, setUserInputColl] = useState(0);
  const [userInputDebt, setUserInputDebt] = useState(0);

  // API
  const [minDebt, setMinDebt] = useState(0);
  const [borrowRate, setBorrowRate] = useState(0);
  const [lr, setLR] = useState(0);

  const [mCR, setMCR] = useState(0);

  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [transactionRejected, setTransactionRejected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [selectedPercentageBTC, setSelectedPercentageBTC] = useState(null);
  const [entireDebtAndColl, setEntireDebtAndColl] = useState({
    debt: "0",
    coll: "0",
  });
  const [oreBalance, setOreBalance] = useState(0);
  const [btcBalance, setBtcBalance] = useState(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const imageSrc = displayValue === "SUPRA" ? img3 : tBTC;
  const { balance: currentTokenBalance, isLoading: isBalanceLoading, error: balanceError } = useBalance(displayValue, account);
  const balanceData = currentTokenBalance;
  const [hash, setHash] = useState("");
  const [fetchedPrice, setFetchedPrice] = useState<number>(0);
  const [isFetchPriceLoading, setIsFetchPriceLoading] = useState<boolean>(true);
  const { refetch } = useTokenPrice(displayValue);

  // ... (keeping all your existing useEffect hooks and functions exactly as they are)
  useEffect(() => {
    if (fetchedPrice === 0 && !isFetchPriceLoading) {
      refetch();
    }
  }, [fetchedPrice, isFetchPriceLoading]);

  useEffect(() => {
    if (displayValue) {
      refetch();
    }
  }, [displayValue]);

  const getUserORE = async () => {
    if (SupraClient && account && account.length > 0) {
      try {
        const supraClient = new SupraClient("https://rpc-mainnet.supra.com/");
        try {
          const oreBalance = await supraClient.getAccountCoinBalance(
            HexString.ensure(account),
            stable_coin
          );

          const convertedBalance =
            typeof oreBalance === "bigint"
              ? Number(oreBalance.toString()) / 1e8
              : oreBalance / 1e8;

          setOreBalance(convertedBalance);
        } catch (err: Error | any) {
          console.error("Error fetching CASH:", err);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error in getUserORE:", err.message);
        } else {
          console.error("Unexpected error:", err);
        }
      }
    } else {
      console.log("Account not connected");
    }
  };

  const getTroveStatus = async () => {
    if (account) {
      try {
        setIsTroveStatusLoading(true);

        // Get the correct coin type based on displayValue
        const coinType = displayValue === "SUPRA" ? supra_coin : stsupra_coin;

        const response = await axios.post(
          "https://rpc-mainnet.supra.com/rpc/v2/view",
          {
            function: `${module_address}::${module_name}::get_user_position`,
            type_arguments: [coinType],
            arguments: [account],
          }
        );

        const isActiveFromChain = response.data.result[2];
        const coll = response.data.result[0];
        const debt = response.data.result[1];

        // CRITICAL FIX: Only set as ACTIVE if the trove actually has collateral
        // This prevents showing ACTIVE state when checking a different trove type
        if (isActiveFromChain === true && Number(coll) > 0) {
          setTroveStatus("ACTIVE");
          setEntireDebtAndColl({
            debt: debt,
            coll: coll,
          });
        } else if (isActiveFromChain === false || Number(coll) === 0) {
          // Check API for historical data only if chain shows inactive
          try {
            const apiResponse = await axios.get(
              `https://api.solido.money/positions/history`,
              {
                params: {
                  walletAddress: [account],
                  collAddress: "0x1",
                },
              }
            );

            if (apiResponse.data.success && apiResponse.data.data.length > 0) {
              // Filter to find the position matching current displayValue
              const matchingPosition = apiResponse.data.data.find(
                (pos: any) => pos.collateralType === displayValue
              );

              if (matchingPosition) {
                const apiStatus = matchingPosition.status;
                setTroveStatus(apiStatus.toUpperCase());
                setEntireDebtAndColl({
                  debt: matchingPosition.debt ? String(matchingPosition.debt * 100000000) : "0",
                  coll: matchingPosition.coll ? String(matchingPosition.coll * 100000000) : "0",
                });
              } else {
                // No matching position found for this collateral type
                setTroveStatus("INACTIVE");
                setEntireDebtAndColl({
                  debt: "0",
                  coll: "0",
                });
              }
            } else {
              setTroveStatus("INACTIVE");
              setEntireDebtAndColl({
                debt: "0",
                coll: "0",
              });
            }
          } catch (apiErr) {
            console.error("Error fetching position from API:", apiErr);
            setTroveStatus("INACTIVE");
            setEntireDebtAndColl({
              debt: "0",
              coll: "0",
            });
          }
        } else {
          console.warn(
            "Unexpected response format for trove status:",
            response.data
          );
          setTroveStatus("INACTIVE");
          setEntireDebtAndColl({
            debt: "0",
            coll: "0",
          });
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error fetching trove info:", err.message);
        } else {
          console.error("Unexpected error:", err);
        }
        setTroveStatus("INACTIVE");
        setEntireDebtAndColl({
          debt: "0",
          coll: "0",
        });
      } finally {
        setIsTroveStatusLoading(false);
      }
    }
  };
  const fetch_config = async () => {
    try {
      setIsFetchPriceLoading(true);

      const response = await axios.get(
        "https://api.solido.money/protocol/metrics"
      );
      const data = response.data;
      setResponse(data);

      if (data && data.metrics && data.metrics.length > 0) {
        const metrics = data.metrics;
        const selectedMetric = metrics.find(
          (m: any) => m.token === displayValue
        );

        if (selectedMetric) {
          setMinDebt(selectedMetric.minDebt || 0);
          setMCR(selectedMetric.MCR || 0);
          setBorrowRate(selectedMetric.borrowRate / 100 || 0);
          setLR(selectedMetric.liquidationReserve || 0);
          setLiquidationThreshold(selectedMetric.liquidationThreshold || 0);

          if (selectedMetric.price) {
            setFetchedPrice(selectedMetric.price);
          }
        } else {
          console.warn(`No metrics found for token: ${displayValue}`);
          setFetchedPrice(1);
        }
      } else {
        console.warn("No data or empty data received from the API");
        setFetchedPrice(1);
      }
    } catch (err) {
      console.error("Error in fetch_config:", err);
      setFetchedPrice(1);

      if (err instanceof Error) {
        console.error(`Error fetching protocol metrics: ${err.message}`);
      } else {
        console.error(
          "Unexpected error occurred while fetching protocol metrics"
        );
      }
    } finally {
      setIsFetchPriceLoading(false);
    }
  };

  useEffect(() => {
    const handleConnectionStatus = () => {
      if (account) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    };

    handleConnectionStatus();
  }, [account]);

  useEffect(() => {
    if (account && account.length > 0) {
      setIsTroveStatusLoading(true);

      const timeoutId = setTimeout(() => {
        if (isTroveStatusLoading) {
          setIsTroveStatusLoading(false);
          setTroveStatus("INACTIVE");
        }
      }, 10000);

      Promise.all([
        getTroveStatus().catch((err) => {
          console.error("Error in getTroveStatus:", err);
          setIsTroveStatusLoading(false);
          setTroveStatus("INACTIVE");
        }),
        fetch_config().catch((err) => {
          console.error("Error in fetch_config:", err);
          setIsFetchPriceLoading(false);
        }),
        getUserORE().catch((err) => {
          console.error("Error in getUserORE:", err);
        }),
      ]).finally(() => {
        clearTimeout(timeoutId);
      });
    } else {
      setIsTroveStatusLoading(false);
      setTroveStatus("INACTIVE");
    }
  }, [account, displayValue]);

  const handleClose = useCallback(() => {
    setLoadingModalVisible(false);
    setUserModal(false);
    setIsModalVisible(false);
    setTransactionRejected(false);
    router.refresh();
    window.location.reload();
  }, [router]);

  useEffect(() => {
    const getStaticData = async () => {
      if (!account) return null;
      if (!supraProvider || hasGotStaticData) return null;

      const ltvValue =
        (Number(entireDebtAndColl.debt) * 100) /
        (Number(entireDebtAndColl.coll) * Number(fetchedPrice) || 1);
      setStaticLtv(ltvValue);

      const divideBy = Number(mCR) / 100;
      const liquidationPriceValue =
        (Number(divideBy) * Number(entireDebtAndColl.debt)) /
        Number(entireDebtAndColl.coll);
      setStaticLiquidationPrice(liquidationPriceValue);
      setHasGotStaticData(true);
    };

    getStaticData();
  }, [account, displayValue]);

  useDebounce(
    () => {
      makeCalculations(userInputs.borrow, userInputs.depositCollateral);
    },
    10,
    [userInputs.borrow, userInputs.depositCollateral]
  );

  const handleBorrow = async (cash: number, collateral: number) => {
    setIsLoading(true);
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

      // Get the correct coin type based on displayValue
      const coinType = displayValue === "SUPRA" ? supra_coin : stsupra_coin;

      const rawTx = [
        account,
        0,
        module_address,
        module_name,
        "deposit_or_mint",
        [coinType],
        [BCS.bcsSerializeUint64(collateral), BCS.bcsSerializeUint64(cash)],
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

      setIsLoading(false);
      setIsSuccess(true);
      setHash(txHash);
    } catch (err) {
      setIsError(true);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error in handleOpenTrove:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const makeCalculations = async (xBorrow: string, xCollatoral: string) => {
    const borrowValue = Number(xBorrow);
    const collValue = Number(xCollatoral);

    if (!account) return null;

    const expectedFeeFormatted = borrowRate * borrowValue;
    const totalColl =
      (Number(entireDebtAndColl.coll) / 100000000 + collValue) *
      Number(fetchedPrice);
    const userColl = collValue * Number(fetchedPrice);

    setNewUserColl(
      String(Number(entireDebtAndColl.coll) / 100000000 + collValue)
    );

    setTotalCollateral(userColl);

    const debtTotal =
      expectedFeeFormatted +
      borrowValue +
      Number(entireDebtAndColl.debt) / 100000000;
    const divideBy = Number(mCR) / 100;
    const liquidationRatio = Number(liquidationThreshold) / 100;
    const liquidationPriceValue =
      (Number(liquidationRatio) * debtTotal) /
      (Number(entireDebtAndColl.coll) / 100000000 + collValue);

    const ltvValue = (
      (Number(debtTotal) * 100) /
      ((Number(entireDebtAndColl.coll) / 100000000 + collValue) *
        Number(fetchedPrice))
    ).toFixed(2);
    setLtv(Number(ltvValue));

    const availBorrowValue =
      totalColl / Number(divideBy) -
      Number(entireDebtAndColl.debt) / 1e8 -
      expectedFeeFormatted;
    setAvailableBorrow(Number(availBorrowValue.toFixed(2)));

    setBorrowingFee(Number(expectedFeeFormatted.toFixed(2)));
    setTotalDebt(Number(debtTotal.toFixed(2)));

    {
      parseFloat(userInputs.depositCollateral) > 0
        ? setUserInputColl(1)
        : setUserInputColl(0);
    }
    {
      parseFloat(userInputs.borrow) > 0
        ? setUserInputDebt(1)
        : setUserInputDebt(0);
    }

    setLiquidationPrice(Number(liquidationPriceValue.toFixed(4)));
  };

  const divideBy = Number(mCR) / 100;
  const liquidationRatio = Number(liquidationThreshold) / 100;

  const availableToBorrow =
    ((Number(entireDebtAndColl.coll) / 1e8) * Number(fetchedPrice)) / divideBy -
    Number(entireDebtAndColl.debt) / 1e8;

  const liquidation =
    Number(liquidationRatio) *
    (Number(entireDebtAndColl.debt) / Number(entireDebtAndColl.coll));

  const totalAvailableBorrow =
    (Number(newUserColl) * fetchedPrice) / divideBy -
    Number(entireDebtAndColl.debt) / 1e8;

  const formatDecimals = (value: number, tokenType: "SUPRA" | "stSUPRA") => {
    if (tokenType === "stSUPRA") {
      return Number(value).toFixed(6);
    } else {
      if (value < 0.01) {
        if (value < 0.0001) {
          return Number(value).toFixed(4);
        }
        return Number(value).toFixed(3);
      }
      return Number(value).toFixed(2);
    }
  };

  const formatDollarValue = (value: number, tokenType: "SUPRA" | "stSUPRA") => {
    if (value < 0.01) {
      if (value < 0.0001) {
        return Number(value).toFixed(4);
      }
      return Number(value).toFixed(3);
    }
    return Number(value).toFixed(2);
  };

  const newLTV: number = parseFloat(
    (
      (Number(entireDebtAndColl.debt) * 100) /
      (Number(entireDebtAndColl.coll) * Number(fetchedPrice))
    ).toFixed(2)
  );

  const isCollInValid =
    parseFloat(userInputs.depositCollateral) > Number(balanceData);
  const isDebtInValid = parseFloat(userInputs.borrow) > totalAvailableBorrow;
  const condition =
    userInputColl + userInputDebt >= 1 ||
    parseFloat(userInputs.depositCollateral) <
    Number(entireDebtAndColl.coll) / 100000000 ||
    parseFloat(userInputs.borrow) < Number(entireDebtAndColl.debt) / 100000000;

  const shortenedHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  useEffect(() => {
    if (isError) {
      console.error("Write contract error:");
      setTransactionRejected(true);
      setUserModal(true);
    }
  }, [isError]);

  useEffect(() => {
    if (isLoading) {
      setIsModalVisible(false);
      setLoadingMessage("Waiting for transaction to confirm..");
      setLoadingModalVisible(true);
    } else if (isSuccess) {
      setLoadingMessage("Trove updated successfully.");
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
    parseFloat(userInputs.depositCollateral) > 0
      ? "md:-ml-[7rem]"
      : "md:-ml-[5rem]";

  useEffect(() => {
    makeCalculations(userInputs.borrow, userInputs.depositCollateral || "0");
  }, [userInputs.borrow, userInputs.depositCollateral]);

  useEffect(() => {
    if (fetchedPrice && account) {
      makeCalculations(userInputs.borrow, userInputs.depositCollateral || "0");
    }
  }, [displayValue, fetchedPrice]);

  return (
    <div>
      {isLoading ? (
        !isConnected ? (
          <OpenTroveNotConnected />
        ) : (
          <FullScreenLoader />
        )
      ) : (
        <Layout>
          {isConnected && fetchedPrice ? (
            <>
              {isTroveStatusLoading ? (
                <FullScreenLoader />
              ) : troveStatus === "ACTIVE" && !isFetchPriceLoading ? (
                // NEW REDESIGNED ACTIVE Trove UI
                <div className="bg-black text-white min-h-screen">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 mb-4">
                    <div className="flex items-center gap-3">
                      <ArrowLeft
                        className="w-6 h-6 cursor-pointer hover:text-gray-300"
                        onClick={() => router.push("/borrow")}
                      />
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt="token"
                          width={40}
                          height={40}
                        />
                      </div>
                      <h1 className="text-xl font-semibold">
                        {displayValue} Trove
                      </h1>
                    </div>
                    <StatusBadge status={troveStatus} ltv={newLTV} />
                  </div>

                  {/* Main Content */}
                  <div className="bg-[#222222] rounded-lg mx-6 p-6 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Section - Main Metrics */}
                      <div className="space-y-6 border-r border-gray-500 pr-6">
                        {/* Debt */}
                        <div>
                          <InfoTooltip tooltip="Total debt of the position including liquidation reserve.">
                            <h3 className="text-gray-400 text-sm font-medium mb-2">
                              Debt
                            </h3>
                          </InfoTooltip>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                              <Image
                                src={CASH}
                                alt="CASH"
                                width={32}
                                height={32}
                              />
                            </div>
                            <div>
                              <div className="text-2xl font-semibold">
                                {formatLargeNumber(
                                  Number(entireDebtAndColl.debt) / 100000000
                                )}
                              </div>
                              <div className="text-gray-400">
                                $
                                {formatLargeNumber(
                                  Number(entireDebtAndColl.debt) / 100000000
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <InfoTooltip tooltip="The amount of collateral supplied in your position.">
                              <h3 className="text-gray-400 text-sm font-medium mb-2">
                                Collateral
                              </h3>
                            </InfoTooltip>
                            <div className="text-lg font-medium">
                              {formatLargeNumber(
                                Number(entireDebtAndColl.coll) / 100000000
                              )}{" "}
                              {displayValue}
                            </div>
                            <div className="text-gray-400 text-sm">
                              $
                              {formatLargeNumber(
                                Number(fetchedPrice) *
                                (Number(entireDebtAndColl.coll) / 100000000)
                              )}
                            </div>
                          </div>

                          <div>
                            <InfoTooltip tooltip="The amount of $CASH you can borrow using the deposited collateral.">
                              <h3 className="text-gray-400 text-sm font-medium mb-2">
                                Available
                              </h3>
                            </InfoTooltip>
                            <div className="text-lg font-medium">
                              {Number(availableToBorrow) >= 0
                                ? formatLargeNumber(availableToBorrow)
                                : "0.00"}{" "}
                              CASH
                            </div>
                            <div className="text-gray-400 text-sm">
                              $
                              {Number(availableToBorrow) >= 0
                                ? formatLargeNumber(availableToBorrow)
                                : "0.00"}
                            </div>
                          </div>
                        </div>

                        {/* High LTV Warning */}
                        {/* {newLTV >= 40 && (
                          <div className="flex items-start gap-2 bg-red-500/20 border border-red-500 rounded-md p-3">
                            <Image src={alert} alt="warning" width={20} height={20} className="mt-0.5" />
                            <div className="text-red-300 text-sm">
                              Your LTV is high, and Trove is at risk of liquidation. Improve your Trove health immediately.
                            </div>
                          </div>
                        )} */}
                      </div>

                      {/* Right Section - LTV and Risk */}
                      <div className="flex flex-col items-center justify-center space-y-6 pr-6">
                        <div className="flex items-center justify-between space-y-4 w-full">
                          {/* LTV Circular Progress */}
                          <div className="text-center">
                            <InfoTooltip tooltip="It is the ratio that measures the amount of a loan compared to the value of the collateral.">
                              <h3 className="text-gray-400 text-sm font-medium text-center">
                                Your LTV
                              </h3>
                            </InfoTooltip>
                            <div className="text-xl font-medium text-left">
                              {newLTV.toFixed(2)}%
                            </div>
                          </div>

                          {/* Liquidation LTV */}
                          <div className="text-center">
                            <InfoTooltip tooltip="Threshold LTV at which your Trove will be liquidated.">
                              <h3 className="text-gray-400 text-sm font-medium">
                                Liquidation LTV
                              </h3>
                            </InfoTooltip>
                            <div className="text-xl font-medium text-left">
                              {Math.round(
                                Number((1 / liquidationThreshold) * 10000)
                              ).toFixed(2)}
                              %
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between space-y-4 w-full">
                          {/*Liquidation Price */}
                          <div>
                            <InfoTooltip tooltip="If the market price falls below the liquidation price, the Trove may be liquidated.">
                              <h3 className="text-gray-400 text-sm font-medium">
                                Liquidation Price
                              </h3>
                            </InfoTooltip>
                            <div className="text-lg font-medium text-left">
                              $
                              {displayValue === "SUPRA"
                                ? liquidation.toFixed(4)
                                : liquidation.toFixed(3)}
                            </div>
                          </div>

                          {/* Current Price */}
                          <div>
                            <InfoTooltip tooltip="The current market price of the token.">
                              <h3 className="text-gray-400 text-sm font-medium">
                                Current Price
                              </h3>
                            </InfoTooltip>
                            <div className="text-lg font-medium text-left">
                              $
                              {displayValue === "SUPRA"
                                ? fetchedPrice.toFixed(4)
                                : fetchedPrice.toFixed(4)}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Section */}
                  <div className="mx-6">
                    <div className="flex flex-wrap">
                      <div className="w-full border-gray-400">
                        <TabView className="md:ml-0 -ml-2">
                          <TabPanel
                            className="p-[2px] bg-[#1dbdaf] text-sm font-poppins font-medium"
                            header="MINT"
                          >
                            <div className="p-5 border border-gray-400 bg-black">
                              <div className="flex flex-col md:flex-row md:justify-between gap-8 xl:gap-16">
                                {/* LEFT */}
                                <div className="grid w-full md:w-1/2 space-y-7 items-start gap-2 py-7 pr-7 md:py-5 md:pr-5 md:pl-2">
                                  <div className="flex flex-col">
                                    <Label
                                      htmlFor="items"
                                      className="font-poppins text-xl text-white font-medium"
                                    >
                                      Deposit more collateral
                                    </Label>

                                    <DynamicInput
                                      id="depositCollateral"
                                      label=""
                                      icon={imageSrc}
                                      symbol={displayValue}
                                      placeholder="Enter the amount of collateral"
                                      value={userInputs.depositCollateral}
                                      onChange={(newValue) => {
                                        setUserInputs({
                                          ...userInputs,
                                          depositCollateral: newValue,
                                        });
                                      }}
                                      walletBalance={Number(balanceData)}
                                      dollarValue={
                                        parseFloat(
                                          userInputs.depositCollateral || "0"
                                        ) * Number(fetchedPrice)
                                      }
                                      dollarValueBalance={Number(
                                        Number(balanceData) * fetchedPrice
                                      ).toFixed(2)}
                                      maxLength={8}
                                      decimals={
                                        displayValue === "SUPRA" ? 2 : 6
                                      }
                                      isLoading={false}
                                      isDisabled={!isConnected}
                                      showPercentages={true}
                                      errorMessage={
                                        isCollInValid
                                          ? "Insufficient balance"
                                          : ""
                                      }
                                      infoText={`The amount of ${displayValue} in your wallet.`}
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <div>
                                      <Label
                                        htmlFor="quantity"
                                        className="font-poppins text-xl text-white font-medium"
                                      >
                                        Borrow more $CASH
                                      </Label>
                                    </div>

                                    <DynamicInput
                                      id="borrow"
                                      label=""
                                      icon={CASH}
                                      symbol="CASH"
                                      placeholder="Enter the amount you want to mint"
                                      value={userInputs.borrow}
                                      onChange={(newValue) => {
                                        setUserInputs({
                                          ...userInputs,
                                          borrow: newValue,
                                        });
                                      }}
                                      walletBalance={
                                        totalAvailableBorrow >= 0
                                          ? totalAvailableBorrow
                                          : availableToBorrow
                                      }
                                      dollarValue={Number(
                                        userInputs.borrow || "0"
                                      ).toFixed(2)}
                                      dollarValueBalance={Number(
                                        totalAvailableBorrow >= 0
                                          ? totalAvailableBorrow
                                          : availableToBorrow
                                      ).toFixed(2)}
                                      maxLength={6}
                                      isLoading={false}
                                      isDisabled={!isConnected}
                                      showPercentages={true}
                                      errorMessage={
                                        isDebtInValid
                                          ? "Amount exceeds available to borrow"
                                          : !isCollInValid &&
                                            !isDebtInValid &&
                                            ltv >= 40 &&
                                            (parseFloat(userInputs.borrow) >
                                              0 ||
                                              parseFloat(
                                                userInputs.depositCollateral
                                              ) > 0)
                                            ? "Your LTV is too high and Trove can be liquidated"
                                            : ""
                                      }
                                      infoText="The amount of $CASH you can borrow using the deposited collateral and the increment entered above."
                                      maxValue={
                                        totalAvailableBorrow >= 0
                                          ? totalAvailableBorrow
                                          : availableToBorrow
                                      }
                                      balanceLabel="Available"
                                    />

                                    <button
                                      onClick={() =>
                                        handleBorrow(
                                          Number(userInputs.borrow),
                                          Number(userInputs.depositCollateral)
                                        )
                                      }
                                      className={`mt-9 md:ml-0 w-full max-w-[80vw] md:max-w-none font-poppins font-bold h-12
                                   ${isDebtInValid ||
                                          ltv > 100 / Number(divideBy) ||
                                          isCollInValid ||
                                          userInputColl + userInputDebt == 0
                                          ? "bg-black text-gray-400 border border-gray-400 cursor-not-allowed"
                                          : "hover:bg-[#2b4e51] cursor-pointer bg-[#1dbdaf] text-black"
                                        }`}
                                      disabled={
                                        isDebtInValid ||
                                        isCollInValid ||
                                        userInputColl + userInputDebt == 0 ||
                                        ltv > 100 / Number(divideBy)
                                      }
                                    >
                                      UPDATE TROVE
                                    </button>
                                  </div>
                                </div>
                                {/* RIGHT */}
                                <div className="w-full md:w-1/2 xl:w-[45%] px-4 md:px-6 md:-ml-6 pt-9 md:h-fit bg-[#222222] md:pt-10 md:pb-10 md:mt-10 text-sm">
                                  <div className="flex flex-col gap-y-2">
                                    <div className="flex flex-col md:flex-row">
                                      <div className="md:w-1/2 flex items-center">
                                        <span className="body-text text-lg whitespace-nowrap text-gray-400 font-medium">
                                          Loan-To-Value
                                        </span>
                                        <Image
                                          width={15}
                                          className="toolTipHolding9 ml-1.5 cursor-pointer"
                                          src={info}
                                          data-pr-tooltip=""
                                          alt="info"
                                        />
                                        <Tooltip
                                          className="font-poppins"
                                          target=".toolTipHolding9"
                                          content="It is a ratio that measures the amount of a loan compared to the value of the collateral."
                                          mouseTrack
                                          mouseTrackLeft={10}
                                        />
                                      </div>
                                      <div className="md:w-1/2 text-lg whitespace-nowrap body-text flex justify-end pl-2">
                                        <div className="flex items-center gap-x-2">
                                          <span
                                            className={`overflow-x-clip text-lg font-poppins font-medium ${newLTV <= 20
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
                                          {userInputColl + userInputDebt >=
                                            1 && (
                                              <div className="flex justify-center items-center gap-x-2">
                                                <span className="text-sm">
                                                  <FaArrowRightLong />
                                                </span>
                                                <span
                                                  className={`overflow-x-clip text-lg font-poppins font-medium ${ltv <= 20
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
                                            {Math.round(
                                              Number(
                                                (1 / liquidationThreshold) *
                                                10000
                                              )
                                            ).toFixed(2)}
                                            %
                                          </span>
                                        </div>
                                      </div>
                                    </div>
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
                                          {userInputColl + userInputDebt >=
                                            1 && (
                                              <div className="flex justify-center items-center gap-x-2">
                                                <span className="text-sm">
                                                  <FaArrowRightLong />
                                                </span>
                                                <span
                                                  className={
                                                    "text-lg body-text font-medium"
                                                  }
                                                >
                                                  {" "}
                                                  $
                                                  {Number(
                                                    liquidationPrice
                                                  ).toFixed(4)}{" "}
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-row mt-4">
                                      <Image
                                        src={info1}
                                        alt="info"
                                        className="mr-2 -mt-1"
                                        width={21}
                                        height={21}
                                      />
                                      <p className="text-xs text-gray-400 body-text font-medium">
                                        If the market price falls below the
                                        liquidation price, the Trove maybe
                                        liquidated.
                                      </p>
                                    </div>
                                    <div>
                                      <hr className="border-[#827f77] border my-4" />
                                    </div>
                                    {/* TOTAL DEBT */}
                                    <div className="flex flex-col md:flex-row">
                                      <div className="md:w-1/2 flex items-center">
                                        <span className="body-text text-sm whitespace-nowrap text-gray-400 font-medium">
                                          Total Debt
                                        </span>
                                        <Image
                                          width={15}
                                          className="toolTipHolding11 ml-1.5 cursor-pointer"
                                          src={info}
                                          data-pr-tooltip=""
                                          alt="info"
                                        />
                                        <Tooltip
                                          className="font-poppins"
                                          target=".toolTipHolding11"
                                          content="Total amount of stablecoin borrowed + liquidation reserve + borrowing fee."
                                          mouseTrack
                                          mouseTrackLeft={10}
                                        />
                                      </div>
                                      <div className="md:w-1/2 text-sm whitespace-nowrap body-text flex justify-end pl-2">
                                        <div className="flex items-center gap-x-2">
                                          <span className="font-medium body-text">
                                            {formatLargeNumber(
                                              Number(entireDebtAndColl.debt) /
                                              100000000
                                            ) + " "}
                                            CASH
                                          </span>
                                          {userInputDebt > 0 && (
                                            <div className="flex justify-center items-center gap-x-2">
                                              <span className="text-sm">
                                                <FaArrowRightLong />
                                              </span>
                                              <span className="text-sm body-text font-medium">
                                                {formatLargeNumber(
                                                  Number(totalDebt)
                                                )}{" "}
                                                CASH
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row">
                                      <div className="md:w-1/2 flex items-center">
                                        <span className="body-text text-sm whitespace-nowrap text-gray-400 font-medium">
                                          Total Collateral
                                        </span>
                                        <Image
                                          width={15}
                                          className="toolTipHolding17 ml-1.5 cursor-pointer"
                                          src={info}
                                          data-pr-tooltip=""
                                          alt="info"
                                        />
                                        <Tooltip
                                          className="font-poppins"
                                          target=".toolTipHolding17"
                                          mouseTrack
                                          content="Total amount of collateral supplied in the position."
                                          mouseTrackLeft={10}
                                        />
                                      </div>
                                      <div className="md:w-1/2 text-sm whitespace-nowrap body-text flex justify-end pl-2">
                                        <div className="flex items-center gap-x-2">
                                          <span className="font-medium body-text">
                                            {formatLargeNumber(
                                              Number(entireDebtAndColl.coll) /
                                              100000000
                                            )}{" "}
                                            {displayValue}
                                          </span>
                                          {userInputColl == 1 && (
                                            <div className="flex justify-center items-center gap-x-2">
                                              <span className="text-sm">
                                                <FaArrowRightLong />
                                              </span>
                                              <span className="text-sm body-text font-medium">
                                                {formatLargeNumber(
                                                  Number(newUserColl)
                                                )}{" "}
                                                {displayValue}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {userInputDebt == 1 && (
                                    <div className="flex flex-col md:flex-row mt-2">
                                      <div className="md:w-1/2 flex items-center">
                                        <span className="body-text text-sm whitespace-nowrap text-gray-400 font-medium">
                                          Borrowing Fee
                                        </span>
                                        <Image
                                          width={15}
                                          className="toolTipHolding12 ml-1.5 cursor-pointer"
                                          src={info}
                                          data-pr-tooltip=""
                                          alt="info"
                                        />
                                        <Tooltip
                                          className="font-poppins"
                                          target=".toolTipHolding12"
                                          content="One-time fee charged on the borrowed amount."
                                          mouseTrack
                                          mouseTrackLeft={10}
                                        />
                                      </div>
                                      <div className="md:w-1/2 text-sm whitespace-nowrap body-text flex justify-end pl-2">
                                        <div className="flex items-center ">
                                          <span className="font-medium body-text">
                                            {formatLargeNumber(
                                              Number(borrowingFee)
                                            )}{" "}
                                            CASH
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabPanel>

                          <TabPanel
                            className="p-[2px] bg-[#1dbdaf] text-sm body-text"
                            header="REPAY"
                          >
                            <div className="w-full h-full border p-5 border-gray-400 bg-black">
                              <Repay
                                coll={
                                  parseFloat(entireDebtAndColl.coll) / 100000000
                                }
                                debt={
                                  parseFloat(entireDebtAndColl.debt) / 100000000
                                }
                                lr={lr}
                                fetchedPrice={Number(fetchedPrice)}
                                borrowRate={borrowRate}
                                minDebt={minDebt}
                                mCR={mCR}
                                troveStatus={troveStatus}
                                liquidationThreshold={liquidationThreshold}
                                balanceAmount={oreBalance}
                                displayValue={displayValue}
                              />
                            </div>
                          </TabPanel>
                          <TabPanel
                            className="p-[2px] bg-[#1dbdaf] text-sm font-poppins font-medium"
                            header="CLOSE"
                          >
                            <div className="w-full h-full bg-black">
                              <CloseTrove
                                entireDebtAndColl={
                                  parseFloat(entireDebtAndColl.coll) / 100000000
                                }
                                debt={
                                  parseFloat(entireDebtAndColl.debt) / 100000000
                                }
                                debtwithoutDecimals={Number(
                                  entireDebtAndColl.debt
                                )}
                                liquidationReserve={lr}
                                balanceAmount={oreBalance}
                                displayValue={displayValue}
                              />
                            </div>
                          </TabPanel>
                        </TabView>

                        <div>
                          <RedemptionHistory display={displayValue} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : troveStatus === "INACTIVE" ||
                troveStatus === "LIQUIDATED" ||
                troveStatus === "REDEEMED" ||
                troveStatus === "CLOSED" ? (
                <div className="w-full h-auto">
                  <OpenTrove />
                </div>
              ) : (
                <FullScreenLoader />
              )}
            </>
          ) : (
            <>
              <FullScreenLoader />
            </>
          )}
        </Layout>
      )}

      <Dialog
        visible={loadingModalVisible}
        onHide={() => setLoadingModalVisible(false)}
        className="w-full md:max-w-[380px]"
      >
        <div className="flex items-center justify-center">
          <div className="w-[90%] max-w-[380px] bg-[#222222] p-4 md:p-6 flex flex-col justify-around border border-gray-400 min-h-[450px]">
            <div className="flex flex-col items-center">
              {loadingMessage === "Waiting for transaction to confirm.." ? (
                <>
                  <Image src={conf} alt="rectangle" width={150} />
                  <div className="my-5 ml-24 mt-12"></div>
                  <div className="font-bold font-poppins text-[#1DBDAF] text-center mt-4">
                    {loadingMessage}
                  </div>
                </>
              ) : loadingMessage === "Trove updated successfully." ? (
                <>
                  <Image src={tick} alt="tick" width={100} />
                  <div className="font-bold font-poppins text-[#1DBDAF] text-center mt-4">
                    {loadingMessage}
                  </div>
                  <div className="w-full h-auto mt-4 bg-[#2F2F2F] p-4 rounded-md">
                    {userInputs.depositCollateral && (
                      <p className="text-[#1DBDAF] mt-2 flex text-sm justify-between font-medium">
                        <p className="text-white text-sm font-medium">
                          You deposited:
                        </p>
                        {userInputs.depositCollateral} {displayValue}
                      </p>
                    )}
                    {userInputs.borrow && (
                      <p className="text-[#1DBDAF] mt-2 text-sm flex justify-between font-medium">
                        <p className="text-white text-sm font-medium">
                          You borrowed:
                        </p>
                        {userInputs.borrow} CASH
                      </p>
                    )}
                    <p className="text-[#1DBDAF] mt-2 text-sm flex justify-between font-medium">
                      <p className="text-white text-sm font-medium">
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
                <>
                  <Image src={rej} alt="rejected" width={150} />
                  <div className="my-5 ml-24 mb-5"></div>
                  <div className="font-poppins text-[#1dbdaf] text-center mt-4">
                    {loadingMessage}
                  </div>
                  <p className="font-poppins text-[#1dbdaf] text-xs mt-2 mb-2">
                    {transactionRejected
                      ? "Transaction was rejected. Please try again."
                      : "Some Error Occurred On Network Please Try Again After Some Time.. 🤖"}
                  </p>
                </>
              ) : (
                <Image src={conf} alt="box" width={150} />
              )}

              {isSuccess && (
                <button
                  className="mt-4 p-3 w-full text-black font-bold font-poppins hover:bg-[#2b4e51] bg-[#1dbdaf]"
                  onClick={handleClose}
                >
                  Close
                </button>
              )}
              {(transactionRejected || (!isSuccess && showCloseButton)) && (
                <Button
                  className="mt-4 p-3 w-full text-black font-poppins rounded-md bg-[#1dbdaf] hover:bg-[#2b4e51]"
                  onClick={handleClose}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Borrow;
