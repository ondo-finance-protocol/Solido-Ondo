import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatLargeNumber } from "@/components/getActualDecimal";

interface PauseFunctionResponses {
  open_trove: boolean;
  borrow: boolean;
  deposit: boolean;
  redeem: boolean;
}

interface Metric {
  pauseFunctionResponses: PauseFunctionResponses;
  decimals: number;
  minDebt: number;
  liquidationFeeProtocol: number;
  redemptionFee: number;
  redemptionGratuity: number;
  token: string;
  price: number;
  MCR: number;
  liquidationReserve: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  borrowRate: number;
  totalColl: number;
  totalDebt: number;
  maxMint: number;
  _id: string;
}

interface ApiResponse {
  status: string;
  success: boolean;
  stakedCASH: number;
  priceCIRCLE: number;
  pricestSUPRA: number;
  pricebCASH: number;
  stakedSUPRA: number;
  metrics: Metric[];
}

interface ProtocolStats {
  tvl: string;
  totalSupply: {
    supra: string;
    total: string;
    supraCollateral: string;
  };
  prices: {
    supra: number;
  };
  stakedSUPRA: string;
  stSUPRASupply: string;
  stakedCASH: string;
  bCASHSupply: string;
  systemCollRatio: number;
  isLoading: boolean;
  error: string | null;
}

type ProtocolMetrics = Omit<ProtocolStats, "isLoading" | "error">;

const EMPTY_METRICS: ProtocolMetrics = {
  tvl: "0",
  totalSupply: {
    supra: "0",
    total: "0",
    supraCollateral: "0",
  },
  prices: {
    supra: 0,
  },
  stakedSUPRA: "0",
  stSUPRASupply: "0",
  stakedCASH: "0",
  bCASHSupply: "0",
  systemCollRatio: 0,
};

const fetchProtocolMetrics = async (): Promise<ProtocolMetrics> => {
  const response = await axios.get<ApiResponse>(
    "https://api.solido.money/protocol/metrics"
  );
  const data = response.data;

  if (!data?.metrics || data.metrics.length === 0) {
    throw new Error("Invalid metrics response");
  }

  const supraMetric = data.metrics.find((m) => m.token === "SUPRA");
  const stSupraMetric = data.metrics.find((m) => m.token === "stSUPRA");

  const supraPriceValue = supraMetric?.price || 0;
  const stSupraPriceValue = stSupraMetric?.price || 0;

  const supraCollateral = supraMetric?.totalColl || 0;
  const supraDebt = supraMetric?.totalDebt || 0;

  const stSupraCollateral = stSupraMetric?.totalColl || 0;
  const stSupraDebt = stSupraMetric?.totalDebt || 0;

  const stakeTVL = data.stakedCASH * data.priceCIRCLE;
  const flowTVL = data.stakedSUPRA * stSupraPriceValue;

  // Total TVL = SUPRA collateral + stSUPRA collateral + staked CASH + staked SUPRA
  const totalTvl =
    supraCollateral * supraPriceValue +
    stSupraCollateral * stSupraPriceValue +
    stakeTVL +
    flowTVL;

  // Total supply = total debt of SUPRA + stSUPRA
  const totalSupplyNumber = supraDebt + stSupraDebt;

  const stakedSUPRA = data.stakedSUPRA || 0;
  const stSUPRASupply =
    stakedSUPRA > 0 ? stakedSUPRA / data.pricestSUPRA : 0;
  const bCASHSupply = data.stakedCASH / data.pricebCASH;

  const avgSCR = totalSupplyNumber > 0 ? totalTvl / totalSupplyNumber : 0;

  return {
    tvl: String(formatLargeNumber(totalTvl)),
    totalSupply: {
      supra: String(formatLargeNumber(supraDebt)),
      supraCollateral: String(
        formatLargeNumber(supraCollateral + stSupraCollateral)
      ),
      total: String(formatLargeNumber(totalSupplyNumber)),
    },
    prices: {
      supra: supraPriceValue,
    },
    stakedSUPRA: String(formatLargeNumber(stakedSUPRA)),
    stSUPRASupply: String(formatLargeNumber(stSUPRASupply)),
    stakedCASH: String(formatLargeNumber(data.stakedCASH || 0)),
    bCASHSupply: formatLargeNumber(bCASHSupply),
    systemCollRatio: avgSCR,
  };
};

const useFetchMetrics = (): ProtocolStats => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["protocol-metrics"],
    queryFn: fetchProtocolMetrics,
    staleTime: 60_000,
  });

  return {
    ...(data ?? EMPTY_METRICS),
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch protocol stats"
      : null,
  };
};

export default useFetchMetrics;
