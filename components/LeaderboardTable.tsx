import React, { useState, useEffect, useCallback, useRef } from "react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import Image from "next/image";
import { useWallet } from "@/context/WalletContext";
import firstPodium from "../app/assets/leaderboard/1st_rank_block.png";
import secondPodium from "../app/assets/leaderboard/2nd_rank_block.png";
import thirdPodium from "../app/assets/leaderboard/3rd_rank_block.png";
import firstRank from "../app/assets/leaderboard/1st_rank.png";
import secondRank from "../app/assets/leaderboard/2nd_rank.png";
import thirdRank from "../app/assets/leaderboard/3rd_rank.png";

interface LeaderboardUser {
  rank: number;
  walletAddress: string;
  totalPoints: number;
  totalSupraRewards?: number;
  activePositionsCount?: number;
}

interface LeaderboardResponse {
  success: boolean;
  pagination: {
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    showing: number;
  };
  data: LeaderboardUser[];
}

interface UserRankResponse {
  success: boolean;
  data: LeaderboardUser;
}

const normalize = (addr?: string) => (addr || "").toLowerCase();

const Leaderboard = () => {
  const { account } = useWallet();

  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [prefetching, setPrefetching] = useState(false);

  // Caches stored in refs to avoid re-renders
  const leaderboardCache = useRef<Map<number, LeaderboardUser[]>>(new Map());
  const paginationCache = useRef<Map<number, any>>(new Map());
  const prefetchingPages = useRef<Set<number>>(new Set());

  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return address.length <= 13
      ? address
      : `${address.slice(0, 6)}...${address.slice(-5)}`;
  };

  const formatPoints = (points: number) => {
    if (points >= 1_000_000) return `${(points / 1_000_000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
    return Math.round(points).toString();
  };

  /** Fetch leaderboard page with caching */
  const fetchLeaderboard = useCallback(
    async (page: number, isPrefetch = false) => {
      if (leaderboardCache.current.has(page) && paginationCache.current.has(page)) {
        if (!isPrefetch) {
          setCurrentPage(page);
          setPagination(paginationCache.current.get(page));
          setLoading(false);
        }
        return {
          data: leaderboardCache.current.get(page)!,
          pagination: paginationCache.current.get(page)!,
        };
      }

      try {
        if (!isPrefetch) setLoading(true);
        if (isPrefetch) setPrefetching(true);

        const { data: res } = await axios.get<LeaderboardResponse>(
          `https://api.solido.money/users/leaderboard?page=${page}`
        );

        if (res.success) {
          const normalizedData = res.data.map((u) => ({
            ...u,
            walletAddress: normalize(u.walletAddress),
          }));

          leaderboardCache.current.set(page, normalizedData);
          paginationCache.current.set(page, res.pagination);

          if (!isPrefetch) {
            setCurrentPage(page);
            setPagination(res.pagination);
          }

          return { data: normalizedData, pagination: res.pagination };
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        if (!isPrefetch) setLoading(false);
        if (isPrefetch) setPrefetching(false);
      }
      return null;
    },
    []
  );

  /** Prefetch only the next page to avoid aggressive prefetching */
  const prefetchAdjacentPages = useCallback(
    (page: number, totalPages: number) => {
      const nextPage = page + 1;

      if (nextPage <= totalPages && !leaderboardCache.current.has(nextPage)) {
        if (!prefetchingPages.current.has(nextPage)) {
          prefetchingPages.current.add(nextPage);
          fetchLeaderboard(nextPage, true).finally(() =>
            prefetchingPages.current.delete(nextPage)
          );
        }
      }
    },
    [fetchLeaderboard]
  );

  /** Find user in cached leaderboard or fallback to search API (no full-page loop) */
  const findUserInLeaderboard = useCallback(
    async (wallet: string): Promise<LeaderboardUser | null> => {
      if (!wallet) return null;

      const acctNorm = normalize(wallet);
      try {
        const encoded = encodeURIComponent(wallet);
        const { data: res } = await axios.get<UserRankResponse>(
          `https://api.solido.money/users/leaderboard/search/${encoded}`
        );

        if (res && res.success && res.data) {
          const user: LeaderboardUser = {
            ...res.data,
            walletAddress: normalize(res.data.walletAddress),
            rank: Number(res.data.rank),
          };
          return user;
        }
      } catch (err) {
        console.warn("leaderboard search endpoint failed, falling back to cache", err);
      } for (const users of leaderboardCache.current.values()) {
        const found = users.find((u) => normalize(u.walletAddress) === acctNorm);
        if (found) return found;
      }

      return null;
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      const result = await fetchLeaderboard(1);
      if (result)
        setTimeout(() => {
          prefetchAdjacentPages(1, result.pagination.totalPages);
        }, 500);
    };
    init();
  }, [fetchLeaderboard, prefetchAdjacentPages]);

  useEffect(() => {
    if (!account) {
      setUserRank(null);
      return;
    }

    let mounted = true;

    const syncUser = async () => {
      setUserLoading(true);
      try {
        const acctNorm = normalize(account);

        // ✅ Wait until first-page data is available in cache
        let firstPageData = leaderboardCache.current.get(1);
        if (!firstPageData) {
          const result = await fetchLeaderboard(1);
          if (result) firstPageData = result.data;
        }

        // 1️⃣ Try finding the user from the first page
        const found = firstPageData?.find(
          (u) => normalize(u.walletAddress) === acctNorm
        );
        if (found && mounted) {
          setUserRank(found);
          return;
        }

        // 2️⃣ Otherwise, fall back to API search
        const user = await findUserInLeaderboard(account);
        if (mounted) setUserRank(user ?? null);
      } finally {
        if (mounted) setUserLoading(false);
      }
    };

    syncUser();

    return () => {
      mounted = false;
    };
  }, [account, findUserInLeaderboard, fetchLeaderboard]);




  /** Handle pagination */
  const handlePageChange = async (page: number) => {
    if (page < 1 || page > (pagination?.totalPages || 1)) return;

    if (leaderboardCache.current.has(page) && paginationCache.current.has(page)) {
      setCurrentPage(page);
      setPagination(paginationCache.current.get(page));
    } else {
      const result = await fetchLeaderboard(page);
      if (result) setPagination(result.pagination);
    }

    // Debounced prefetch of next page
    setTimeout(() => {
      prefetchAdjacentPages(page, pagination?.totalPages || 1);
    }, 500);
  };

  /** Podium top 3 */
  const getTop3 = () => {
    const page1 = leaderboardCache.current.get(1) || [];
    const top3 = page1.slice(0, 3);
    return [
      top3[1] ? { ...top3[1], position: "second" } : null,
      top3[0] ? { ...top3[0], position: "first" } : null,
      top3[2] ? { ...top3[2], position: "third" } : null,
    ].filter(Boolean);
  };

  const getRankImage = (pos: string) => (pos === "first" ? firstRank : pos === "second" ? secondRank : thirdRank);
  const getPodiumImage = (pos: string) => (pos === "first" ? firstPodium : pos === "second" ? secondPodium : thirdPodium);

  /** Table data excluding top 3 */
  const getTableData = () => {
    const pageData = leaderboardCache.current.get(currentPage) || [];
    return (currentPage === 1 ? pageData.slice(3) : pageData).map((user) => ({
      ...user,
      isMe: account ? normalize(account) === normalize(user.walletAddress) : false,
    }));
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 flex items-center justify-center">
        <div className="text-lg sm:text-xl">Loading leaderboard...</div>
      </div>
    );

  const top3Data = getTop3();
  const tableData = getTableData();

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-lg md:text-xl lg:text-2xl font-medium text-teal-400 mb-6 sm:mb-8 text-center sm:text-left flex w-full justify-center items-center">
          Leaderboard
        </h1>

        {/* Podium Section */}
        {top3Data.length > 0 && (
          <div className="flex flex-row sm:flex-row justify-center items-end gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {top3Data.map((item: any) => (
              <div key={item.rank} className="flex flex-col items-center w-full sm:w-auto max-w-xs">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mb-2 sm:mb-4">
                  <Image
                    src={getRankImage(item.position)}
                    alt={`Rank ${item.rank}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="relative flex flex-col justify-evenly items-center">
                  <Image
                    src={getPodiumImage(item.position)}
                    alt={`${item.position} podium`}
                    className="w-40 sm:w-48 lg:w-56 h-auto object-contain"
                  />
                  <div className="absolute bottom-2 sm:bottom-4 flex flex-col items-center justify-center h-full px-2">
                    <a
                      href={`https://suprascan.io/address/${item.walletAddress}`}
                      target="_blank"
                      className="flex items-center gap-1 sm:gap-2 text-white/90 text-xs sm:text-sm mb-1 sm:mb-2"
                    >
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {formatWalletAddress(item.walletAddress)}
                      </span>
                      <ExternalLink size={10} className="sm:w-3 sm:h-3 flex-shrink-0" />
                    </a>
                    <div className="text-white font-bold text-sm sm:text-base lg:text-lg text-center">
                      {formatPoints(item.totalPoints)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Rank Card */}
        {userRank && account && (
          <div className="bg-black border border-teal-500/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="text-teal-400 font-semibold mb-2 text-sm sm:text-base">
              Your Rank
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <span className="text-white font-bold text-sm sm:text-base">
                  {userRank.rank}
                </span>
                <span className="text-gray-300 text-xs sm:text-sm truncate">
                  {formatWalletAddress(userRank.walletAddress)}
                </span>
              </div>
              <span className="text-white font-bold text-sm sm:text-base">
                {formatPoints(userRank.totalPoints)}
              </span>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-black rounded-lg border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 flex w-full justify-between items-center">
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-gray-300 font-medium text-sm sm:text-base">
                    Rank
                  </th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-gray-300 font-medium text-sm sm:text-base">
                    Wallet Address
                  </th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-gray-300 font-medium text-sm sm:text-base">
                    Solido Points
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable Table Body */}
          <div className="h-64 sm:h-80 lg:h-96 overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <tbody>
                  {tableData.map((row: any, index) => (
                    <tr
                      key={`${row.rank}-${index}`}
                      className={`border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors flex justify-between items-center w-full px-6`}
                    >
                      <td className="py-3 sm:py-4 px-3 sm:px-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-white text-sm sm:text-base">
                            #{row.rank}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-8">
                        <a
                          href={`https://suprascan.io/address/${row.walletAddress}`}
                          target="_blank"
                          className="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <span className="text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                            {formatWalletAddress(row.walletAddress)}
                          </span>
                          <ExternalLink
                            size={12}
                            className="sm:w-4 sm:h-4 opacity-60 hover:opacity-100 flex-shrink-0"
                          />
                        </a>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-white text-sm sm:text-base">
                        {formatPoints(row.totalPoints)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 gap-4">
            <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              Showing {pagination.showing} of {pagination.totalUsers} users
              {prefetching && (
                <span className="ml-2 text-teal-400">• Prefetching...</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-sm"
              >
                <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>

              <span className="px-2 sm:px-4 py-2 text-gray-300 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
