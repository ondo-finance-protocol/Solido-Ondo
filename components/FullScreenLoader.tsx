import React from "react";
import "../app/App.css";
type Props = {};

const FullScreenLoader = (props: Props) => {
  return (
    <div className="w-full h-screen bg-black flex justify-center items-center">
      <div className="loader  ease-linear rounded-full border-8 border-t-8 h-24 w-24 animate-color-change"></div>
    </div>
  );
};

export default FullScreenLoader;
