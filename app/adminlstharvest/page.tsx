"use client";
import React from "react";
import LSTHarvestDashboard from "@/components/lstHarvestAdmin/LSTHarvestDashboard";

export default function AdminLSTHarvestPage() {
  return (
    <div className="grid h-screen mainT w-full grid-cols-[max-content_1fr] overflow text-white">
      <div className="body text-black overflow-y-scroll">
        <LSTHarvestDashboard />
      </div>
    </div>
  );
}
