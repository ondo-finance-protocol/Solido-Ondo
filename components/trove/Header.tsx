import Image from "next/image";
import floatpusd1 from "../../assets/images/Group 1086.png";
import floatpusd2 from "../../assets/images/Group 1088.png";
import xion from "../../assets/images/Unknown 1.png";

export const Header = () => {
  return (
    <div className="p-4 md:pt-2">
      <div
        className="shadow-lg md:w-full m-2"
        style={{ backgroundColor: "#014774" }}
      >
        <div className="md:container flex flex-col md:flex-row justify-between">
          <div className="hidden md:block">
            <Image
              src={floatpusd2 || "/placeholder.svg"}
              alt="home"
              className="md:ml-0 ml-[20%]"
            />
          </div>
          <div className="flex flex-col items-center">
            <h6 className="text-center font-poppins font-medium text-2xl md:text-[27px] text-white mb-2 mt-4">
              You don&apos;t have an existing trove.{" "}
            </h6>
            <div className="flex flex-col items-center md:flex-row">
              <h6 className="font-poppins text-center font-medium text-lg text-white mb-2 md:mb-0 md:mr-1">
                Mint $CASH stablecoin by depositing{" "}
              </h6>
              <Image
                src={xion || "/placeholder.svg"}
                alt="home"
                height={20}
                className="md:-mt-1 inline-block"
              />
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src={floatpusd1 || "/placeholder.svg"}
              alt="home"
              className="md:ml-0 ml-[20%]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
