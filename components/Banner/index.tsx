"use client";
import React from 'react';
import "../../app/App.css";

const Banner: React.FC = () => {
  return (
    <div className="sticky-banner hidden md:block bg-yellow-300 h-12">
      <div className="flexBanner">
        <div className='mobile-banner-text redHatFont fnt_wgt_500 flexT'>
            <span className='whitespace-nowrap body-text text-lg bckgrnd_img_card_fnt mobile-banner-text text-wrap'>
              We are currently experiencing network issues. The testnet will be live soon...🤖
            </span>
        </div>
      </div>
    </div>
  );
};
export default Banner;