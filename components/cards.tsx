/* eslint-disable react/display-name */
"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import axios from "axios";
import { FaArrowRightLong } from "react-icons/fa6";
import { Tooltip } from "primereact/tooltip";

// Import images
import img1 from "../app/assets/dashboard/Stake_SUPRA.png";
import img2 from "../app/assets/dashboard/Borrow_CASH.png";
import img3 from "../app/assets/dashboard/Earn_CASH.png";
import solido_bg_img from "../app/assets/dashboard/Group 1194.png";
import supra_bg_img from "../app/assets/dashboard/Group 1329.png";
import supra_img from "../app/assets/dashboard/Group 1328.png";
import circle from "../app/assets/images/globe.png";
import info from "../app/assets/images/info_teal.svg";

// Import components
import { useWallet } from "../context/WalletContext";
import LeaderboardTable from "./LeaderboardTable";
import { useTermsAcceptance } from "../hooks/useTermsAcceptance";
import { module_address, module_name, supra_coin } from "@/constants/constants";
import AirdropClaim from "@/app/claim/AirdropClaim";

// Types
interface PointsData {
  testnetPoints: number;
  points: number;
  debtPoints: number;
  collPointsRealised: number;
  collPointsUnrealised: number;
  supraRewards: number;
}

// Constants
const INITIAL_POINTS_DATA: PointsData = {
  testnetPoints: 0,
  points: 0,
  debtPoints: 0,
  collPointsRealised: 0,
  collPointsUnrealised: 0,
  supraRewards: 0,
};

const TARGET_DATE = new Date(Date.UTC(2025, 5, 15, -1, 0, 0));

// Custom hooks
const useStableAccount = (account: string | null) => {
  const [stableAccount, setStableAccount] = useState<string | null>(null);
  const lastAccountRef = useRef<string | null>(null);
  const hasSetInitialAccount = useRef<boolean>(false);


  useEffect(() => {
    if (
      account &&
      account !== "undefined" &&
      account !== lastAccountRef.current
    ) {
      setStableAccount(account);
      lastAccountRef.current = account;
      hasSetInitialAccount.current = true;
    } else if (!account || account === "undefined") {
      if (hasSetInitialAccount.current) {
        setStableAccount(null);
        lastAccountRef.current = null;
      }
    }
  }, [account]);

  return stableAccount;
};

// Memoized components
const LoadingSkeleton = React.memo(() => (
  <div className="flex flex-col md:flex-row gap-[4rem] justify-start animate-pulse">
    <div className="flex items-center">
      <div className="w-[40px] md:w-[50px] h-[40px] md:h-[50px] rounded-full bg-gray-200 mr-2"></div>
      <div className="w-24 h-8 bg-gray-200 rounded-md mr-2"></div>
    </div>
  </div>
));

const ConnectWalletPrompt = React.memo(
  ({ onConnect, message }: { onConnect: () => void; message: string }) => (
    <div className="flex flex-col">
      <div className="flex flex-row gap-1">
        <Image src={info} alt="info" width={16} height={16} />
        <span>{message}</span>
      </div>
      <div
        className="flex flex-row items-center gap-x-1 text-[#1DBDAF] text-xs mt-1 cursor-pointer"
        onClick={onConnect}
      >
        <span>Connect Wallet</span>
        <FaArrowRightLong className="inline-block" />
      </div>
    </div>
  )
);

const PointsDisplay = React.memo(
  ({
    points,
    icon,
    altText,
  }: {
    points: number;
    icon: any;
    altText: string;
  }) => (
    <div className="w-full flex flex-col md:flex-row gap-[4rem] justify-start">
      <div className="flex items-center">
        <Image
          src={icon}
          alt={altText}
          width={40}
          height={40}
          className="md:w-[50px] md:h-[50px]"
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
        />
        <p className="text-xl md:text-lg lg:text-3xl text-white font-bold mx-2 font-sans">
          {Math.round(points)}
        </p>
      </div>
    </div>
  )
);

const InfoCard = React.memo(
  ({
    title,
    isConnected,
    isLoading,
    points,
    icon,
    altText,
    onConnect,
    bgImage,
    infoMessage,
    linkHref,
    linkText,
    tooltipContent,
    action, // 👈 new prop
  }: {
    title: string;
    isConnected: boolean;
    isLoading: boolean;
    points: number;
    icon: any;
    altText: string;
    onConnect: () => void;
    bgImage: any;
    infoMessage: string;
    linkHref?: string;
    linkText?: string;
    tooltipContent?: string;
    action?: React.ReactNode; // 👈 new type
  }) => (
    <div className="relative w-full md:w-[50%] h-[162px] bg-cover bg-no-repeat bg-center bg-[#222222]">
      <Image
        src={bgImage}
        alt={`${title} background`}
        className="absolute items-end w-28 right-0.5 bottom-0"
        width={112}
        height={80}
      />
      <div className="flex flex-col gap-4 items-start justify-center h-full pl-6">
        <div className="flex flex-row items-center gap-2">
          <p className="text-lg md:text-xl lg:text-2xl font-base text-white font-poppins">
            {title}
          </p>
          {tooltipContent && (
            <>
              <Image
                width={15}
                className="toolTipHolding12 cursor-pointer"
                src={info}
                alt="info"
              />
              <Tooltip
                className="font-poppins"
                target=".toolTipHolding12"
                content={tooltipContent}
                mouseTrack
                mouseTrackLeft={10}
              />
            </>
          )}
        </div>
        {!isConnected ? (
          <ConnectWalletPrompt onConnect={onConnect} message={infoMessage} />
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex items-center gap-3">
            <PointsDisplay points={points} icon={icon} altText={altText} />
            {action && action}
          </div>
        )}
      </div>
    </div>
  )
);

const ActionCard = React.memo(
  ({
    title,
    description,
    href,
    linkText,
    image,
    altText,
  }: {
    title: string;
    description: string;
    href: string;
    linkText: string;
    image: any;
    altText: string;
  }) => (
    <div className="bg-[linear-gradient(170.94deg,_#000000_20.23%,_rgba(225,225,225,0.933333)_363.88%)] h-auto border border-gray-400 p-4 box-border relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="mb-2 text-md font-poppins font-semibold text-[#1DBDAF]">
          {title}
        </div>
        <p className="text-sm font-poppins font-medium text-[#CEF0ED] mb-1">
          {description}
        </p>
      </div>
      <div className="relative h-[120px] flex justify-between items-end w-full">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-[50%]"
        >
          <span className="text-[#1DBDAF] font-poppins font-medium text-sm flex flex-row items-center gap-x-2 -mt-10">
            {linkText}
            <FaArrowRightLong className="inline-block" />
          </span>
        </a>
        <Image
          src={image}
          alt={altText}
          className="relative -right-5 -bottom-5 w-[60%] h-[100%] "
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
        />
      </div>
    </div>
  )
);

const CardDemo: React.FC = () => {
  const { account, connectWallet } = useWallet();
  const stableAccount = useStableAccount(account);
  const [isOpen, setIsOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const storedClaimed = localStorage.getItem("claimed");
    if (storedClaimed === "true") {
      setClaimed(true);
    }
  }, []);

  const handleClaimSuccess = useCallback(() => {
    setClaimed(true);
    localStorage.setItem("claimed", "true");
  }, []);


  const {
    currentModal,
    isLoading: termsLoading,
  } = useTermsAcceptance(stableAccount);

  const [troveStatus, setTroveStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pointsData, setPointsData] = useState<PointsData>(INITIAL_POINTS_DATA);

  const isConnected = useMemo(
    () => Boolean(account && account !== "undefined"),
    [account]
  );

  const getTroveStatus = useCallback(async () => {
    if (!account || account === "undefined") return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://rpc-mainnet.supra.com/rpc/v2/view",
        {
          function: `${module_address}::${module_name}::get_user_position`,
          type_arguments: [supra_coin],
          arguments: [account],
        }
      );
      setTroveStatus(response.data.result[2] ? "ACTIVE" : "INACTIVE");
    } catch (err) {
      console.error("Error fetching trove info:", err);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const fetchPointsData = useCallback(async () => {
    if (!account || account === "undefined") return;

    try {
      const response = await axios.get(
        `https://api.solido.money/users/points?walletAddress=${account}`
      );
      if (response.data.success) {
        setPointsData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching points data:", error);
    }
  }, [account]);

  useEffect(() => {
    if (isConnected) {
      Promise.all([getTroveStatus(), fetchPointsData()]);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, getTroveStatus, fetchPointsData]);

  const cardData = useMemo(
    () => [
      {
        title: "Stake $SUPRA",
        description:
          "Deposit SUPRA to earn validator rewards and retain liquidity in stSUPRA. Earn 2 points per day for every $ deposited.",
        href: "/stake",
        linkText: "Stake $SUPRA",
        image: img1,
        altText: "Stake SUPRA",
      },
      {
        title: "Borrow $CASH",
        description:
          "Need liquidity? Borrow against your crypto. Earn 50 points for every $CASH you borrow and 2 points daily per $ of collateral.",
        href: "/borrow",
        linkText: "Borrow $CASH",
        image: img2,
        altText: "Borrow CASH",
      },
      {
        title: "Earn $CASH",
        description:
          "Deposit CASH to earn yield and retain liquidity in bCASH. Earn 2 points per day for every $CASH held in the vault.",
        href: "/earn",
        linkText: "Earn $CASH",
        image: img3,
        altText: "Earn CASH",
      },
    ],
    []
  );

  if (termsLoading && stableAccount && stableAccount !== "undefined") {
    return (
      <div className="bg-black min-h-screen -mx-8 -my-7 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1DBDAF]"></div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`bg-black min-h-screen -mx-8 -my-7 ${currentModal !== "none" ? "pointer-events-none opacity-50" : ""
          }`}
      >
        <div className="container mt-6 text-white flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center md:gap-10 gap-5">
            <InfoCard
              title="Solido Points"
              isConnected={isConnected}
              isLoading={isLoading}
              points={pointsData.points}
              icon={circle}
              altText="Solido logo"
              onConnect={connectWallet}
              bgImage={solido_bg_img}
              infoMessage="Start using Solido to earn points"
              linkHref="/borrow"
              linkText="Open a Trove"
            />

            <InfoCard
              title="SUPRA Earned"
              isConnected={isConnected}
              isLoading={isLoading}
              points={pointsData.supraRewards}
              icon={supra_img}
              altText="SUPRA logo"
              onConnect={connectWallet}
              bgImage={supra_bg_img}
              infoMessage="Start using Solido to earn SUPRA rewards"
              action={
                pointsData.supraRewards > 0 && !claimed ? (
                  <button
                    onClick={() => setIsOpen(true)}
                    className="px-3 py-1 bg-[#00C0AF] text-black text-sm"
                  >
                    Claim
                  </button>
                ) : claimed ? (
                  <span
                    className="py-1 text-[#D3D3D3] text-sm bg-transparent cursor-default whitespace-nowrap"
                  >
                    Claim Complete
                  </span>
                ) : null
              }
            />

            <AirdropClaim
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onSuccess={handleClaimSuccess}
            />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 overflow-hidden">
            {cardData.map((card, index) => (
              <ActionCard key={index} {...card} />
            ))}
          </div>
        </div>

        <LeaderboardTable />
      </div>
    </>
  );
};

export default CardDemo;
