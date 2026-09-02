import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import type { StaticImageData } from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatLargeNumber,
  formatLargeNumberWithoutDecimals,
} from "../getActualDecimal";
import { Knob } from "primereact/knob";
import icircle from "../../app/assets/images/info.svg";
import opentrove from "../../app/assets/opentrove.svg";
import ACTIVE from "@/app/assets/active.svg";
import { Tooltip } from "primereact/tooltip";
import { useWallet } from "../../context/WalletContext";
import {
  module_address,
  module_name,
  supra_coin,
  stsupra_coin,
} from "@/constants/constants";
import ConnectButton from "../Connectxion";

interface TroveCardProps {
  title: string;
  assest: string;
  logo: string | StaticImageData;
  config: {
    maxLtv: string;
    borrowRate: number;
    minDebt: number;
    price: number;
    systemCollRatio: number;
  } | null;
  circleMinted: number;

  maxMint: number;
  isLoading: boolean;
  status: boolean;
  href: string;
}

const COLLATERAL_ADDRESSES: Record<string, string> = {
  stSUPRA: "0x81846514536430ea934c7270f86cf5b067e2a2faef0e91379b4f284e91c7f53c",
  SUPRA: "0x1",
};

export function TroveCard({
  title,
  assest,
  logo,
  config,
  circleMinted,
  isLoading: externalLoading,
  status,
  href,

  maxMint,
}: TroveCardProps) {
  const { account } = useWallet();

  const displayValue = useMemo(() => {
    return assest === "stSUPRA" || assest === "SUPRA" ? assest : undefined;
  }, [assest]);

  // Helper function to get the correct collateral address based on asset type
  const getCollateralAddress = useMemo(() => {
    switch (title) {
      case "SUPRA Trove":
        return supra_coin;
      case "stSUPRA Trove":
        return stsupra_coin;
      default:
        return supra_coin; // fallback to SUPRA
    }
  }, [title]);

  // Helper function to get the correct module address based on trove type
  const getModuleAddress = useMemo(() => {
    switch (title) {
      case "SUPRA Trove":
        return module_address;
      case "stSUPRA Trove":
        return module_address;
      default:
        return module_address; // fallback to SUPRA
    }
  }, [title]);

  // Helper function to get the correct module name based on trove type
  const getModuleName = useMemo(() => {
    switch (title) {
      case "SUPRA Trove":
        return module_name;
      case "stSUPRA Trove":
        return module_name;
      default:
        return module_name; // fallback to SUPRA
    }
  }, [title]);

  const [userPosition, setUserPosition] = useState({
    debt: "0",
    coll: "0",
    active: false,
  });

  const [systemStats, setSystemStats] = useState({
    totalCollateral: 0,
    totalDebt: 0,
  });

  const [positionLoading, setPositionLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [positionStatus, setPositionStatus] = useState("inactive");
  const [positionHistoryLoading, setPositionHistoryLoading] = useState(false);

  // Calculate if any data is still loading
  const isLoading = useMemo(
    () => externalLoading || positionLoading || statsLoading,
    [externalLoading, positionLoading, statsLoading]
  );
  // Merge prop status and on-chain active flag
  const isActive = status || userPosition.active;

  // Calculate LTV
  const ltv = useMemo(() => {
    if (!userPosition.coll || !userPosition.debt || !config?.price) return 0;
    return parseFloat(
      (
        (Number(userPosition.debt) * 100) /
        (Number(userPosition.coll) * Number(config.price) || 1)
      ).toFixed(2)
    );
  }, [userPosition.coll, userPosition.debt, config?.price]);

  // Calculate SCR
  const systemCollRatio = useMemo(() => {
    if (!systemStats.totalDebt || !config?.price) return 0;
    return (systemStats.totalCollateral * config.price) / systemStats.totalDebt;
  }, [systemStats.totalCollateral, systemStats.totalDebt, config?.price]);

  // Fetch position history if not active
  useEffect(() => {
    let isMounted = true;

    const fetchPositionHistory = async () => {
      if (!account || status || !displayValue) {
        return;
      }

      try {
        setPositionHistoryLoading(true);

        const collAddress =
          COLLATERAL_ADDRESSES[displayValue] || "0x1";

        const response = await axios.get(
          `https://api.solido.money/positions/history?walletAddress=${account}&collAddress=${collAddress}`
        );

        if (!isMounted) return;

        if (
          response.data &&
          response.data.success &&
          response.data.data.length > 0
        ) {
          const positionData = response.data.data[0];
          const status = positionData?.status;
          if (status === "CLOSED") {
            setPositionStatus("inactive");
          } else {
            setPositionStatus(status);
          }
        }
      } catch (error) {
        console.error("Error fetching position history:", error);
      } finally {
        if (isMounted) {
          setPositionHistoryLoading(false);
        }
      }
    };

    fetchPositionHistory();
    return () => {
      isMounted = false;
    };
  }, [account, status, displayValue, getCollateralAddress]);

  // Fetch user position data (slow API)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fetchUserPosition = async () => {
      if (!account || !displayValue) {
        setPositionLoading(false);
        return;
      }

      try {
        setPositionLoading(true);
        const response = await axios.post(
          "https://rpc-mainnet.supra.com/rpc/v2/view",
          {
            function: `${getModuleAddress}::${getModuleName}::get_user_position`,
            type_arguments: [getCollateralAddress],
            arguments: [account],
          },
          { signal: controller.signal }
        );

        if (!isMounted) return;
        clearTimeout(timeoutId);

        setUserPosition({
          coll: response.data.result[0],
          debt: response.data.result[1],
          active: response.data.result[2],
        });
      } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) {
          console.log("Request canceled:", error.message);
        } else {
          console.error("Error fetching user position:", error);
        }
      } finally {
        if (isMounted) {
          setPositionLoading(false);
        }
      }
    };

    fetchUserPosition();
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [
    account,
    displayValue,
    getCollateralAddress,
    getModuleAddress,
    getModuleName,
  ]);

  // Fetch system statistics
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fetchSystemStats = async () => {
      if (!displayValue) {
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);
        const response = await axios.get(
          "https://api.solido.money/protocol/metrics"
          // { signal: controller.signal }
        );

        if (!isMounted) return;
        clearTimeout(timeoutId);

        // Check if the response is successful and has metrics
        if (response.data && response.data.success) {
          const metrics = response.data.metrics || [];
          const relevantMetric = metrics.find(
            (metric: { token: string }) => metric.token === displayValue
          );

          if (relevantMetric) {
            setSystemStats({
              totalCollateral: relevantMetric.totalColl,
              totalDebt: relevantMetric.totalDebt,
            });
          }
        } else {
          console.error("Invalid response from metrics API:", response.data);
        }
      } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) {
          console.log("Request canceled:", error.message);
        } else {
          console.error("Error fetching system stats:", error);
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    fetchSystemStats();
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [displayValue]);

  // Helper function to get color based on LTV value
  const getLTVColor = (ltvValue: number) => {
    if (ltvValue <= 25) return "#3dde84";
    if (ltvValue <= 50) return "#ffcc00";
    if (ltvValue <= 60) return "#ffa500";
    return "#ff0000";
  };

  // Helper function to get SCR color
  const getSCRColor = (scr: number) => {
    if (scr * 100 <= 200) return "text-red-500";
    if (scr * 100 > 200 && scr * 100 <= 300) return "text-yellow-500";
    return "text-green-500";
  };

  // Helper function to get status display text
  const getStatusDisplayText = () => {
    if (status) return "Active";
    if (positionStatus === "redeemed") return "Redeemed";
    if (positionStatus === "liquidated") return "Liquidated";
    return "Connect wallet to see your stats";
  };

  // Helper function to determine redirect page based on status
  const getRedirectHref = () => {
    if (status) return href;
    if (positionStatus === "redeemed") return `/borrow/selectedTrove/history`;
    if (positionStatus === "liquidated") return `/borrow/selectedTrove/history`;
    return href;
  };

  const ltvColor = getLTVColor(ltv);
  const scrColor = getSCRColor(systemCollRatio);

  return (
    <div className="border-2 border-gray-400 w-full max-w-[431px] mb-24">
      {/* Card Header - Always visible */}
      <div className="flex justify-between items-center mb-4 bg-[#222222] px-4 py-4 gap-2">
        <div className="flex gap-2">
          <Image
            src={logo || "/placeholder.svg"}
            alt={`${title} Logo`}
            className="w-10 h-10"
          />
          <h2 className="text-lg font-semibold text-white mt-2">{title}</h2>
        </div>

        {isActive && (
          <div className="flex flex-col text-white">
            <Image width={120} height={120} src={ACTIVE} alt="Active status" />
          </div>
        )}

        {!isActive &&
          (positionStatus === "redeemed" ||
            positionStatus === "liquidated") && (
            <div
              className={`flex flex-col text-white px-3 py-1 ${positionStatus === "redeemed"
                ? "border border-yellow-500"
                : "border border-red-500"
                }`}
            >
              <span
                className={`text-xs font-medium ${positionStatus === "redeemed"
                  ? "text-yellow-500"
                  : "text-red-500"
                  }`}
              >
                {positionStatus === "redeemed" ? "REDEEMED" : "LIQUIDATED"}
              </span>
            </div>
          )}
      </div>

      {/* Card Body - Active Trove */}
      {isActive ? (
        <div className="flex flex-col justify-between p-2">
          <div className="flex flex-row gap-4 items-start text-white font-medium justify-between mb-4 px-4">
            {/* Debt Section */}
            <div>
              <div className="flex items-center">
                <p className="text-white text-xs">Debt</p>
                <Image
                  width={15}
                  className="toolTipHolding41 ml_5 cursor-pointer"
                  src={icircle}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="font-poppins font-medium2"
                  target=".toolTipHolding41"
                  content="One-time fee on the borrowed amount."
                  mouseTrack
                  mouseTrackLeft={10}
                  style={{ backgroundColor: "#2F2F2F" }}
                />
              </div>
              {positionLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <>
                  <p className="text-white text-sm font-semibold">
                    {formatLargeNumber(Number(userPosition.debt) / 100000000)}{" "}
                    CASH
                  </p>
                  <p className="text-white text-xs">
                    ${formatLargeNumber(Number(userPosition.debt) / 100000000)}
                  </p>
                </>
              )}
            </div>

            {/* Collateral Section */}
            <div>
              <div className="flex items-center">
                <p className="text-white text-xs">Collateral</p>
                <Image
                  width={15}
                  className="toolTipHolding42 ml_5 cursor-pointer"
                  src={icircle}
                  data-pr-tooltip=""
                  alt="info"
                />
                <Tooltip
                  className="font-poppins font-medium2"
                  target=".toolTipHolding42"
                  content="Total amount of collateral supplied in the position."
                  mouseTrack
                  mouseTrackLeft={10}
                  style={{ backgroundColor: "#2F2F2F" }}
                />
              </div>
              {positionLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <>
                  <p className="text-white text-sm font-semibold">
                    {formatLargeNumber(Number(userPosition.coll) / 100000000)}{" "}
                    {displayValue}
                  </p>
                  <p className="text-white text-xs">
                    $
                    {formatLargeNumber(
                      (Number(userPosition.coll) * (config?.price || 0)) /
                      100000000
                    )}
                  </p>
                </>
              )}
            </div>

            {/* LTV Knob Section */}
            <div className="flex flex-row md:flex-col justify-between text-white">
              <div className="flex">
                <div className="h-1/2 flex flex-col items-center">
                  <div className="flex items-center">
                    <p className="text-white text-xs">Loan To Value</p>
                    <Image
                      width={15}
                      className="toolTipHolding43 ml_5 cursor-pointer"
                      src={icircle}
                      data-pr-tooltip=""
                      alt="info"
                    />
                    <Tooltip
                      className="font-poppins font-medium2"
                      target=".toolTipHolding43"
                      content="It is the ratio that measures the amount of a loan compared to the value of the collateral."
                      mouseTrack
                      mouseTrackLeft={10}
                      style={{ backgroundColor: "#2F2F2F" }}
                    />
                  </div>
                  {positionLoading ? (
                    <Skeleton className="h-24 w-24 rounded-full" />
                  ) : (
                    <Knob
                      value={ltv}
                      showValue={true}
                      size={100}
                      rangeColor="#78887f"
                      valueColor={ltvColor}
                      strokeWidth={7}
                      readOnly
                      className="text-white"
                      textColor={ltvColor}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <hr className="border-[1px] border-gray-400 mt-4" />
        </div>
      ) : (
        // Card Body - Inactive Trove
        <div className="flex flex-col justify-between p-2">
          <div className="flex flex-col items-center text-white font-medium gap-2 mb-[43px]">
            <Image src={opentrove} alt="open trove" />
            <div>
              {!account
                ? "Connect wallet to see your stats"
                : positionStatus === "redeemed"
                  ? "Your Position has been redeemed"
                  : positionStatus === "liquidated"
                    ? "Your Position has been liquidated"
                    : "Open Trove to see your stats"}
            </div>
          </div>
          <hr className="border-[1px] border-gray-400" />
        </div>
      )}

      {/* Card Stats - Show system stats immediately if available */}
      <div className="flex flex-row justify-around pt-4 px-2 gap-4 my-4">
        {/* Column 1 */}
        <div className="flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center">
              <p className="text-white text-xs">Current Price</p>
              <Image
                width={15}
                className="toolTipHolding50 ml_5 cursor-pointer"
                src={icircle}
                data-pr-tooltip=""
                alt="info"
              />
              <Tooltip
                className="font-poppins font-medium2"
                target=".toolTipHolding50"
                content="The current market price of the token."
                mouseTrack
                mouseTrackLeft={10}
                style={{ backgroundColor: "#2F2F2F" }}
              />
            </div>
            {!config ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-white text-sm font-semibold">
                $
                {config?.price
                  ? config.price.toFixed(displayValue === "stSUPRA" ? 4 : 4)
                  : "0.00"}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center">
              <p className="text-white text-xs">$CASH Minted</p>
              <Image
                width={15}
                className="toolTipHolding53 ml_5 cursor-pointer"
                src={icircle}
                data-pr-tooltip=""
                alt="info"
              />
              <Tooltip
                className="font-poppins font-medium2"
                target=".toolTipHolding53"
                content="The amount of $CASH minted."
                mouseTrack
                mouseTrackLeft={10}
                style={{ backgroundColor: "#2F2F2F" }}
              />
            </div>
            {!config ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-white text-sm font-semibold">
                {formatLargeNumber(circleMinted)}
              </p>
            )}
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center">
              <p className="text-white text-xs">Max LTV</p>
              <Image
                width={15}
                className="toolTipHolding52 ml_5 cursor-pointer"
                src={icircle}
                data-pr-tooltip=""
                alt="info"
              />
              <Tooltip
                className="font-poppins font-medium2"
                target=".toolTipHolding52"
                content="The maximum loan to value ratio allowed by the protocol."
                mouseTrack
                mouseTrackLeft={10}
                style={{ backgroundColor: "#2F2F2F" }}
              />
            </div>
            {!config ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-white text-sm font-semibold">
                {config.maxLtv}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center">
              <p className="text-white text-xs">TCR</p>
              <Image
                width={15}
                className="toolTipHolding55 ml_5 cursor-pointer"
                src={icircle}
                data-pr-tooltip=""
                alt="info"
              />
              <Tooltip
                className="font-poppins font-medium2"
                target=".toolTipHolding55"
                content="Total Collateral Ratio"
                mouseTrack
                mouseTrackLeft={10}
                style={{ backgroundColor: "#2F2F2F" }}
              />
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className={`text-sm font-semibold ${scrColor}`}>
                {(systemCollRatio * 100).toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        {/* Column 3 */}
        <div className="flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center">
              <p className="text-white text-xs">Min. Debt</p>
              <Image
                width={15}
                className="toolTipHolding70 ml_5 cursor-pointer"
                src={icircle}
                data-pr-tooltip=""
                alt="info"
              />
              <Tooltip
                className="font-poppins font-medium2"
                target=".toolTipHolding70"
                content="Minimum amount of $CASH required to open a trove."
                mouseTrack
                mouseTrackLeft={10}
                style={{ backgroundColor: "#2F2F2F" }}
              />
            </div>
            {!config ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-white text-sm font-semibold">
                {config.minDebt} CASH
              </p>
            )}
          </div>
          <div className="mb-4">
            <div className="flex items-center">
              <p className="text-white text-xs">Vault Deposit</p>
              <Image
                width={15}
                className="toolTipHolding54 ml_5 cursor-pointer"
                src={icircle}
                data-pr-tooltip=""
                alt="info"
              />
              <Tooltip
                className="font-poppins font-medium2"
                target=".toolTipHolding54"
                content="The amount of assets held in all troves."
                mouseTrack
                mouseTrackLeft={10}
                style={{ backgroundColor: "#2F2F2F" }}
              />
            </div>
            {!config ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-white text-sm font-semibold">
                {formatLargeNumber(systemStats.totalCollateral)}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-[1px] border-gray-400" />

      {/* Card Footer */}
      <div className="mt-4 px-6 mb-4">
        {/* Card Footer */}
        <div className="mt-4 px-6 mb-4">
          {account ? (
            <Link
              href={getRedirectHref()}
              className={`w-full block text-center py-2 font-semibold transition-colors ${isActive ||
                positionStatus === "redeemed" ||
                positionStatus === "liquidated"
                ? " bg-[#1DBDAF] text-black hover:bg-[#2b4e51]"
                : "bg-[#1DBDAF] text-black hover:bg-[#2b4e51]"
                }`}
            >
              {isActive ||
                positionStatus === "redeemed" ||
                positionStatus === "liquidated"
                ? "See Details"
                : "Open Trove"}
            </Link>
          ) : (
            <ConnectButton isPadding={true} />
          )}
        </div>
      </div>
    </div>
  );
}
