"use client";

import React, { useState } from "react";
import { useRef } from "react";
import { Toast } from "primereact/toast";
import { useWallet } from "@/context/WalletContext";
import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RiBarChartLine, RiBillLine } from "react-icons/ri";
import Link from "next/link";
import { GrTransaction } from "react-icons/gr";
import db_icon_selcted from "@/app/assets/dashboard/dashboard_icon_selected.png";
import db_icon__not_selected from "@/app/assets/dashboard/dashboard_icon_not_selected.png";
import stake_icon_not_selected from "@/app/assets/dashboard/stake_icon_not_selected.png";
import stake_icon_selected from "@/app/assets/dashboard/stake_icon_selected.png";
import borrow_icon_not_selected from "@/app/assets/dashboard/borrow_icon_not_selected.png";
import borrow_icon_selected from "@/app/assets/dashboard/borrow_icon_selected.png";
import earn_icon_not_selected from "@/app/assets/dashboard/earn_icon_not_selected.png";
import earn_icon_selected from "@/app/assets/dashboard/earn_icon_selected.png";
import { GiUnbalanced } from "react-icons/gi";
import { RiExchangeDollarLine } from "react-icons/ri";

import { RiCoinsLine } from "react-icons/ri";
import { LayoutGrid } from "lucide-react";
import Image from "next/image";
// import logo from "../app/assets/images/EARTHLOGO.svg";
import logo from "../app/assets/images/logo.png";
import zeally from "../app/assets/images/zeally.svg";
import tweet from "../app/assets/images/X.png";
import discord from "../app/assets/images/discord.png";
import medium from "../app/assets/images/medium.png";
import external from "../app/assets/arrow.svg";
import liquidate from "../app/assets/liquidate.svg";
import "../app/App.css";

// Custom Tooltip component
const CustomTooltip = ({
  children,
  tooltipText,
  show,
}: {
  children: React.ReactNode;
  tooltipText: string;
  show: boolean;
}) => {
  return (
    <div className="relative group">
      {children}
      {show && (
        <div className="w-1/2 absolute bottom-0 left-0 transform translate-y-full mt-1 z-10 bg-[#2F2F2F] text-white text-sm px-2 py-1 rounded ">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export const TabsDemo = () => {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const { account } = useWallet();
  const [showTooltip, setShowTooltip] = useState(false);

  const isRoute = (route: string) => {
    if (route === "/") {
      return pathname === "/";
    }
    if (route === "/borrow") {
      return pathname.startsWith("/borrow");
    }
    return pathname === route;
  };
  const handleRouteChange = useCallback(
    (route: string) => {
      if (pathname !== route) {
        router.push(route);
      }
    },
    [pathname, router]
  );
  return (
    <>
      <div
        className={`sidebar border-r-2 border-gray-100 border-opacity-10 hidden md:flex flex-col  font-medium w-72 h-[100vh] bg-[black] text-white`}
      >
        <div className="flex items-center justify-center py-4">
          <Link href="/" onClick={() => handleRouteChange("/")}>
            <Image src={logo} alt="Logo" className="w-40 mr-20" />
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-grow mt-2">
          <nav className="flex flex-col gap-y-2 px-4">
            {[
              {
                name: "Dashboard",
                route: "/",
                icon: db_icon__not_selected,
                isSelectedIcon: db_icon_selcted,
                disabled: false,
              },
              {
                name: "Stake $SUPRA",
                route: "/stake",
                icon: stake_icon_not_selected,
                isSelectedIcon: stake_icon_selected,
                disabled: false,
              },
              {
                name: "Borrow $CASH",
                route: "/borrow",
                icon: borrow_icon_not_selected,
                isSelectedIcon: borrow_icon_selected,
                disabled: false,
              },
              {
                name: "Earn $CASH",
                route: "/earn",
                icon: earn_icon_not_selected,
                isSelectedIcon: earn_icon_selected,
                disabled: false,
              },
            ].map(({ name, route, icon, disabled, isSelectedIcon }) => {
              // Determine if we need to show a tooltip for this item
              const needsTooltip = disabled && name === "Redeem $CASH";

              return (
                <Link
                  href={disabled ? "#" : route}
                  onClick={(e) => disabled && e.preventDefault()}
                  key={route}
                >
                  <div
                    className="relative"
                    onMouseEnter={() => needsTooltip && setShowTooltip(true)}
                    onMouseLeave={() => needsTooltip && setShowTooltip(false)}
                  >
                    <div
                      className={`text-xl flex items-center gap-x-2 p-2 mb-1 ${
                        isRoute(route) && !disabled
                          ? "bg-[#1DBDAF] text-black"
                          : disabled
                          ? "text-gray-500 cursor-not-allowed"
                          : "text-[white] cursor-pointer hover:text-[#1DBDAF]"
                      }`}
                    >
                      {isRoute(route) && !disabled ? (
                        <Image
                          src={isSelectedIcon}
                          alt={`${name} icon`}
                          width={32}
                          height={32}
                        />
                      ) : (
                        <Image
                          src={icon}
                          alt={`${name} icon`}
                          width={32}
                          height={32}
                        />
                      )}
                      <span className="font-medium text-lg font-poppins">
                        {name}
                      </span>

                      {/* Custom tooltip for Redeem $CASH */}
                      {needsTooltip && showTooltip && (
                        <div className="absolute top-2 left-20 mt-1 z-10 bg-[#2F2F2F] text-white text-xs px-2 py-1 ">
                          Redemptions have been stopped due to excessive
                          unnecessary usage.
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col  mx-2 ">
          <div className="text-[#1DBDAF] -ml-10 px-16 ">
            <div className="mb-4">
              <Link target="_blank" href="/liquidate">
                <div className="flex text-[#1DBDAF]  items-center justify-between cursor-point hover:text-[white]">
                  <span className="font-poppins hover:text-[white] text-[#1DBDAF] font-medium">
                    Trove List
                  </span>
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </div>
              </Link>
              <Link target="_blank" href="/stats">
                <div className="flex text-[#1DBDAF]  items-center justify-between cursor-point hover:text-[white]">
                  <span className="font-poppins hover:text-[white] text-[#1DBDAF] font-medium">
                    Protocol Stats
                  </span>
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </div>
              </Link>
              <Link
                target="_blank"
                href="https://solido-money.gitbook.io/solido/product-guide/solido-cash"
              >
                <div className="flex text-[#1DBDAF]  items-center justify-between cursor-point hover:text-[white]">
                  <span className="font-poppins hover:text-[white] text-[#1DBDAF] font-medium">
                    Product Guide
                  </span>
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </div>
              </Link>
              <Link target="_blank" href="https://solido.money/">
                <div className="flex text-[#1DBDAF] items-center justify-between cursor-pointer hover:text-[white]">
                  <span className="font-poppins hover:text-[white] text-[#1DBDAF] font-medium">
                    Website
                  </span>
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </div>
              </Link>
            </div>
          </div>
          {/* <div className="  w-fit h-fit">
            <Link href="https://zealy.io/cw/palladiumlabs/questboard">
              <Image
                src={zeally}
                alt="zeally"
                className="w-[227px] h-[100px]"
              />
            </Link>
          </div> */}
          {/* Social Links */}
          <div className=" -ml-8 pb-6 ">
            <div className="flex items-center justify-center gap-x-6">
              <Link target="_blank" href="https://x.com/SolidoMoney/">
                <Image
                  src={tweet}
                  alt="Twitter"
                  className="w-12 h-13 hover:scale-105"
                />
              </Link>
              <Link target="_blank" href="https://discord.gg/BPqg54NUfb">
                <Image
                  src={discord}
                  alt="Discord"
                  className="w-12 h-13 hover:scale-105"
                />
              </Link>
              <Link target="_blank" href="https://medium.com/solido-money">
                <Image
                  src={medium}
                  alt="Medium"
                  className="w-12 h-13 hover:scale-105"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
