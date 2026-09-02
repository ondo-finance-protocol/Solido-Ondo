// hooks/useTermsAcceptance.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { TERMS_CONFIG, termsUtils } from "../lib/termsConfig";

export const useTermsAcceptance = (walletAddress?: string | null) => {
  // General terms state
  // const [generalTermsAccepted, setGeneralTermsAccepted] = useState<boolean>(true);
  // const [shouldShowGeneralTerms, setShouldShowGeneralTerms] = useState<boolean>(false);
  
  // Investor terms state
  const [investorTermsAccepted, setInvestorTermsAccepted] = useState<boolean>(true);
  const [shouldShowInvestorTerms, setShouldShowInvestorTerms] = useState<boolean>(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ✅ IMPROVED: Better state checking function
  const checkTermsAcceptance = useCallback(() => {
    // If no wallet is connected, don't show any terms
    if (!walletAddress || walletAddress === "undefined") {
      // setGeneralTermsAccepted(true);
      setInvestorTermsAccepted(true);
      // setShouldShowGeneralTerms(false);
      setShouldShowInvestorTerms(false);
      setIsLoading(false);
      return;
    }

    try {
      // Check general terms requirement
      // const needsGeneralTerms = termsUtils.shouldRequireGeneralTerms(walletAddress);
      const needsInvestorTerms = termsUtils.shouldRequireInvestorTerms(walletAddress);

      // ✅ IMPROVED: More reliable status checking
      // if (needsGeneralTerms) {
      //   setShouldShowGeneralTerms(true);
      //   const generalStatus = termsUtils.getGeneralTermsStatus(walletAddress);
      //   setGeneralTermsAccepted(generalStatus.accepted);
      // } else {
      //   setShouldShowGeneralTerms(false);
      //   setGeneralTermsAccepted(true);
      // }

      if (needsInvestorTerms) {
        setShouldShowInvestorTerms(true);
        const investorStatus = termsUtils.getInvestorTermsStatus(walletAddress);
        setInvestorTermsAccepted(investorStatus.accepted);
      } else {
        setShouldShowInvestorTerms(false);
        setInvestorTermsAccepted(true);
      }

    } catch (error) {
      console.warn("Error checking terms acceptance:", error);
      // On error, default to not showing terms
      // setGeneralTermsAccepted(true);
      setInvestorTermsAccepted(true);
      // setShouldShowGeneralTerms(false);
      setShouldShowInvestorTerms(false);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // ✅ IMPROVED: Effect with proper cleanup and debouncing
  useEffect(() => {
    // Reset loading when wallet changes
    setIsLoading(true);
    
    // Small delay to prevent rapid re-renders during wallet switching
    const timeoutId = setTimeout(() => {
      checkTermsAcceptance();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [checkTermsAcceptance]);

  // ✅ IMPROVED: Better accept functions with immediate state updates
  const acceptGeneralTerms = useCallback(() => {
    if (!walletAddress || walletAddress === "undefined") return;
    
    try {
      // Save to storage first
      termsUtils.saveGeneralTermsAcceptance(walletAddress);
      
      // Update local state immediately
      // setGeneralTermsAccepted(true);
      
      // Log for debugging
    } catch (error) {
      console.warn("Could not save general terms acceptance:", error);
      // Still update local state for better UX
      // setGeneralTermsAccepted(true);
    }
  }, [walletAddress]);

  const acceptInvestorTerms = useCallback(() => {
    if (!walletAddress || walletAddress === "undefined") return;
    
    try {
      // Save to storage first
      termsUtils.saveInvestorTermsAcceptance(walletAddress);
      
      // Update local state immediately
      setInvestorTermsAccepted(true);
      
      // Log for debugging
    } catch (error) {
      console.warn("Could not save investor terms acceptance:", error);
      // Still update local state for better UX
      setInvestorTermsAccepted(true);
    }
  }, [walletAddress]);

  // ✅ NEW: Reset functions for testing/debugging
  const resetGeneralTerms = useCallback((address?: string) => {
    const targetAddress = address || walletAddress;
    if (!targetAddress || targetAddress === "undefined") return;
    
    termsUtils.clearGeneralTermsForAddress(targetAddress);
    
    if (targetAddress === walletAddress) {
      // setGeneralTermsAccepted(false);
    }
  }, [walletAddress]);

  const resetInvestorTerms = useCallback((address?: string) => {
    const targetAddress = address || walletAddress;
    if (!targetAddress || targetAddress === "undefined") return;
    
    termsUtils.clearInvestorTermsForAddress(targetAddress);
    
    if (targetAddress === walletAddress) {
      setInvestorTermsAccepted(false);
    }
  }, [walletAddress]);

  // ✅ IMPROVED: Better modal determination logic
  const getCurrentModal = useCallback((): 'none' | 'general' | 'investor' => {
    // Don't show any modals while loading
    if (isLoading) return 'none';
    
    // Don't show modals if no wallet connected
    if (!walletAddress || walletAddress === "undefined") return 'none';
    
    // Show general terms first if required and not accepted
    // if (shouldShowGeneralTerms && !generalTermsAccepted) {
    //   return 'general';
    // }
    
    // Show investor terms if general terms are done and investor terms not accepted
    if (shouldShowInvestorTerms && !investorTermsAccepted) {
      return 'investor';
    }
    
    return 'none';
  }, [isLoading, walletAddress, shouldShowInvestorTerms, investorTermsAccepted]);

  // ✅ IMPROVED: Better completion check
  const allTermsCompleted = useCallback((): boolean => {
    // If loading, consider not completed
    if (isLoading) return false;
    
    // If no wallet, consider completed
    if (!walletAddress || walletAddress === "undefined") return true;
    
    // Check each required term
    // if (shouldShowGeneralTerms && !generalTermsAccepted) return false;
    if (shouldShowInvestorTerms && !investorTermsAccepted) return false;
    
    return true;
  }, [isLoading, walletAddress, shouldShowInvestorTerms, investorTermsAccepted]);

  return {
    // General terms
    // generalTermsAccepted,
    // shouldShowGeneralTerms,
    acceptGeneralTerms,
    resetGeneralTerms,
    
    // Investor terms
    investorTermsAccepted,
    shouldShowInvestorTerms,
    acceptInvestorTerms,
    resetInvestorTerms,
    
    // Overall state
    isLoading,
    currentModal: getCurrentModal(),
    allTermsCompleted: allTermsCompleted(),
    
    // Force re-check (useful after storage operations)
    recheckTerms: checkTermsAcceptance,
  };
};