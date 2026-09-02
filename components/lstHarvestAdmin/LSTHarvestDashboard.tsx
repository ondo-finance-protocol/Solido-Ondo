"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutGrid,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Types (keep the same as before)
interface ValidatorOperation {
  validatorAddress: string;
  validatorIndex: number;
  stakeAmount?: number;
  unstakeAmount?: number;
  percentage: number;
  previousStake: number;
  newStake: number;
}

interface HarvestDetails {
  case: "deposit_exceeds" | "withdraw_exceeds" | "equal_amounts";
  txHash: string;
  stakeAmount: number;
  transferAmount: number;
  stakingValidators: number;
  unstakingValidators: number;
  stakingOperations?: ValidatorOperation[];
  unstakingOperations?: ValidatorOperation[];
}

interface SettlementAnalysis {
  totalDeposits: number;
  totalWithdrawals: number;
  netDifference: number;
  direction: "deposit_excess" | "withdraw_excess";
  depositCount: number;
  withdrawCount: number;
  walletsProcessed: number;
}

interface Validator {
  address: string;
  validatorIndex: number;
  activeStake: number;
  inactiveStake: number;
  pendingInactiveStake: number;
}

interface ValidatorsData {
  totalValidators: number;
  totalWithdrawable: number;
  validators: Validator[];
}

interface LogEntry {
  runId: string;
  startTime: string;
  endTime: string;
  duration: number;
  settlementAnalysis: SettlementAnalysis;
  validators: ValidatorsData;
  harvestDetails: HarvestDetails;
}

interface LatestStatus {
  runId: string;
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  txHash: string | null;
  error: string | null;
}

interface ApiResponse {
  success: boolean;
  timestamp: string;
  data: {
    latestStatus: LatestStatus;
    successfulLogs: LogEntry[];
    summary: {
      totalSuccessfulRuns: number;
      latestRunSuccess: boolean;
      hasError: boolean;
    };
  };
}

const LSTHarvestDashboard: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);

      // Try to fetch from actual API, fallback to mock data
      try {
        const response = await fetch(
          "https://api.solido.money/admin/lstharvest"
        );
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          throw new Error("API not available");
        }
      } catch (apiError) {
        // Using provided mock data structure from the document
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockData: ApiResponse = {
          success: true,
          timestamp: "2025-09-02T08:39:20.391Z",
          data: {
            latestStatus: {
              runId: "1efb5b05-4026-485a-a242-06807357cd2b",
              success: false,
              startTime: "2025-09-02T08:00:00.599Z",
              endTime: "2025-09-02T08:00:01.075Z",
              duration: 476,
              txHash: null,
              error: null,
            },
            successfulLogs: [
              {
                runId: "00532ab3-0589-4916-9247-5ac2bc155ca7",
                startTime: "2025-09-02T18:00:00.551Z",
                endTime: "2025-09-02T18:00:17.408Z",
                duration: 16857,
                settlementAnalysis: {
                  totalDeposits: 10757.97068625,
                  totalWithdrawals: 2640.21828662,
                  netDifference: 8117.75239963,
                  direction: "deposit_excess",
                  depositCount: 7,
                  withdrawCount: 3,
                  walletsProcessed: 8,
                },
                validators: {
                  totalValidators: 5,
                  totalWithdrawable: 0,
                  validators: [
                    {
                      address:
                        "0x28f9532c88f02172e83fcafe8a79e363a3dd3979f571eba5461dce0194a3a7de",
                      validatorIndex: 0,
                      activeStake: 87580700.0621788,
                      inactiveStake: 0,
                      pendingInactiveStake: 64980.19921033,
                    },
                    {
                      address:
                        "0x1f5d7f0aeb2bcb7892a250a794be3b6dd4e203dc809e59ee662ff27e16949e34",
                      validatorIndex: 1,
                      activeStake: 1135731.04054835,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                    {
                      address:
                        "0x77a10ff24eac81c88dbaa79e63367c45fddae4a20fd1ccf3c790bf2dc0df2de4",
                      validatorIndex: 2,
                      activeStake: 1135731.03002382,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                    {
                      address:
                        "0x2a53a90f8d71ce21baf94ac1f15c736024a249f88c32436b81e5a1dd23d7a41f",
                      validatorIndex: 3,
                      activeStake: 45593394.5059452,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                    {
                      address:
                        "0x974d3b77ec3633932491fd4bc40297258ecc72d2571e64fdd078e98f59670618",
                      validatorIndex: 4,
                      activeStake: 45389967.2629274,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                  ],
                },
                harvestDetails: {
                  case: "deposit_exceeds",
                  txHash:
                    "0x8b5489c0f6d9912bc4cf70492f21d8e7875888c9614e0f0919b6d656b7d92194",
                  stakeAmount: 8117.75239963,
                  transferAmount: 2640.21828662,
                  stakingValidators: 2,
                  unstakingValidators: 0,
                  stakingOperations: [
                    {
                      validatorAddress:
                        "0x28f9532c88f02172e83fcafe8a79e363a3dd3979f571eba5461dce0194a3a7de",
                      validatorIndex: 0,
                      stakeAmount: 2435.32571988,
                      percentage: 30,
                      previousStake: 87580700.0621788,
                      newStake: 87583135.3878987,
                    },
                    {
                      validatorAddress:
                        "0x2a53a90f8d71ce21baf94ac1f15c736024a249f88c32436b81e5a1dd23d7a41f",
                      validatorIndex: 3,
                      stakeAmount: 5682.42667974,
                      percentage: 70,
                      previousStake: 45593394.5059452,
                      newStake: 45599076.9326249,
                    },
                  ],
                },
              },
              {
                runId: "cdee96db-4b56-4ab3-a743-b689760e5a79",
                startTime: "2025-09-02T16:00:00.437Z",
                endTime: "2025-09-02T16:00:17.473Z",
                duration: 17036,
                settlementAnalysis: {
                  totalDeposits: 72612.39664931,
                  totalWithdrawals: 0,
                  netDifference: 72612.39664931,
                  direction: "deposit_excess",
                  depositCount: 8,
                  withdrawCount: 0,
                  walletsProcessed: 8,
                },
                validators: {
                  totalValidators: 5,
                  totalWithdrawable: 0,
                  validators: [
                    {
                      address:
                        "0x28f9532c88f02172e83fcafe8a79e363a3dd3979f571eba5461dce0194a3a7de",
                      validatorIndex: 0,
                      activeStake: 87557317.7424103,
                      inactiveStake: 0,
                      pendingInactiveStake: 64979.0128389,
                    },
                    {
                      address:
                        "0x1f5d7f0aeb2bcb7892a250a794be3b6dd4e203dc809e59ee662ff27e16949e34",
                      validatorIndex: 1,
                      activeStake: 1135710.30501854,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                    {
                      address:
                        "0x77a10ff24eac81c88dbaa79e63367c45fddae4a20fd1ccf3c790bf2dc0df2de4",
                      validatorIndex: 2,
                      activeStake: 1135710.2944942,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                    {
                      address:
                        "0x2a53a90f8d71ce21baf94ac1f15c736024a249f88c32436b81e5a1dd23d7a41f",
                      validatorIndex: 3,
                      activeStake: 45541734.3380894,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                    {
                      address:
                        "0x974d3b77ec3633932491fd4bc40297258ecc72d2571e64fdd078e98f59670618",
                      validatorIndex: 4,
                      activeStake: 45389967.2629274,
                      inactiveStake: 0,
                      pendingInactiveStake: 0,
                    },
                  ],
                },
                harvestDetails: {
                  case: "deposit_exceeds",
                  txHash:
                    "0xf9fd445b78f7a2ae2ecee28bae957c9de6cb83fb0e62163f3cdd6229177f74f5",
                  stakeAmount: 72612.39664931,
                  transferAmount: 0,
                  stakingValidators: 2,
                  unstakingValidators: 0,
                  stakingOperations: [
                    {
                      validatorAddress:
                        "0x28f9532c88f02172e83fcafe8a79e363a3dd3979f571eba5461dce0194a3a7de",
                      validatorIndex: 0,
                      stakeAmount: 21783.71899479,
                      percentage: 30,
                      previousStake: 87557317.7424103,
                      newStake: 87579101.4614051,
                    },
                    {
                      validatorAddress:
                        "0x2a53a90f8d71ce21baf94ac1f15c736024a249f88c32436b81e5a1dd23d7a41f",
                      validatorIndex: 3,
                      stakeAmount: 50828.67765451,
                      percentage: 70,
                      previousStake: 45541734.3380894,
                      newStake: 45592563.0157439,
                    },
                  ],
                },
              },
            ],
            summary: {
              totalSuccessfulRuns: 10,
              latestRunSuccess: false,
              hasError: false,
            },
          },
        };

        setData(mockData);
      }

      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch harvest data"
      );
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchData, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Helper functions
  const formatNumber = (num: number, decimals: number = 2): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getExplorerUrl = (txHash: string): string => {
    return `https://suprascan.io/tx/${txHash}`;
  };

  const toggleRunExpansion = (runId: string) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
  };

  // Chart data preparation
  const prepareChartData = (logs: LogEntry[]) => {
    return logs.slice(-13).map((log, index) => ({
      run: `Run ${index + 1}`,
      deposits: log.settlementAnalysis.totalDeposits,
      withdrawals: log.settlementAnalysis.totalWithdrawals,
      netDifference: log.settlementAnalysis.netDifference,
      timestamp: new Date(log.startTime).toLocaleTimeString(),
    }));
  };

  const prepareCaseDistribution = (logs: LogEntry[]) => {
    const caseCount = logs.reduce((acc, log) => {
      const caseType = log.harvestDetails.case;
      acc[caseType] = (acc[caseType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(caseCount).map(([key, value]) => ({
      name: key.replace("_", " "),
      value,
      color:
        key === "deposit_exceeds"
          ? "#0d9488" // Teal
          : key === "withdraw_exceeds"
          ? "#ef4444"
          : "#6366f1",
    }));
  };

  // Add these helper functions near the other helper functions in the component

  const calculateAPYForValidator = (validatorIndex: number) => {
    if (successfulLogs.length < 2) return 0;

    let validIntervals = 0;
    let returnInterest = 0;
    for (let i = 0; i < successfulLogs.length - 1; i++) {
      const currentLog = successfulLogs[i];
      const nextLog = successfulLogs[i + 1];

      // Find the validator in both logs
      const currentValidator = currentLog.validators.validators.find(
        (v) => v.validatorIndex === validatorIndex
      );
      const nextValidator = nextLog.validators.validators.find(
        (v) => v.validatorIndex === validatorIndex
      );

      if (!currentValidator || !nextValidator) {
        continue;
      }

      let returnAmount = 0;
      let baseAmount = 0;
      let calculationMethod = "";

      // Case 1: Both logs are deposit_exceeds
      if (
        currentLog.harvestDetails.case === "deposit_exceeds" &&
        nextLog.harvestDetails.case === "deposit_exceeds"
      ) {
        // Check if there's a staking operation for this validator in the next log
        const stakingOp = nextLog.harvestDetails.stakingOperations?.find(
          (op) => op.validatorIndex === validatorIndex
        );

        if (stakingOp) {
          // Case 1: Use newStake from staking operation
          returnAmount = currentValidator.activeStake - stakingOp.newStake;
          baseAmount = stakingOp.newStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 1: deposit_exceeds → deposit_exceeds (with staking operation)";
        } else {
          // Validator not involved in staking operations
          returnAmount =
            currentValidator.activeStake - nextValidator.activeStake;
          baseAmount = nextValidator.activeStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 1: deposit_exceeds → deposit_exceeds (no staking operation)";
        }
      }
      // Case 2: Current is deposit_exceeds, next is withdraw_exceeds
      else if (
        currentLog.harvestDetails.case === "deposit_exceeds" &&
        nextLog.harvestDetails.case === "withdraw_exceeds"
      ) {
        // Check if there's an unstaking operation for this validator in the next log
        const unstakingOp = nextLog.harvestDetails.unstakingOperations?.find(
          (op) => op.validatorIndex === validatorIndex
        );

        if (unstakingOp) {
          // Case 2A: Validator involved in unstaking
          returnAmount = currentValidator.activeStake - unstakingOp.newStake;
          baseAmount = unstakingOp.newStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 2A: deposit_exceeds → withdraw_exceeds (with unstaking operation)";
        } else {
          // Case 2B: Validator not involved in unstaking
          returnAmount =
            currentValidator.activeStake - nextValidator.activeStake;
          baseAmount = nextValidator.activeStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 2B: deposit_exceeds → withdraw_exceeds (no unstaking operation)";
        }
      }
      // Case 3: Current is withdraw_exceeds, next is deposit_exceeds
      else if (
        currentLog.harvestDetails.case === "withdraw_exceeds" &&
        nextLog.harvestDetails.case === "deposit_exceeds"
      ) {
        // Check if there's a staking operation for this validator in the next log
        const stakingOp = nextLog.harvestDetails.stakingOperations?.find(
          (op) => op.validatorIndex === validatorIndex
        );

        if (stakingOp) {
          // Case 3A: Validator involved in staking
          returnAmount = currentValidator.activeStake - stakingOp.newStake;
          baseAmount = stakingOp.newStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 3A: withdraw_exceeds → deposit_exceeds (with staking operation)";
        } else {
          // Case 3B: Validator not involved in staking
          returnAmount =
            currentValidator.activeStake - nextValidator.activeStake;
          baseAmount = nextValidator.activeStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 3B: withdraw_exceeds → deposit_exceeds (no staking operation)";
        }
      } else if (
        currentLog.harvestDetails.case === "withdraw_exceeds" &&
        nextLog.harvestDetails.case === "withdraw_exceeds"
      ) {
        // Check if there's a staking operation for this validator in the next log
        const unstakingOp = nextLog.harvestDetails.unstakingOperations?.find(
          (op) => op.validatorIndex === validatorIndex
        );

        if (unstakingOp) {
          // Case 4A: Validator involved in unstaking
          returnAmount = currentValidator.activeStake - unstakingOp.newStake;
          baseAmount = unstakingOp.newStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 4A: deposit_exceeds → withdraw_exceeds (with unstaking operation)";
        } else {
          // Case 4B: Validator not involved in unstaking
          returnAmount =
            currentValidator.activeStake - nextValidator.activeStake;
          baseAmount = nextValidator.activeStake;
          returnInterest += returnAmount / baseAmount;
          calculationMethod =
            "Case 4B: withdraw_exceeds → withdraw_exceeds (no staking operation)";
        }
      } else {
        returnAmount = currentValidator.activeStake - nextValidator.activeStake;
        baseAmount = nextValidator.activeStake;
        returnInterest += returnAmount / baseAmount;
        calculationMethod = `Fallback: ${currentLog.harvestDetails.case} → ${nextLog.harvestDetails.case}`;
      }

      // Calculate APY only if we have valid amounts
      if (baseAmount > 0 && returnAmount !== 0) {
        validIntervals++;
      } else {
        console.log(
          `Pair [${i},${
            i + 1
          }]: Invalid calculation (baseAmount: ${baseAmount}, returnAmount: ${returnAmount})`
        );
      }
    }

    const startTime = new Date(successfulLogs[0].startTime);
    const endTime = new Date(
      successfulLogs[successfulLogs.length - 1].startTime
    );

    const startHour = startTime.getUTCHours();
    const endHour = endTime.getUTCHours();

    // Calculate time difference
    const timeDiffMs = startTime.getTime() - endTime.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    // Also show the exact seconds difference
    const timeDiffSeconds = timeDiffMs / 1000;

    const averageAPY =
      validIntervals > 0
        ? ((returnInterest * 365 * 24) / timeDiffHours) * 100
        : 0;

    return averageAPY;
  };

  const calculateTotalAPY = () => {
    if (successfulLogs.length < 2 || !latestSuccessfulRun) return 0;

    // Get the latest validator data for allocations
    const validators = latestSuccessfulRun.validators.validators;

    // Calculate total active stake for allocation percentages
    const totalActiveStake = validators.reduce(
      (sum, v) => sum + v.activeStake,
      0
    );

    let totalWeightedAPY = 0;

    // Calculate weighted APY: APY × Allocation for each validator
    validators.forEach((validator) => {
      const apy = calculateAPYForValidator(validator.validatorIndex);
      const allocation = (validator.activeStake / totalActiveStake) * 100;
      const weightedAPY = apy * allocation;

      totalWeightedAPY += weightedAPY;

    });

    // Final Total APY = Sum of weighted APYs / 100
    const finalAPY = totalWeightedAPY / 100;
    return finalAPY;
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-gray-800 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-800 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
          <div className="h-64 bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-400 mb-4">
            {error || "Failed to load harvest data"}
          </p>
          <button
            onClick={fetchData}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { latestStatus, successfulLogs, summary } = data.data;
  const latestSuccessfulRun =
    successfulLogs.length > 0 ? successfulLogs[0] : null;

  // Determine the actual system status
  const isFullySettled =
    !latestStatus.success &&
    latestStatus.txHash === null &&
    latestStatus.error === null;
  const hasError = !latestStatus.success && latestStatus.error !== null;
  const isHealthy = latestStatus.success;

  const chartData = prepareChartData(successfulLogs);
  const caseDistribution = prepareCaseDistribution(successfulLogs);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-teal-600" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  LST Harvest Operations
                </h1>
                <p className="text-sm text-gray-400">
                  Flow Settlement on Supra Blockchain
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Auto-refresh</span>
              </label>
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Health Status */}
          <div
            className={`bg-gray-900 rounded-lg shadow-sm p-6 border-l-4 ${
              isHealthy
                ? "border-teal-500"
                : isFullySettled
                ? "border-blue-500"
                : "border-red-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  System Status
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {isHealthy ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-teal-500" />
                      <span className="text-lg font-semibold text-teal-400">
                        Healthy
                      </span>
                    </>
                  ) : isFullySettled ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-lg font-semibold text-blue-400">
                        Fully Settled
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-lg font-semibold text-red-400">
                        Error
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div
                className={`p-3 rounded-full ${
                  isHealthy
                    ? "bg-teal-900 bg-opacity-20"
                    : isFullySettled
                    ? "bg-blue-900 bg-opacity-20"
                    : "bg-red-900 bg-opacity-20"
                }`}
              >
                <Activity
                  className={`h-6 w-6 ${
                    isHealthy
                      ? "text-teal-600"
                      : isFullySettled
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Latest Run Duration */}
          <div className="bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Last Run Duration
                </p>
                <p className="text-2xl font-bold text-white">
                  {(latestStatus.duration / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-gray-400">
                  {latestStatus.duration > 15000
                    ? "Slow"
                    : latestStatus.duration > 10000
                    ? "Normal"
                    : "Fast"}
                </p>
              </div>
              <div className="bg-teal-900 bg-opacity-20 p-3 rounded-full">
                <Clock className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Total Successful Runs */}
          <div className="bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Successful Runs
                </p>
                <p className="text-2xl font-bold text-white">
                  {summary.totalSuccessfulRuns}
                </p>
                <p className="text-xs text-gray-400">Total completed</p>
              </div>
              <div className="bg-teal-900 bg-opacity-20 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Last Execution */}
          <div className="bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Last Execution
                </p>
                <p className="text-lg font-semibold text-white">
                  {getTimeAgo(latestStatus.endTime)}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(latestStatus.endTime).toLocaleString()}
                </p>
              </div>
              <div className="bg-teal-900 bg-opacity-20 p-3 rounded-full">
                <Eye className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert - only show for actual errors */}
        {hasError && (
          <div className="bg-red-900 bg-opacity-20 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">
                  System Alert
                </h3>
                <p className="text-sm text-red-400 mt-1">
                  The latest harvest operation encountered an error:{" "}
                  {latestStatus.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Summary */}
          <div className="lg:col-span-2 bg-gray-900 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Settlement Analytics
            </h3>

            {latestSuccessfulRun && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg border border-teal-800">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-teal-600" />
                      <span className="text-sm font-medium text-teal-300">
                        Total Deposits
                      </span>
                    </div>
                    <p className="text-xl font-bold text-teal-100 mt-1">
                      {formatNumber(
                        latestSuccessfulRun.settlementAnalysis.totalDeposits
                      )}{" "}
                      SUPRA
                    </p>
                    <p className="text-xs text-teal-400">
                      {latestSuccessfulRun.settlementAnalysis.depositCount}{" "}
                      transactions
                    </p>
                  </div>

                  <div className="bg-red-900 bg-opacity-20 p-4 rounded-lg border border-red-800">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-300">
                        Total Withdrawals
                      </span>
                    </div>
                    <p className="text-xl font-bold text-red-100 mt-1">
                      {formatNumber(
                        latestSuccessfulRun.settlementAnalysis.totalWithdrawals
                      )}{" "}
                      stSUPRA
                    </p>
                    <p className="text-xs text-red-400">
                      {latestSuccessfulRun.settlementAnalysis.withdrawCount}{" "}
                      transactions
                    </p>
                  </div>

                  <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg border border-teal-800">
                    <div className="flex items-center space-x-2">
                      <LayoutGrid className="h-5 w-5 text-teal-600" />
                      <span className="text-sm font-medium text-teal-300">
                        Net Difference
                      </span>
                    </div>
                    <p className="text-xl font-bold text-teal-100 mt-1">
                      {latestSuccessfulRun.settlementAnalysis.direction ===
                      "deposit_excess"
                        ? "+"
                        : "-"}
                      {formatNumber(
                        Math.abs(
                          latestSuccessfulRun.settlementAnalysis.netDifference
                        )
                      )}
                    </p>
                    <p className="text-xs text-teal-400">
                      {latestSuccessfulRun.settlementAnalysis.walletsProcessed}{" "}
                      wallets processed
                    </p>
                  </div>
                </div>

                {/* Trend Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="run" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "0.5rem",
                          color: "#f3f4f6",
                        }}
                        formatter={(value: number, name: string) => [
                          formatNumber(value),
                          name === "deposits"
                            ? "Deposits (SUPRA)"
                            : name === "withdrawals"
                            ? "Withdrawals (stSUPRA)"
                            : "Net Difference",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="deposits"
                        stroke="#0d9488"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="withdrawals"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="netDifference"
                        stroke="#6366f1"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Case Distribution */}
          <div className="bg-gray-900 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Harvest Cases
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {caseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "0.5rem",
                      color: "#f3f4f6",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {caseDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-300 capitalize">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Hash */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Latest Transaction
          </h3>
          {isFullySettled ? (
            <div className="flex items-center justify-center p-8 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-800">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-blue-300 mb-2">
                  System Fully Settled
                </h4>
                <p className="text-sm text-blue-400">
                  No transaction needed - all pending deposits and withdrawals
                  have been processed
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-300">
                  Transaction Hash:
                </span>
                <code className="text-sm bg-gray-700 px-2 py-1 rounded border border-gray-600 text-gray-100">
                  {latestStatus.txHash
                    ? formatAddress(latestStatus.txHash)
                    : "N/A"}
                </code>
              </div>
              {latestStatus.error !== null && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-300">
                    Latest Harvest Error:
                  </span>
                  <code className="text-sm bg-gray-700 px-2 py-1 rounded border border-gray-600 text-gray-100">
                    {latestStatus.error}
                  </code>
                </div>
              )}
              {latestStatus.txHash && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(latestStatus.txHash!)}
                    className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                    title="Copy full hash"
                  >
                    {copiedAddress === latestStatus.txHash ? (
                      <CheckCircle className="h-4 w-4 text-teal-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(latestStatus.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Validator Overview */}
        {latestSuccessfulRun && (
          <div className="bg-gray-900 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Validator Overview
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg border border-teal-800">
                <p className="text-sm font-medium text-teal-300">Total APY</p>
                <p className="text-2xl font-bold text-teal-100">
                  {formatNumber(calculateTotalAPY(), 2)}%
                </p>
              </div>

              <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg border border-teal-800">
                <p className="text-sm font-medium text-teal-300">
                  Total Validators
                </p>
                <p className="text-2xl font-bold text-teal-100">
                  {latestSuccessfulRun.validators.totalValidators}
                </p>
              </div>
              <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg border border-teal-800">
                <p className="text-sm font-medium text-teal-300">
                  Total Active Stake
                </p>
                <p className="text-2xl font-bold text-teal-100">
                  {formatNumber(
                    latestSuccessfulRun.validators.validators.reduce(
                      (sum, v) => sum + v.activeStake,
                      0
                    )
                  )}{" "}
                  SUPRA
                </p>
              </div>
              <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg border border-teal-800">
                <p className="text-sm font-medium text-teal-300">
                  Total Withdrawable
                </p>
                <p className="text-2xl font-bold text-teal-100">
                  {formatNumber(
                    latestSuccessfulRun.validators.totalWithdrawable
                  )}{" "}
                  SUPRA
                </p>
              </div>
            </div>

            {/* Validator Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Validator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Active Stake
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Inactive Stake
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Pending Inactive
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      APY
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Allocation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {latestSuccessfulRun.validators.validators.map(
                    (validator, index) => {
                      const totalStake =
                        validator.activeStake +
                        validator.inactiveStake +
                        validator.pendingInactiveStake;
                      const utilization =
                        totalStake > 0
                          ? (validator.activeStake / totalStake) * 100
                          : 0;

                      return (
                        <tr
                          key={validator.address}
                          className="hover:bg-gray-800"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-gray-700 px-2 py-1 rounded text-gray-200">
                                {formatAddress(validator.address)}
                              </code>
                              <button
                                onClick={() =>
                                  copyToClipboard(validator.address)
                                }
                                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Copy address"
                              >
                                {copiedAddress === validator.address ? (
                                  <CheckCircle className="h-3 w-3 text-teal-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Index: {validator.validatorIndex}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-100">
                              {formatNumber(validator.activeStake)}
                            </span>
                            <p className="text-xs text-gray-400">SUPRA</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-100">
                              {formatNumber(validator.inactiveStake)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-100">
                              {formatNumber(validator.pendingInactiveStake)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-100">
                              {formatNumber(
                                calculateAPYForValidator(
                                  validator.validatorIndex
                                ),
                                2
                              )}
                              %
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="ml-2 text-sm text-gray-300">
                                {(
                                  (validator.activeStake /
                                    latestSuccessfulRun.validators.validators.reduce(
                                      (sum, v) => sum + v.activeStake,
                                      0
                                    )) *
                                  100
                                ).toFixed(2)}
                                %
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="ml-2 text-sm text-gray-300">
                                {utilization.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Historical Logs */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Historical Harvest Logs
          </h3>
          <div className="space-y-4">
            {successfulLogs.map((log) => (
              <div
                key={log.runId}
                className="border border-gray-700 rounded-lg"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => toggleRunExpansion(log.runId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-teal-500" />
                        <span className="font-medium text-white">
                          Run {log.runId.slice(0, 8)}...
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(log.startTime).toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-400">
                        {(log.duration / 1000).toFixed(1)}s
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.harvestDetails.case === "deposit_exceeds"
                            ? "bg-teal-900 bg-opacity-20 text-teal-300"
                            : log.harvestDetails.case === "withdraw_exceeds"
                            ? "bg-red-900 bg-opacity-20 text-red-300"
                            : "bg-blue-900 bg-opacity-20 text-blue-300"
                        }`}
                      >
                        {log.harvestDetails.case.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">
                        Net:{" "}
                        {log.settlementAnalysis.direction === "deposit_excess"
                          ? "+"
                          : "-"}
                        {formatNumber(
                          Math.abs(log.settlementAnalysis.netDifference)
                        )}
                      </span>
                      {expandedRuns.has(log.runId) ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedRuns.has(log.runId) && (
                  <div className="border-t border-gray-700 p-4 bg-gray-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Settlement Details */}
                      <div>
                        <h4 className="font-medium text-white mb-3">
                          Settlement Analysis
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Total Deposits:
                            </span>
                            <span className="font-medium text-teal-400">
                              {formatNumber(
                                log.settlementAnalysis.totalDeposits
                              )}{" "}
                              SUPRA
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Total Withdrawals:
                            </span>
                            <span className="font-medium text-red-400">
                              {formatNumber(
                                log.settlementAnalysis.totalWithdrawals
                              )}{" "}
                              stSUPRA
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Deposit Count:
                            </span>
                            <span className="font-medium text-white">
                              {log.settlementAnalysis.depositCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Withdraw Count:
                            </span>
                            <span className="font-medium text-white">
                              {log.settlementAnalysis.withdrawCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Wallets Processed:
                            </span>
                            <span className="font-medium text-white">
                              {log.settlementAnalysis.walletsProcessed}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Harvest Details */}
                      <div>
                        <h4 className="font-medium text-white mb-3">
                          Harvest Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Case Type:</span>
                            <span className="font-medium text-white capitalize">
                              {log.harvestDetails.case.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Stake Amount:</span>
                            <span className="font-medium text-teal-400">
                              {formatNumber(log.harvestDetails.stakeAmount)}{" "}
                              SUPRA
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Transfer Amount:
                            </span>
                            <span className="font-medium text-purple-400">
                              {formatNumber(log.harvestDetails.transferAmount)}{" "}
                              SUPRA
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Staking Validators:
                            </span>
                            <span className="font-medium text-white">
                              {log.harvestDetails.stakingValidators}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">
                              Unstaking Validators:
                            </span>
                            <span className="font-medium text-white">
                              {log.harvestDetails.unstakingValidators}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Transaction:</span>
                            <div className="flex items-center space-x-1">
                              <code className="text-xs bg-gray-800 px-1 py-0.5 rounded text-gray-200">
                                {formatAddress(log.harvestDetails.txHash)}
                              </code>
                              <button
                                onClick={() =>
                                  copyToClipboard(log.harvestDetails.txHash)
                                }
                                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                {copiedAddress === log.harvestDetails.txHash ? (
                                  <CheckCircle className="h-3 w-3 text-teal-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <a
                                href={getExplorerUrl(log.harvestDetails.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operations Tables */}
                    {log.harvestDetails.stakingOperations &&
                      log.harvestDetails.stakingOperations.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium text-white mb-3">
                            Staking Operations
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead className="bg-gray-800">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Validator
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Amount
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Allocation
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Stake Change
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {log.harvestDetails.stakingOperations.map(
                                  (op, idx) => (
                                    <tr key={idx} className="text-sm">
                                      <td className="px-4 py-2">
                                        <code className="text-xs bg-gray-700 px-1 py-0.5 rounded text-gray-200">
                                          {formatAddress(op.validatorAddress)}
                                        </code>
                                      </td>
                                      <td className="px-4 py-2 text-teal-400 font-medium">
                                        +{formatNumber(op.stakeAmount!)}
                                      </td>
                                      <td className="px-4 py-2 text-gray-300">
                                        {op.percentage}%
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="text-xs">
                                          <span className="text-gray-400">
                                            {formatNumber(op.previousStake)}
                                          </span>
                                          <span className="mx-1">→</span>
                                          <span className="font-medium text-white">
                                            {formatNumber(op.newStake)}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    {log.harvestDetails.unstakingOperations &&
                      log.harvestDetails.unstakingOperations.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium text-white mb-3">
                            Unstaking Operations
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead className="bg-gray-800">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Validator
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Amount
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Allocation
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                    Stake Change
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {log.harvestDetails.unstakingOperations.map(
                                  (op, idx) => (
                                    <tr key={idx} className="text-sm">
                                      <td className="px-4 py-2">
                                        <code className="text-xs bg-gray-700 px-1 py-0.5 rounded text-gray-200">
                                          {formatAddress(op.validatorAddress)}
                                        </code>
                                      </td>
                                      <td className="px-4 py-2 text-red-400 font-medium">
                                        -{formatNumber(op.unstakeAmount!)}
                                      </td>
                                      <td className="px-4 py-2 text-gray-300">
                                        {op.percentage}%
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="text-xs">
                                          <span className="text-gray-400">
                                            {formatNumber(op.previousStake)}
                                          </span>
                                          <span className="mx-1">→</span>
                                          <span className="font-medium text-white">
                                            {formatNumber(op.newStake)}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400 space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4">
              <span>
                API Endpoint: https://api.solido.money/admin/lstharvest
              </span>
              <span className="hidden md:inline">•</span>
              <span>
                Auto-refresh: {autoRefresh ? "Enabled (30s)" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isHealthy
                    ? "bg-teal-500 animate-pulse"
                    : isFullySettled
                    ? "bg-blue-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span>
                {isHealthy
                  ? "System Healthy"
                  : isFullySettled
                  ? "System Fully Settled"
                  : "System Error"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LSTHarvestDashboard;
