"use client";
import React, { useState } from "react";
import { GrTransaction } from "react-icons/gr";
import { LiaHandHoldingUsdSolid } from "react-icons/lia";
import { GiHamburgerMenu } from "react-icons/gi";
import { RiBarChartLine, RiExchangeDollarLine } from "react-icons/ri";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import logo from "../app/assets/images/logo.png";
import tweet from "../app/assets/images/X.png";
import discord from "../app/assets/images/discord.png";
import medium from "../app/assets/images/medium.png";
import { Sidebar } from "primereact/sidebar";
import { RxCross2 } from "react-icons/rx";
import { LayoutGrid } from "lucide-react";
import "../app/App.css";
import external from "../app/assets/arrow.svg";
import useFetchMetrics from "@/hooks/use-fetch-metrics";
import { StatCard } from "./navbar/stat-card";
import ORE from "@/app/assets/images/CASH2.png";
import tvl_logo from "@/app/assets/images/tvl.png";

// Icons for routes
import db_icon_selcted from "@/app/assets/dashboard/dashboard_icon_selected.png";
import db_icon__not_selected from "@/app/assets/dashboard/dashboard_icon_not_selected.png";
import stake_icon_not_selected from "@/app/assets/dashboard/stake_icon_not_selected.png";
import stake_icon_selected from "@/app/assets/dashboard/stake_icon_selected.png";
import borrow_icon_not_selected from "@/app/assets/dashboard/borrow_icon_not_selected.png";
import borrow_icon_selected from "@/app/assets/dashboard/borrow_icon_selected.png";
import earn_icon_not_selected from "@/app/assets/dashboard/earn_icon_not_selected.png";
import earn_icon_selected from "@/app/assets/dashboard/earn_icon_selected.png";
import stSUPRA_logo from "@/app/assets/images/flow/stSupra.png";

export default function MobileNav() {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const { tvl, totalSupply, systemCollRatio, isLoading, stSUPRASupply } = useFetchMetrics();

  const handleMenuClick = (menu: string) => {
    setSelectedMenu(menu);
  };

  const isMenuSelected = (menu: string) => selectedMenu === menu;

  interface MenuItem {
    id: string;
    icon: StaticImageData;
    isSelectedIcon: StaticImageData;
    title: string;
    link: string;
    clickable: boolean;
  }

  const menuItems: MenuItem[] = [
    {
      id: "Dashboard",
      icon: db_icon__not_selected,
      isSelectedIcon: db_icon_selcted,
      title: "Dashboard",
      link: "/",
      clickable: true,
    },
    {
      id: "Stake $SUPRA",
      icon: stake_icon_not_selected,
      isSelectedIcon: stake_icon_selected,
      title: "Stake $SUPRA",
      link: "/stake",
      clickable: true,
    },
    {
      id: "Borrow",
      icon: borrow_icon_not_selected,
      isSelectedIcon: borrow_icon_selected,
      title: "Borrow $CASH",
      link: "/borrow",
      clickable: true,
    },
    {
      id: "Earn $CASH",
      icon: earn_icon_not_selected,
      isSelectedIcon: earn_icon_selected,
      title: "Earn $CASH",
      link: "/earn",
      clickable: true,
    },
  ];

  const redeemTooltipText =
    "Redemptions have been stopped due to excessive unnecessary usage.";

  return (
    <div className="w-12 h-12 title-text flex ">
      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        closeIcon={<RxCross2 className="text-[#1DBDAF]" />}
      >
        <div
          className="sidebar bg-red-90 h-full font-mono font-extrabold w-full text-white"
          style={{ backgroundColor: "black" }}
        >
          <div className="flex items-center px-6 py-3">
            <Link href="/">
              <Image src={logo} alt="Logo" className="w-40" />
            </Link>
          </div>
          <nav className="flex flex-col gap-y-2 px-4">
            {menuItems.map((menuItem) => (
              <Link
                legacyBehavior
                key={menuItem.id}
                href={menuItem.clickable ? menuItem.link : "#"}
              >
                <a
                  className={`cursor-pointer text-xl menu flex min-w-[200px] items-center gap-x-3 rounded-lg p-2 
                    ${
                      isMenuSelected(menuItem.id)
                        ? "bg-[#1DBDAF] text-black"
                        : "text-white"
                    }
                    ${
                      !menuItem.clickable
                        ? "pointer-events-none cursor-not-allowed text-gray-400"
                        : ""
                    }`}
                  onClick={() => {
                    if (menuItem.clickable) {
                      handleMenuClick(menuItem.id);
                      setVisible(false);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!menuItem.clickable && menuItem.id === "redeem") {
                      setShowTooltip(true);
                    }
                  }}
                  onMouseLeave={() => {
                    setShowTooltip(false);
                  }}
                >
                  <div
                    className={`menu flex items-center gap-x-3 rounded-full p-2 ${
                      isMenuSelected(menuItem.id)
                        ? "text-black"
                        : "text-[#618ba6]"
                    }`}
                  >
                    {isMenuSelected(menuItem.id) ? (
                      <Image
                        src={menuItem.isSelectedIcon}
                        alt={`${menuItem.title} icon`}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <Image
                        src={menuItem.icon}
                        alt={`${menuItem.title} icon`}
                        width={32}
                        height={32}
                      />
                    )}
                  </div>
                  <span className="font-medium body-text relative">
                    {menuItem.title}
                    {!menuItem.clickable && menuItem.id === "redeem" && (
                      <div
                        className={`absolute z-50 left-0 mt-1 px-4 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg whitespace-nowrap ${
                          showTooltip
                            ? "opacity-100 visible"
                            : "opacity-0 invisible"
                        }`}
                        style={{
                          top: "100%",
                          transition:
                            "opacity 0.05s ease-in-out, visibility 0.05s ease-in-out",
                        }}
                      >
                        {redeemTooltipText}
                      </div>
                    )}
                  </span>
                </a>
              </Link>
            ))}
          </nav>

          <div className="space-y-1 mt-32 ">
            <div className="flex flex-col justify-start gap-y-2  text-black gap-x-5 text-[19px] w-full px-8 mb-10 ">
              <StatCard
                icon={tvl_logo}
                label="TVL"
                value={tvl}
                value2={totalSupply?.supraCollateral}
                suffix="$"
                isLoading={isLoading}
              />

              <StatCard
                icon={ORE}
                label="CASH Supply"
                value={totalSupply?.total}
                isLoading={isLoading}
              />

              <StatCard
              icon={stSUPRA_logo}
              label="stSUPRA Supply"
              value={stSUPRASupply}
              isLoading={isLoading}
            />
            </div>
            <div className="flex flex-col items-center justify-center text-black gap-x-5 text-[19px] w-full px-4">
              <div className="flex flex-row justify-between  px-4 w-full mb-2">
                <p className="font-medium text-base body-text text-[#1DBDAF]">
                  Trove List
                </p>
                <Link target="_blank" href="/liquidate">
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </Link>
              </div>
              <div className="flex flex-row justify-between  px-4 w-full mb-2">
                <p className="font-medium text-base body-text text-[#1DBDAF]">
                  Protocol Stats
                </p>
                <Link target="_blank" href="/stats">
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </Link>
              </div>
              <div className="flex flex-row justify-between  px-4 w-full mb-2">
                <p className="font-medium text-base body-text text-[#1DBDAF]">
                  Product Guide
                </p>
                <Link
                  target="_blank"
                  href="https://solido-money.gitbook.io/solido/product-guide/solido-cash"
                >
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </Link>
              </div>

              <div className="flex flex-row justify-between  px-4 w-full mb-2">
                <p className="font-medium text-base body-text text-[#1DBDAF]">
                  Website
                </p>
                <Link target="_blank" href="https://solido.money/">
                  <Image
                    src={external}
                    alt="external link"
                    className="w-5 h-5"
                  />
                </Link>
              </div>
            </div>
            <div className="flex items-center w-full justify-around text-black gap-x-4 text-[19px] -mt-10">
              <Link target="_blank" href="https://x.com/SolidoMoney/">
                <Image src={tweet} alt="twitter" />
              </Link>
              <Link target="_blank" href="https://discord.com/invite/p25wfRVu">
                <Image src={discord} alt="discord" />
              </Link>
              <Link target="_blank" href="https://medium.com/solido-money">
                <Image src={medium} alt="medium" />
              </Link>
            </div>
          </div>
        </div>
      </Sidebar>

      <div
        className="ml-[10px] z-10 cursor-pointer"
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <GiHamburgerMenu size={42} className="text-[#1DBDAF]" />
        ) : (
          <GiHamburgerMenu size={42} className="text-[#1DBDAF] mt-[0.5rem]" />
        )}
      </div>
    </div>
  );
}
