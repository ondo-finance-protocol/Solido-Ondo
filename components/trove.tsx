"use client";
import { useCollDetails } from "@/hooks/use-coll-details";
import { useTrovePositions } from "@/hooks/use-trove-position";

// Import assets
import supra from "@/app/assets/images/SUPRA.png";
import tbtc from "@/app/assets/images/flow/stSupra.png";
import { TroveCard } from "./trove/trove-cards";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrovePage() {
  const {
    btcDebt,
    supraDebt,
    btcConfig,
    supraConfig,
    isLoading,

    calculateMaxLtv,
  } = useCollDetails();
  const { supraTroveStatus, stSupraTroveStatus } = useTrovePositions();

  return (
    <div className="mt-6 mb-6">
      {/* Trove Cards Section */}
      <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-12 mt-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[500px] w-[431px]" />
            <Skeleton className="h-[500px] w-[431px]" />
          </>
        ) : (
          <>
            <TroveCard
              title="stSUPRA Trove"
              assest="stSUPRA"
              logo={tbtc}
              config={
                btcConfig
                  ? {
                      maxLtv: calculateMaxLtv(btcConfig),
                      borrowRate: btcConfig.borrowRate,
                      minDebt: btcConfig.minDebt,
                      price: btcConfig.price,
                      systemCollRatio: btcConfig.systemCollRatio,
                    }
                  : null
              }
              circleMinted={btcDebt}
              maxMint={btcConfig?.maxMint}
              isLoading={isLoading}
              status={stSupraTroveStatus}
              href="/borrow/stsupra"
            />

            <TroveCard
              title="SUPRA Trove"
              assest="SUPRA"
              logo={supra}
              config={
                supraConfig
                  ? {
                      maxLtv: calculateMaxLtv(supraConfig),
                      borrowRate: supraConfig.borrowRate,
                      minDebt: supraConfig.minDebt,
                      price: supraConfig.price,
                      systemCollRatio: supraConfig.systemCollRatio,
                    }
                  : null
              }
              circleMinted={supraDebt}
              maxMint={supraConfig?.maxMint}
              isLoading={isLoading}
              status={supraTroveStatus}
              href="/borrow/supra"
            />
          </>
        )}
      </div>
    </div>
  );
}
