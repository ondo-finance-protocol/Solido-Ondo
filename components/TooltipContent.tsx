import React from "react";
import "./Tooltip.css";
import "../app/App.css";

const TooltipContent = () => (
  <div className="tooltip-content z-10 ">
    <p className="font-poppins z-10 font-medium text-sm whitespace-nowrap ">
      Total Collateral Ratio of the protocol
      {/* and it is: */}
    </p>
    {/* <ul className="pt-6 space-y-1 z-10">
      <li className="font-poppins font-medium text-xs">
        <span
          className="font-medium"
          style={{ color: "red", fontWeight: "bold" }}
        >
          red
        </span>{" "}
        – Less than 150% – recovery
      </li>

      <li className="font-poppins font-medium text-xs">
        <span
          className="font-medium"
          style={{ color: "yellow", fontWeight: "bold" }}
        >
          yellow
        </span>{" "}
        – between 150% and 200% – normal
      </li>
      <li className="font-poppins font-medium text-xs">
        <span
          className="font-medium"
          style={{ color: "green", fontWeight: "bold" }}
        >
          green
        </span>{" "}
        – above 200% – healthy
      </li>
    </ul> */}
  </div>
);

export default TooltipContent;
