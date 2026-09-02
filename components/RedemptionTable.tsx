"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import reset from "../app/assets/reset.svg";
import down from "../app/assets/down.svg";
import up from "../app/assets/up.svg";
import arrow from "../app/assets/arrow.svg";
import axios from "axios";
import { useWallet } from "@/context/WalletContext";
import FullScreenLoader from "./FullScreenLoader";
import { formatLargeNumber } from "./getActualDecimal";

const COLLATERAL_ADDRESSES: Record<string, string> = {
  stSUPRA: "0x81846514536430ea934c7270f86cf5b067e2a2faef0e91379b4f284e91c7f53c",
  SUPRA: "0x1",
};

interface HistoryItem {
  timestamp: string;
  blockNumber: number;
  txHash?: string;
  txType: string;
  collChange: number;
  debtChange: number;
}

interface PositionData {
  positionID: number;
  walletAddress: string;
  collAddress: string;
  status: string;
  NICR: number;
  coll: number;
  debt: number;
  history: HistoryItem[];
}

interface ApiResponse {
  status: string;
  success: boolean;
  data: PositionData[];
}

interface RedemptionHistoryProps {
  display: string;
}

const PositionHistory: React.FC<RedemptionHistoryProps> = ({ display }) => {
  const { account } = useWallet();

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [allHistory, setAllHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      setLoading(false);
      return;
    }

    // resolve collateral address from display
    const collAddress = COLLATERAL_ADDRESSES[display] || "0x1";

    axios
      .get(
        `https://api.solido.money/positions/history?walletAddress=${account}&collAddress=${collAddress}`
      )
      .then((response: { data: ApiResponse }) => {
        if (response.data && response.data.success) {
          setPositions(response.data.data);

          // Flatten + collect all history
          const history: HistoryItem[] = [];
          response.data.data.forEach((position) => {
            if (position.history && Array.isArray(position.history)) {
              history.push(...position.history);
            }
          });

          // Sort by newest first
          history.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setAllHistory(history);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching position data:", error);
        setLoading(false);
      });
  }, [account, display]);

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === `${index}` ? null : `${index}`);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTransactionTypeStyle = (txType: string) => {
    switch (txType) {
      case "open":
        return { color: "#1dbdaf" };
      case "adjust":
        return { color: "#dafffc" };
      case "redeem":
        return { color: "#ffdc41" };
      default:
        return { color: "#dc2626" };
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <FullScreenLoader />
      </div>
    );
  }

  if (allHistory.length === 0) {
    return <div className="text-center p-4">No position history found.</div>;
  }

  return (
    <div className="border-2 border-[gray-400] p-4 my-4 shadow-md bg-black">
      <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 text-[#1DBDAF]">
        <Image src={reset} alt="reset icon" /> POSITION HISTORY
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="py-2 text-xs md:text-sm text-[white] h-12">
            <tr className="border-t-[#C7D7E1] border-b-[#C7D7E1]">
              <th className="text-left py-2 font-medium pl-4">Timestamp</th>
              <th className="text-left py-2 font-medium">Transaction Type</th>
              <th className="text-left py-2 font-medium">Collateral Change</th>
              <th className="text-left py-2 font-medium">Debt Change</th>
              <th className="text-left py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {allHistory.map((item, index) => (
              <tr
                key={index}
                className="border-t-[#E6EDF2] border-b-[#E6EDF2] bg-black text-xs md:text-sm text-[white] font-medium h-[70px]"
              >
                <td className="py-2 pl-4 whitespace-nowrap">
                  {formatDate(item.timestamp)}
                </td>
                <td
                  className="py-2 whitespace-nowrap capitalize"
                  style={getTransactionTypeStyle(item.txType)}
                >
                  {item.txType}
                </td>
                <td className="py-2 whitespace-nowrap">
                  {item.collChange >= 0 ? "+" : ""}
                  {formatLargeNumber(item.collChange)} {display}
                </td>
                <td className="py-2 whitespace-nowrap">
                  {item.debtChange >= 0 ? "+" : ""}
                  {formatLargeNumber(item.debtChange)} CASH
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PositionHistory;
