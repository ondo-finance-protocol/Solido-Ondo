import { Dialog } from "primereact/dialog";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import conf from "../../assets/images/Loader 1.gif";
import tick from "../../assets/images/Done_Solido.gif";
import rej from "../../assets/images/TxnError.gif";
import arrow from "../../assets/arrow.svg";

interface TransactionModalProps {
  visible: boolean;
  onHide: () => void;
  loadingMessage: string;
  isSuccess: boolean;
  transactionRejected: boolean;
  hash: string;
  userInputs: {
    collateral: string;
    borrow: string;
  };
  displayValue: string;
  showCloseButton: boolean;
  handleClose: () => void;
}

export const TransactionModal = ({
  visible,
  onHide,
  loadingMessage,
  isSuccess,
  transactionRejected,
  hash,
  userInputs,
  displayValue,
  showCloseButton,
  handleClose,
}: TransactionModalProps) => {
  const shortenedHash = hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : "";

  return (
    <Dialog visible={visible} onHide={onHide}>
      <div className="dialog-overlay flex items-center justify-center">
        <div
          className="dialog-content w-[90%] max-w-[360px] bg-[#222222] p-6 flex flex-col justify-around"
          style={{ height: "450px" }}
        >
          <div className="p-5">
            {loadingMessage === "Waiting for transaction to confirm.." ? (
              <>
                <Image
                  src={conf || "/placeholder.svg"}
                  alt="rectangle"
                  width={150}
                />
                <div className="my-5 ml-[6rem] mt-12"></div>
                <div className="waiting-message font-poppins font-bold text-[#014774]">
                  {loadingMessage}
                </div>
              </>
            ) : loadingMessage === "Trove opened successfully" ? (
              <>
                <Image
                  src={tick || "/placeholder.svg"}
                  alt="tick"
                  width={150}
                />
                <div className="waiting-message font-poppins font-bold text-[#014774]">
                  {loadingMessage}
                </div>
                <div className="text-black w-full mt-4 bg-[#ECEEEF] flex text-sm flex-col p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#618BA6] font-medium text-sm">
                      You deposited:
                    </span>
                    <span className="text-[#014774] font-medium text-sm">
                      {userInputs.collateral} {displayValue}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#618BA6] font-medium text-sm">
                      You borrowed:
                    </span>
                    <span className="text-[#014774] font-medium text-sm">
                      {userInputs.borrow} CASH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#618BA6] font-medium text-sm">
                      Transaction hash:
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#014774] font-medium text-sm">
                        {shortenedHash}
                      </span>
                      <Link
                        href={`https://suprascan.io/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src={arrow || "/placeholder.svg"}
                          alt="copy"
                          className="h-4 cursor-pointer"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : transactionRejected ? (
              <>
                <Image
                  src={rej || "/placeholder.svg"}
                  alt="rejected"
                  width={150}
                />
                <div className="my-5 ml-[6rem] mb-5"></div>
                <div className="waiting-message font-poppins font-bold text-[#014774]">
                  {loadingMessage}
                </div>
              </>
            ) : (
              <Image src={conf || "/placeholder.svg"} alt="box" width={150} />
            )}

            {isSuccess && (
              <button
                className="mt-[8px] p-3 w-full text-white font-poppins font-bold hover:bg-[#155984] bg-[#014774]"
                onClick={handleClose}
              >
                Close
              </button>
            )}
            {(transactionRejected || (!isSuccess && showCloseButton)) && (
              <>
                <p className="font-poppins text-[#014774] text-xs mt-2 mb-4">
                  {transactionRejected
                    ? "Transaction was rejected. Please try again."
                    : "Some Error Occurred On Network Please Try Again After Some Time.. 🤖"}
                </p>
                <Button
                  className="mt-0.5 p-3 hover:bg-[#014774] font-bold rounded-none md:w-[14rem] text-white font-poppins bg-[#014774]"
                  onClick={handleClose}
                >
                  Try again
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
