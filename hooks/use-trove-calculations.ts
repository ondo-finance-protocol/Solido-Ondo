"use client";

import { useState, useEffect } from "react";

interface TroveCalculations {
  maxBorrow: number;
  loanToValue: number;
  liquidationPrice: number;
  expectedFee: number;
  expectedDebt: number;
  collateralRatio: number;
  totalCollateral: number;
}

/**
 * Hook to calculate trove-related values based on user inputs
 * @param collateralAmount - Amount of collateral the user wants to deposit
 * @param borrowAmount - Amount of stablecoin the user wants to borrow
 * @param fetchedPrice - Current price of the collateral token
 * @param mcr - Minimum Collateralization Ratio
 * @param borrowRate - Borrowing fee rate
 * @param lr - Liquidation Reserve
 * @returns Object containing calculated trove values
 */
export function useTroveCalculations(
  collateralAmount: string,
  borrowAmount: string,
  fetchedPrice: number,
  mcr: number,
  borrowRate: number,
  lr: number
) {
  const [calculations, setCalculations] = useState<TroveCalculations>({
    maxBorrow: 0,
    loanToValue: 0,
    liquidationPrice: 0,
    expectedFee: 0,
    expectedDebt: 0,
    collateralRatio: 0,
    totalCollateral: 0,
  });

  useEffect(() => {
    const makeCalculations = () => {
      try {
        const collValue = Number(collateralAmount) || 0;
        const borrowValue = Number(borrowAmount) || 0;

        // Calculate total collateral value in USD
        const totalCollateralValue = collValue * fetchedPrice;

        // Calculate MCR as a decimal
        const divideBy = Number(mcr) / 100;

        // Calculate max borrow amount
        const maxBorrow =
          (totalCollateralValue / divideBy - lr) / (1 + borrowRate);

        // Calculate expected fee
        const expectedFee = borrowRate * borrowValue;

        // Calculate expected total debt
        const expectedDebt = borrowValue + expectedFee + lr;

        // Calculate loan-to-value ratio
        const loanToValue = (expectedDebt * 100) / (totalCollateralValue || 1);

        // Calculate liquidation price
        const liquidationPrice = (divideBy * expectedDebt) / (collValue || 1);

        // Calculate collateral ratio
        const collateralRatio =
          (collValue * fetchedPrice * 100) / (expectedDebt || 1);

        setCalculations({
          maxBorrow: Math.max(0, maxBorrow),
          loanToValue,
          liquidationPrice,
          expectedFee,
          expectedDebt,
          collateralRatio,
          totalCollateral: totalCollateralValue,
        });
      } catch (error) {
        console.error("Error in trove calculations:", error);
      }
    };

    makeCalculations();
  }, [collateralAmount, borrowAmount, fetchedPrice, mcr, borrowRate, lr]);

  return calculations;
}
