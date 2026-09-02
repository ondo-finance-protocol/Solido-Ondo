// components/SolidoDashboard.jsx
import FullScreenLoader from "@/components/FullScreenLoader";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Define interfaces for API data and state
interface TokenMetrics {
  token: string;
  decimals: number;
  price: number;
  MCR: number;
  minDebt: number;
  liquidationReserve: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  liquidationFeeProtocol: number;
  borrowRate: number;
  totalColl: number;
  totalDebt: number;
  maxMint: number;
  redemptionFee: number;
  redemptionGratuity: number;
  pauseFunctionResponses: {
    open_trove: boolean;
    borrow: boolean;
    deposit: boolean;
    redeem: boolean;
  };
}

interface ApiMetricsResponse {
  status: string;
  success: boolean;
  metrics: TokenMetrics[];
  priceCIRCLE: number;
  pricebCASH: number;
  stakedCASH: number;
  stakedSUPRA: number;
  pricestSUPRA: number;
  lastUpdated: string;
}

interface ApiDataItem {
  timestamp: string;
  totalColl: number;
  totalDebt: number;
  price: number;
  pricebCash: number;
  stakedCASH: number;
  stakedSUPRA: number;
  pricestSUPRA: number;
  activePositions: number;
  closedPositions?: number;
  redeemedPositions?: number;
  liquidatedPositions?: number;
  uniqueAddresses: number;
}

interface TvlDataItem {
  timestamp: Date;
  tvl: number;
  totalDebt: number;
  pricebCash: number;
  stakedCASH: number;
  pricestSUPRA: number;
  stakedSUPRA: number;
}

interface PriceTcrDataItem {
  timestamp: Date;
  price: number;
  tcr: number;
  pricebCash: number;
  stakedCASH: number;
  pricestSUPRA: number;
  stakedSUPRA: number;
}

interface PositionsDataItem {
  timestamp: Date;
  activePositions: number;
  closedPositions: number;
  redeemedPositions: number;
  liquidatedPositions: number;
}

interface UserDataItem {
  timestamp: Date;
  totalUsers: number;
  newUsers: number;
}

interface CurrentData {
  tvl: number;
  totalDebt: number;
  price: number;
  tcr: number;
  activePositions: number;
  closedPositions: number;
  redeemedPositions: number;
  liquidatedPositions: number;
  totalPositions: number;
  totalUsers: number;
  newUsers24h: number;
}

interface TransformedData {
  tvlData: TvlDataItem[];
  priceTcrData: PriceTcrDataItem[];
  positionsData: PositionsDataItem[];
  userData: UserDataItem[];
  currentData: CurrentData;
}

interface PieChartItem {
  name: string;
  value: number;
  color: string;
}
const CACHE_KEY = 'solido_dashboard_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; 

const saveToCache = (data: any) => {
  try {
    const cacheData = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Failed to save to cache:', e);
  }
};

const getFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < CACHE_DURATION) return data;

    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (e) {
    console.warn('Failed to read from cache:', e);
    return null;
  }
};

const SolidoDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<TransformedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState("cash");
  const [selectedCollateral, setSelectedCollateral] = useState("SUPRA");
  const [availableCollaterals, setAvailableCollaterals] = useState<string[]>(["SUPRA"]);
  const [metricsData, setMetricsData] = useState<ApiMetricsResponse | null>(null);


  // Initialize from URL parameters
  useEffect(() => {
    const collateralParam = searchParams.get('collateral');
    if (collateralParam) {
      setSelectedCollateral(collateralParam);
    }
  }, [searchParams]);

  // Update URL when collateral changes
  const updateCollateralInUrl = useCallback((collateral: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('collateral', collateral);
    router.push(`/stats?${params.toString()}`, { scroll: false });
    setSelectedCollateral(collateral);
  }, [searchParams, router]);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Theme colors to match your application
  const theme = {
    background: "#121212",
    cardBackground: "#1E1E1E",
    primary: "#00D1B2", // Teal color from your app
    secondary: "#F3CA00", // Yellow for charts
    text: "#FFFFFF",
    textSecondary: "#B3B3B3",
    accent: "#F44336",
    chart: {
      tvl: "#00D1B2", // Teal
      debt: "#FFFFFF", // White
      price: "#F3CA00", // Yellow
      tcr: "#FF5722", // Orange
    },
    positions: {
      activePositions: "#00D1B2", // Teal
      closedPositions: "#2196F3", // Blue
      redeemedPositions: "#9C27B0", // Purple
      liquidatedPositions: "#F44336", // Red
    },
  };

  // Fetch metrics data from the new API
  const fetchMetrics = async () => {
    try {
      const response = await fetch("https://api.solido.money/protocol/metrics");
      if (!response.ok) {
        throw new Error(`Metrics API responded with status: ${response.status}`);
      }
      const metricsResponse: ApiMetricsResponse = await response.json();
      setMetricsData(metricsResponse);

      // Update available collaterals
      const collaterals = metricsResponse.metrics.map(m => m.token);
      setAvailableCollaterals(collaterals);

      // Set default collateral if not already selected
      if (!collaterals.includes(selectedCollateral)) {
        setSelectedCollateral(collaterals[0] || "SUPRA");
      }

      return metricsResponse;
    } catch (err) {
      console.error("Error fetching metrics:", err);
      throw err;
    }
  };
  // Cache configuration


  // Fetch data from the API
  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Try cache first
      if (!forceRefresh) {
        const cachedData = getFromCache();
        if (cachedData) {
          setData(cachedData.transformedData);
          setLastUpdated(new Date(cachedData.lastUpdated));
          setMetricsData(cachedData.metricsData);
          setAvailableCollaterals(cachedData.metricsData.metrics.map((m: any) => m.token));
          setLoading(false);

          // Background metrics refresh
          fetchMetrics().catch(console.error);

          setError(null);
          return;
        }
      }

      const metricsResponse = await fetchMetrics();

      // Fetch all pages like the original code
      let allData: ApiDataItem[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await fetch(`https://api.solido.money/stats?page=${page}&limit=100`);
        if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

        const apiData = await response.json();
        allData = [...allData, ...apiData.data];

        hasNextPage = apiData.pagination.hasNextPage;
        page++;

        // Optional: add a max limit to prevent too much data
        if (page > 50) break; // Stop after 50 pages (5000 records)
      }

      // Sort oldest → newest
      allData.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const transformedData = transformApiData(allData);

      setData(transformedData);
      const updateTime = new Date();
      setLastUpdated(updateTime);
      setError(null);

      // Save to cache
      saveToCache({
        transformedData,
        metricsData: metricsResponse,
        lastUpdated: updateTime,
      });

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };


  const transformApiData = useCallback((apiData: ApiDataItem[]): TransformedData => {
    if (!Array.isArray(apiData) || apiData.length === 0) {
      throw new Error("Invalid API response format");
    }

    // Sort by timestamp to ensure chronological order
    const sortedData = [...apiData].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Transform the data for TVL and Debt chart
    const tvlData = sortedData.map((item) => ({
      timestamp: new Date(item.timestamp),
      tvl: item.totalColl * item.price,
      totalDebt: item.totalDebt,
      pricebCash: item.pricebCash,
      stakedCASH: item.stakedCASH,
      pricestSUPRA: item.pricestSUPRA,
      stakedSUPRA: item.stakedSUPRA,
    }));

    // Create dataset for price and TCR chart
    const priceTcrData = sortedData.map((item) => {
      const totalCollValue = item.totalColl * item.price;
      const tcr = totalCollValue / item.totalDebt;

      return {
        timestamp: new Date(item.timestamp),
        price: item.price,
        tcr: tcr,
        pricebCash: item.pricebCash,
        stakedCASH: item.stakedCASH,
        pricestSUPRA: item.pricestSUPRA,
        stakedSUPRA: item.stakedSUPRA,
      };
    });

    // Positions data
    const positionsData = sortedData.map((item) => ({
      timestamp: new Date(item.timestamp),
      activePositions: item.activePositions,
      closedPositions: item.closedPositions || 0,
      redeemedPositions: item.redeemedPositions || 0,
      liquidatedPositions: item.liquidatedPositions || 0,
    }));

    // User data
    const userData = sortedData.map((item, index, array) => {
      // Calculate new users by comparing with previous entry
      let newUsers = 0;
      if (index > 0) {
        newUsers = Math.max(
          0,
          item.uniqueAddresses - array[index - 1].uniqueAddresses
        );
      }

      return {
        timestamp: new Date(item.timestamp),
        totalUsers: item.uniqueAddresses,
        newUsers: newUsers,
      };
    });

    // Get the most recent entry for current data
    const currentEntry = sortedData[sortedData.length - 1];
    const totalCollValue = currentEntry.totalColl * currentEntry.price;
    const tcr = totalCollValue / currentEntry.totalDebt;

    const currentData = {
      tvl: totalCollValue,
      totalDebt: currentEntry.totalDebt,
      price: currentEntry.price,
      tcr: tcr,
      activePositions: currentEntry.activePositions,
      closedPositions: currentEntry.closedPositions || 0,
      redeemedPositions: currentEntry.redeemedPositions || 0,
      liquidatedPositions: currentEntry.liquidatedPositions || 0,
      totalPositions:
        currentEntry.activePositions +
        (currentEntry.closedPositions || 0) +
        (currentEntry.redeemedPositions || 0) +
        (currentEntry.liquidatedPositions || 0),
      totalUsers: currentEntry.uniqueAddresses,
      newUsers24h: userData[userData.length - 1].newUsers,
    };

    return { tvlData, priceTcrData, positionsData, userData, currentData };
  }, []);

  // Load data on initial render and set up polling
  useEffect(() => {
    fetchData(false);

    // Set up polling every 2 hours
    // const intervalId = setInterval(fetchData, 2 * 60 * 60 * 1000);

    // // Clean up on unmount
    // return () => clearInterval(intervalId);
  }, []);

  // Filter data by time range
  const filterDataByTimeRange = useCallback(<T extends { timestamp: Date }>(
    dataArray: T[]
  ): T[] => {

    if (timeRange === "all" || !dataArray || dataArray.length === 0) {
      return dataArray;
    }

    const now = new Date(dataArray[dataArray.length - 1].timestamp);
    let startDate: Date;

    switch (timeRange) {
      case "day":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        return dataArray;
    }

    const filtered = dataArray.filter((item) => new Date(item.timestamp) >= startDate);

    return filtered;
  }, [timeRange]);

  // Formatting functions
  const formatDate = useCallback((date: Date | string): string => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatPrice = useCallback((value: number): string => {
    // Format price to 3 significant digits
    return parseFloat(value.toString()).toLocaleString(undefined, {
      minimumSignificantDigits: 3,
      maximumSignificantDigits: 3,
    });
  }, []);

  const formatRatio = useCallback((value: number): string => {
    // Format ratio with 2 decimal places
    return parseFloat(value.toString()).toFixed(2);
  }, []);

  const formatTooltipBeautified = useCallback((value: number): string => {
    const num = parseFloat(value.toString());
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(4) + "B";
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(4) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(4) + "K";
    } else {
      return num.toFixed(4);
    }
  }, []);

  // Display loading state while fetching initial data
  if (loading && !data) {
    return <FullScreenLoader />;
  }

  // Display error state
  if (error && !data) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen"
        style={{ backgroundColor: theme.background }}
      >
        <div className="text-2xl font-bold mb-4" style={{ color: theme.text }}>
          CASH Dashboard
        </div>
        <div
          className="p-8 rounded-lg shadow-lg text-center"
          style={{ backgroundColor: theme.cardBackground }}
        >
          <div className="text-5xl mb-4" style={{ color: theme.accent }}>
            ⚠️
          </div>
          <p className="font-bold mb-2" style={{ color: theme.text }}>
            Error Loading Data
          </p>
          <p className="mb-4" style={{ color: theme.textSecondary }}>
            {error}
          </p>
          <button
            onClick={() => fetchData(true)}
            className="px-4 py-2 rounded hover:opacity-90"
            style={{ backgroundColor: theme.primary, color: theme.background }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If mobile device, display message
  if (isMobile) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen p-4 text-center"
        style={{ backgroundColor: theme.background }}
      >
        <div className="text-3xl mb-4" style={{ color: theme.primary }}>
          📊
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>
          CASH Dashboard
        </h1>
        <div
          className="p-6 rounded-lg shadow-lg"
          style={{ backgroundColor: theme.cardBackground }}
        >
          <p className="text-xl mb-2" style={{ color: theme.text }}>
            Please use desktop to view stats
          </p>
          <p style={{ color: theme.textSecondary }}>
            This dashboard is optimized for larger screens.
          </p>
        </div>
      </div>
    );
  }

  // Get current collateral metrics
  const getCurrentCollateralMetrics = () => {
    if (!metricsData) return null;
    return metricsData.metrics.find(m => m.token === selectedCollateral);
  };

  const currentCollateralMetrics = getCurrentCollateralMetrics();

  // If we have data, filter it by the selected time range
  const tvlData = data ? filterDataByTimeRange(data.tvlData) : [];
  const priceTcrData = data ? filterDataByTimeRange(data.priceTcrData) : [];
  const positionsData = data ? filterDataByTimeRange(data.positionsData) : [];
  const userData = data ? filterDataByTimeRange(data.userData) : [];

  // Prepare pie chart data

  const positionsPieData: PieChartItem[] = data
    ? [
      {
        name: "Active",
        value: data.currentData.activePositions,
        color: theme.positions.activePositions,
      },
      {
        name: "Closed",
        value: data.currentData.closedPositions,
        color: theme.positions.closedPositions,
      },
      {
        name: "Redeemed",
        value: data.currentData.redeemedPositions,
        color: theme.positions.redeemedPositions,
      },
      {
        name: "Liquidated",
        value: data.currentData.liquidatedPositions,
        color: theme.positions.liquidatedPositions,
      },
    ].filter((item) => item.value > 0)
    : [];

  return (
    <div
      className="flex flex-col p-6 rounded-lg"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {activeView === "cash" && "CASH Dashboard"}
            {activeView === "grow" && "Grow Dashboard"}
            {activeView === "flow" && "Flow Dashboard"}
          </h1>
          {metricsData && (
            <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
              Current Collateral: {selectedCollateral}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end space-y-3">
          {/* View Selection Buttons - First Line */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView("cash")}
              className="px-4 py-2 rounded font-medium"
              style={{
                backgroundColor:
                  activeView === "cash" ? theme.primary : theme.cardBackground,
                color: activeView === "cash" ? theme.background : theme.text,
              }}
            >
              CASH
            </button>
            <button
              onClick={() => setActiveView("grow")}
              className="px-4 py-2 rounded font-medium"
              style={{
                backgroundColor:
                  activeView === "grow" ? theme.primary : theme.cardBackground,
                color: activeView === "grow" ? theme.background : theme.text,
              }}
            >
              GROW
            </button>
            <button
              onClick={() => setActiveView("flow")}
              className="px-4 py-2 rounded font-medium"
              style={{
                backgroundColor:
                  activeView === "flow" ? theme.primary : theme.cardBackground,
                color: activeView === "flow" ? theme.background : theme.text,
              }}
            >
              FLOW
            </button>
          </div>

          {/* Collateral Selection Buttons - Second Line (only for CASH view) */}
          {activeView === "cash" && availableCollaterals.length > 1 && (
            <div className="flex space-x-2">
              {availableCollaterals.map((collateral) => (
                <button
                  key={collateral}
                  onClick={() => updateCollateralInUrl(collateral)}
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor:
                      selectedCollateral === collateral
                        ? theme.primary
                        : theme.cardBackground,
                    color:
                      selectedCollateral === collateral
                        ? theme.background
                        : theme.text,
                    border: `1px solid ${selectedCollateral === collateral
                      ? theme.primary
                      : theme.textSecondary
                      }`,
                  }}
                >
                  {collateral}
                </button>
              ))}
            </div>
          )}

          {/* Time Range / Refresh Buttons can go below this */}
        </div>
      </div>


      {/* Loading indicator */}
      {loading && (
        <div
          className="p-2 rounded mb-4 text-center"
          style={{
            backgroundColor: "rgba(0, 209, 178, 0.2)",
            color: theme.primary,
          }}
        >
          Updating data...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="p-2 rounded mb-4 text-center"
          style={{
            backgroundColor: "rgba(244, 67, 54, 0.2)",
            color: theme.accent,
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Key Metrics - Only show in Cash view */}
      {activeView === "cash" && (
        <div className="grid grid-cols-6 gap-4 mb-6">
          {/* TVL - from historical data if available, otherwise calculate from current metrics */}
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              TVL ({selectedCollateral})
            </p>
            <p className="text-xl font-bold">
              {currentCollateralMetrics
                ? formatCurrency(currentCollateralMetrics.totalColl * currentCollateralMetrics.price)
                : data ? formatCurrency(data.currentData.tvl) : "—"
              }
            </p>
          </div>

          {/* Total Debt - from current metrics */}
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Total Debt
            </p>
            <p className="text-xl font-bold">
              {currentCollateralMetrics
                ? formatCurrency(currentCollateralMetrics.totalDebt)
                : data ? formatCurrency(data.currentData.totalDebt) : "—"
              }
            </p>
          </div>

          {/* Price - from current metrics */}
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              {selectedCollateral} Price
            </p>
            <p className="text-xl font-bold">
              {currentCollateralMetrics
                ? formatPrice(currentCollateralMetrics.price)
                : data ? formatPrice(data.currentData.price) : "—"
              }
            </p>
          </div>

          {/* TCR - calculated from current metrics */}
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              TCR
            </p>
            <p className="text-xl font-bold">
              {currentCollateralMetrics
                ? formatRatio((currentCollateralMetrics.totalColl * currentCollateralMetrics.price) / currentCollateralMetrics.totalDebt)
                : data ? formatRatio(data.currentData.tcr) : "—"
              }
            </p>
          </div>

          {/* MCR - from current metrics */}
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              MCR
            </p>
            <p className="text-xl font-bold">
              {currentCollateralMetrics
                ? `${currentCollateralMetrics.MCR.toFixed(2)}%`
                : "—"
              }
            </p>
          </div>

          {/* Max Mint - from current metrics */}
          <div
            className="py-4 px-1 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Max Mint
            </p>
            <p className="text-xl font-bold">
              {currentCollateralMetrics
                ? formatCurrency(currentCollateralMetrics.maxMint)
                : data ? data.currentData.totalUsers : "—"
              }
            </p>
          </div>

        </div>
      )}

      {/* Cash View - TVL and Total Debt Chart */}
      {activeView === "cash" && (
        <div
          className="p-4 rounded-lg shadow mb-6"
          style={{ backgroundColor: theme.cardBackground }}
        >

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold mb-4">TVL and Total Debt</h2>
            <div className="flex space-x-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange("day")}
                  className="px-3 py-1 rounded border border-[#AAAAAA]"
                  style={{
                    backgroundColor:
                      timeRange === "day" ? theme.primary : theme.cardBackground,
                    color: timeRange === "day" ? theme.background : theme.text,
                  }}
                >
                  24h
                </button>
                <button
                  onClick={() => setTimeRange("week")}
                  className="px-3 py-1 rounded border border-[#AAAAAA]"
                  style={{
                    backgroundColor:
                      timeRange === "week" ? theme.primary : theme.cardBackground,
                    color: timeRange === "week" ? theme.background : theme.text,
                  }}
                >
                  7d
                </button>
                <button
                  onClick={() => setTimeRange("month")}
                  className="px-3 py-1 rounded border border-[#AAAAAA]"
                  style={{
                    backgroundColor:
                      timeRange === "month"
                        ? theme.primary
                        : theme.cardBackground,
                    color: timeRange === "month" ? theme.background : theme.text,
                  }}
                >
                  30d
                </button>
                <button
                  onClick={() => setTimeRange("all")}
                  className="px-3 py-1 rounded border border-[#AAAAAA]"
                  style={{
                    backgroundColor:
                      timeRange === "all" ? theme.primary : theme.cardBackground,
                    color: timeRange === "all" ? theme.background : theme.text,
                  }}
                >
                  All
                </button>
              </div>

              <button
                onClick={() => fetchData(true)}
                className="px-3 py-1 rounded hover:opacity-90"
                style={{
                  backgroundColor: loading ? "#333333" : theme.primary,
                  color: loading ? theme.textSecondary : theme.background,
                }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tvlData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[1, 1.1]}
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[1, 1.1]}
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke={theme.textSecondary}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "TVL") {
                      return [
                        "$" + formatTooltipBeautified(value as number),
                        "TVL",
                      ];
                    } else {
                      return [
                        "$" + formatTooltipBeautified(value as number),
                        "Total Debt",
                      ];
                    }
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  contentStyle={{
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.textSecondary,
                    color: theme.text,
                  }}
                />
                <Legend wrapperStyle={{ color: theme.textSecondary }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="tvl"
                  name="TVL"
                  stroke={theme.chart.tvl}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalDebt"
                  name="Total Debt"
                  stroke={theme.chart.debt}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grow View - pricebCash vs stakedCASH */}
      {activeView === "grow" && (
        <div
          className="p-4 rounded-lg shadow mb-6"
          style={{ backgroundColor: theme.cardBackground }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold mb-4">Price bCASH vs Staked CASH</h2>
            <div className="flex space-x-2">
              <button onClick={() => setTimeRange("day")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "day" ? theme.primary : theme.cardBackground, color: timeRange === "day" ? theme.background : theme.text }}>24h</button>
              <button onClick={() => setTimeRange("week")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "week" ? theme.primary : theme.cardBackground, color: timeRange === "week" ? theme.background : theme.text }}>7d</button>
              <button onClick={() => setTimeRange("month")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "month" ? theme.primary : theme.cardBackground, color: timeRange === "month" ? theme.background : theme.text }}>30d</button>
              <button onClick={() => setTimeRange("all")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "all" ? theme.primary : theme.cardBackground, color: timeRange === "all" ? theme.background : theme.text }}>All</button>
              <button
                onClick={() => fetchData(true)}
                className="px-3 py-1 rounded hover:opacity-90"
                style={{
                  backgroundColor: loading ? "#333333" : theme.primary,
                  color: loading ? theme.textSecondary : theme.background,
                }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tvlData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="price"
                  orientation="left"
                  domain={[
                    (dataMin: any) => dataMin - 0.002,
                    (dataMax: any) => dataMax + 0.002,
                  ]}
                  tickFormatter={(value) =>
                    parseFloat(value.toString()).toFixed(4)
                  }
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="staked"
                  orientation="right"
                  domain={[1, 1.1]}
                  // tickFormatter={(value) => formatCurrency(value)}
                  tickFormatter={(value) => value.toFixed(4)} // just a number
                  stroke={theme.textSecondary}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "pricebCash") {
                      return [
                        formatTooltipBeautified(value as number),
                        "Price bCash",
                      ];
                    } else {
                      return [
                        formatTooltipBeautified(value as number),
                        "Staked CASH",
                      ];
                    }
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  contentStyle={{
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.textSecondary,
                    color: theme.text,
                  }}
                />
                <Legend wrapperStyle={{ color: theme.textSecondary }} />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="pricebCash"
                  name="Price bCASH"
                  stroke={theme.chart.price}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="staked"
                  type="monotone"
                  dataKey="stakedCASH"
                  name="Staked CASH"
                  stroke={theme.chart.tvl}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Flow View - pricestSUPRA vs stakedSUPRA */}
      {activeView === "flow" && (
        <div
          className="p-4 rounded-lg shadow mb-6"
          style={{ backgroundColor: theme.cardBackground }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold mb-4">
              Price stSUPRA vs Staked SUPRA
            </h2>
            <div className="flex space-x-2">
              <button onClick={() => setTimeRange("day")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "day" ? theme.primary : theme.cardBackground, color: timeRange === "day" ? theme.background : theme.text }}>24h</button>
              <button onClick={() => setTimeRange("week")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "week" ? theme.primary : theme.cardBackground, color: timeRange === "week" ? theme.background : theme.text }}>7d</button>
              <button onClick={() => setTimeRange("month")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "month" ? theme.primary : theme.cardBackground, color: timeRange === "month" ? theme.background : theme.text }}>30d</button>
              <button onClick={() => setTimeRange("all")} className="px-3 py-1 rounded border border-[#AAAAAA]" style={{ backgroundColor: timeRange === "all" ? theme.primary : theme.cardBackground, color: timeRange === "all" ? theme.background : theme.text }}>All</button>
              <button
                onClick={() => fetchData(true)}
                className="px-3 py-1 rounded hover:opacity-90"
                style={{
                  backgroundColor: loading ? "#333333" : theme.primary,
                  color: loading ? theme.textSecondary : theme.background,
                }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tvlData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="price"
                  orientation="left"
                  domain={[
                    (dataMin: any) => dataMin - 0.002,
                    (dataMax: any) => dataMax + 0.002,
                  ]}
                  tickFormatter={(value) =>
                    parseFloat(value.toString()).toFixed(4)
                  }
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="staked"
                  orientation="right"
                  domain={[1, 1.1]}
                  // tickFormatter={(value) => formatCurrency(value)}
                  tickFormatter={(value) => value.toFixed(4)} // just a number
                  stroke={theme.textSecondary}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "pricestSUPRA") {
                      return [
                        formatTooltipBeautified(value as number),
                        "Price stSUPRA",
                      ];
                    } else {
                      return [
                        formatTooltipBeautified(value as number),
                        "Staked SUPRA",
                      ];
                    }
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  contentStyle={{
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.textSecondary,
                    color: theme.text,
                  }}
                />
                <Legend wrapperStyle={{ color: theme.textSecondary }} />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="pricestSUPRA"
                  name="Price stSUPRA"
                  stroke={theme.chart.price}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="staked"
                  type="monotone"
                  dataKey="stakedSUPRA"
                  name="Staked SUPRA"
                  stroke={theme.chart.tvl}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cash View: Price and TCR Chart */}
      {activeView === "cash" && (
        <div
          className="p-4 rounded-lg shadow mb-6"
          style={{ backgroundColor: theme.cardBackground }}
        >
          <h2 className="text-lg font-bold mb-4">Price and TCR</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTcrData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="price"
                  orientation="left"
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => formatPrice(value)}
                  stroke={theme.textSecondary}
                />
                <YAxis
                  yAxisId="tcr"
                  orientation="right"
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => formatRatio(value)}
                  stroke={theme.textSecondary}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "Price") {
                      return [
                        formatTooltipBeautified(value as number),
                        "Price",
                      ];
                    } else {
                      return [formatTooltipBeautified(value as number), "TCR"];
                    }
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  contentStyle={{
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.textSecondary,
                    color: theme.text,
                  }}
                />
                <Legend wrapperStyle={{ color: theme.textSecondary }} />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  name="Price"
                  stroke={theme.chart.price}
                  dot={{ r: 3 }}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="tcr"
                  type="monotone"
                  dataKey="tcr"
                  name="TCR"
                  stroke={theme.chart.tcr}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cash View: Position Stats */}
      {activeView === "cash" && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <h2 className="text-lg font-bold mb-4">Position Timeline</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={positionsData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                    stroke={theme.textSecondary}
                  />
                  <YAxis stroke={theme.textSecondary} />
                  <Tooltip
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                    contentStyle={{
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.textSecondary,
                      color: theme.text,
                    }}
                  />
                  <Legend wrapperStyle={{ color: theme.textSecondary }} />
                  <Area
                    type="monotone"
                    dataKey="activePositions"
                    name="Active"
                    stackId="1"
                    stroke={theme.positions.activePositions}
                    fill={theme.positions.activePositions}
                    fillOpacity={0.8}
                  />
                  <Area
                    type="monotone"
                    dataKey="closedPositions"
                    name="Closed"
                    stackId="1"
                    stroke={theme.positions.closedPositions}
                    fill={theme.positions.closedPositions}
                    fillOpacity={0.8}
                  />
                  <Area
                    type="monotone"
                    dataKey="redeemedPositions"
                    name="Redeemed"
                    stackId="1"
                    stroke={theme.positions.redeemedPositions}
                    fill={theme.positions.redeemedPositions}
                    fillOpacity={0.8}
                  />
                  <Area
                    type="monotone"
                    dataKey="liquidatedPositions"
                    name="Liquidated"
                    stackId="1"
                    stroke={theme.positions.liquidatedPositions}
                    fill={theme.positions.liquidatedPositions}
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="p-4 rounded-lg shadow"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <h2 className="text-lg font-bold mb-4">Position Types</h2>
            <div className="h-64 flex items-center justify-center">
              {positionsPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={positionsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {positionsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        formatTooltipBeautified(value as number),
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.textSecondary,
                        color: theme.text,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="text-center"
                  style={{ color: theme.textSecondary }}
                >
                  No position data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cash View: User Stats */}
      {activeView === "cash" && (
        <div
          className="p-4 rounded-lg shadow"
          style={{ backgroundColor: theme.cardBackground }}
        >
          <h2 className="text-lg font-bold mb-4">User Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  stroke={theme.textSecondary}
                />
                <YAxis stroke={theme.textSecondary} />
                <Tooltip
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  }
                  contentStyle={{
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.textSecondary,
                    color: theme.text,
                  }}
                />
                <Legend wrapperStyle={{ color: theme.textSecondary }} />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  name="Total Users"
                  stroke={theme.chart.tvl}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  name="New Users"
                  stroke={theme.chart.price}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Footer with data source status */}
      <div
        className="mt-6 text-center text-sm"
        style={{ color: theme.textSecondary }}
      >
        <p>
          Data source: Live API {error ? "(Error occurred)" : ""}
          <br />
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Never"}
        </p>
      </div>
    </div>
  );
};

export default SolidoDashboard;