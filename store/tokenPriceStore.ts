// stores/tokenPriceStore.ts
import { create } from "zustand";
import axios from "axios";

interface TokenMetrics {
  token: string;
  price: number;
  totalColl?: number;
  totalDebt?: number;
  [key: string]: any;
}

interface TokenPriceState {
  prices: Record<string, number>; // { SUPRA: 0.002, stSUPRA: 0.001 }
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
  fetchPrice: (tokenType: "SUPRA" | "stSUPRA") => Promise<void>;
}

export const useTokenPriceStore = create<TokenPriceState>((set, get) => ({
  prices: {},
  loading: {},
  errors: {},

  fetchPrice: async (tokenType) => {
    if (!tokenType) return;

    set((state) => ({
      loading: { ...state.loading, [tokenType]: true },
      errors: { ...state.errors, [tokenType]: null },
    }));

    try {
      const response = await axios.get(
        "https://api.solido.money/protocol/metrics"
      );

      if (response.data && response.data.success) {
        const metrics: TokenMetrics[] = response.data.metrics || [];
        const tokenData = metrics.find((metric) => metric.token === tokenType);

        if (tokenData && typeof tokenData.price === "number") {
          set((state) => ({
            prices: { ...state.prices, [tokenType]: tokenData.price },
          }));
        } else {
          throw new Error(`Price data for ${tokenType} not found`);
        }
      } else {
        throw new Error("Invalid response from metrics API");
      }
    } catch (err) {
      console.error(`Error fetching ${tokenType} price:`, err);
      set((state) => ({
        errors: {
          ...state.errors,
          [tokenType]: err instanceof Error ? err : new Error("Unknown error"),
        },
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, [tokenType]: false },
      }));
    }
  },
}));
