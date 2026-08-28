import React from "react";
import { Dialog } from "primereact/dialog";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import lstBackground from "@/app/assets/pop_up/Popup banner.png";

interface LSTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStakeNow: () => void;
}

const LSTModal: React.FC<LSTModalProps> = ({ isOpen, onClose, onStakeNow }) => {
  const handleStakeClick = () => {
    onStakeNow();
    onClose();
  };

  return (
    <>
      {/* Custom backdrop with Tailwind */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1049]" />
      )}

      <Dialog
        visible={isOpen}
        onHide={onClose}
        modal
        closable={false}
        className="!bg-transparent !border-none !shadow-none"
        maskClassName="!bg-transparent"
        style={{
          width: "80vw",
          maxWidth: "500px",
        }}
        contentClassName="!bg-transparent !border-none !p-0 !rounded-2xl !overflow-hidden"
      >
        <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Background Image */}
          <div className="relative">
            <Image
              src={lstBackground}
              alt="LST promotional banner"
              className="w-full h-auto max-w-full"
              priority
            />
          </div>

          {/* Text Content Below Image */}
          <div className="relative z-10 p-8 text-center bg-[#272727]">
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-medium text-[#1DBDAF]">
                Supra&apos;s first LST is live
              </h2>

              <div className="space-y-2">
                <p className="text-white text-base font-normal">
                  Earn 8% APY + Boosted Solido Points.
                </p>
                <p className="text-white text-base font-normal">
                  Get stSUPRA that you can use in DeFi.
                </p>
              </div>

              {/* CTA Button */}
              <div className="flex w-full justify-center items-center pt-4">
                <Button
                  onClick={handleStakeClick}
                  className="w-[178px] h-[51px] bg-gradient-to-r from-[#1DBDAF] via-[#1DBDAF] to-white text-black font-semibold text-base rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(90deg, #1DBDAF 51.22%, #FFFFFF 135.36%)",
                  }}
                >
                  STAKE NOW
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default LSTModal;
