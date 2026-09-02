// lib/termsConfig.ts
"use client";

// Configuration for which addresses should see which modals
export const TERMS_CONFIG = {
  // Version of general terms - increment this to force re-acceptance for all users
  GENERAL_TERMS_VERSION: "2.0",
  
  // Version of investor terms - increment this to force re-acceptance for investors
  INVESTOR_TERMS_VERSION: "1.0",
  
  // Set to true to require general terms for ALL users, false to skip general terms
  REQUIRE_GENERAL_TERMS_FOR_ALL: true,
  
  // Set behavior for terms display:
  // "once" - show only once per version (persistent localStorage) - CHANGED FROM "session"
  // "session" - show once per browser session (sessionStorage)
  // "always" - show every time (no storage)
  TERMS_BEHAVIOR: "once" as "once" | "session" | "always", // ✅ FIXED: Changed from "session" to "once"
  
  // List of wallet addresses that should see the investor modal (after general terms)
  // Add addresses in lowercase for consistency
  INVESTOR_ADDRESSES: [
    "0x2b6b17ad86e96710a0a0ca32ec4c6d78bddcbf543dee9fdbd99b5f74c2cc0f76",
    "0xca1934f7746dc63318e1624a82e43188b08b3558ab3eb74a215bce17b6b0e95b",
    "0x1234567890abcdef1234567890abcdef12345678", // Example investor address 1
    "0xabcdef1234567890abcdef1234567890abcdef12", // Example investor address 2
    "0x9876543210fedcba9876543210fedcba98765432", // Example investor address 3
    // Add more investor addresses here as needed
  ],
};

// ✅ IMPROVED: Better session cache management with proper cleanup
const sessionCache = {
  generalTermsAccepted: new Set<string>(),
  investorTermsAccepted: new Set<string>(),
  
  addGeneralAcceptance: (address: string) => {
    sessionCache.generalTermsAccepted.add(address.toLowerCase());
  },
  
  addInvestorAcceptance: (address: string) => {
    sessionCache.investorTermsAccepted.add(address.toLowerCase());
  },
  
  hasGeneralAcceptance: (address: string): boolean => {
    return sessionCache.generalTermsAccepted.has(address.toLowerCase());
  },
  
  hasInvestorAcceptance: (address: string): boolean => {
    return sessionCache.investorTermsAccepted.has(address.toLowerCase());
  },
  
  clearAll: () => {
    sessionCache.generalTermsAccepted.clear();
    sessionCache.investorTermsAccepted.clear();
  },
  
  // ✅ NEW: Method to remove specific address from cache
  removeAddress: (address: string) => {
    const lowerAddress = address.toLowerCase();
    sessionCache.generalTermsAccepted.delete(lowerAddress);
    sessionCache.investorTermsAccepted.delete(lowerAddress);
  }
};

// Utility functions for managing terms
export const termsUtils = {
  /**
   * Check if an address should see the general terms modal
   */
  shouldRequireGeneralTerms: (address?: string | null): boolean => {
    if (!TERMS_CONFIG.REQUIRE_GENERAL_TERMS_FOR_ALL) {
      return false;
    }
    return !!address && address !== "undefined";
  },

  /**
   * Check if an address should see the investor terms modal
   */
  shouldRequireInvestorTerms: (address?: string | null): boolean => {
    if (!address || address === "undefined") return false;
    return TERMS_CONFIG.INVESTOR_ADDRESSES.includes(address.toLowerCase());
  },

  /**
   * Add a new address to the investor list (for dynamic management)
   */
  addInvestorAddress: (address: string): void => {
    const lowerAddress = address.toLowerCase();
    if (!TERMS_CONFIG.INVESTOR_ADDRESSES.includes(lowerAddress)) {
      TERMS_CONFIG.INVESTOR_ADDRESSES.push(lowerAddress);
    }
  },

  /**
   * Remove an address from the investor list
   */
  removeInvestorAddress: (address: string): void => {
    const lowerAddress = address.toLowerCase();
    const index = TERMS_CONFIG.INVESTOR_ADDRESSES.indexOf(lowerAddress);
    if (index > -1) {
      TERMS_CONFIG.INVESTOR_ADDRESSES.splice(index, 1);
    }
  },

  /**
   * Get the current list of investor addresses
   */
  getInvestorAddresses: (): string[] => {
    return [...TERMS_CONFIG.INVESTOR_ADDRESSES];
  },

  /**
   * Get storage based on terms behavior
   */
  getStorage: () => {
    if (typeof window === "undefined") return null;
    
    switch (TERMS_CONFIG.TERMS_BEHAVIOR) {
      case "once":
        return localStorage; // ✅ Will use localStorage for persistent storage
      case "session":
        return sessionStorage;
      case "always":
        return null;
      default:
        return localStorage; // ✅ FIXED: Default to localStorage instead of sessionStorage
    }
  },

  /**
   * Clear general terms acceptance for a specific address
   */
  clearGeneralTermsForAddress: (address: string): void => {
    const storage = termsUtils.getStorage();
    if (storage) {
      try {
        const storageKey = `solido_general_terms_${address.toLowerCase()}`;
        storage.removeItem(storageKey);
      } catch (error) {
        console.warn("Could not clear general terms for address:", error);
      }
    }
    
    // Also clear from session cache
    sessionCache.generalTermsAccepted.delete(address.toLowerCase());
  },

  /**
   * Clear investor terms acceptance for a specific address
   */
  clearInvestorTermsForAddress: (address: string): void => {
    const storage = termsUtils.getStorage();
    if (storage) {
      try {
        const storageKey = `solido_investor_terms_${address.toLowerCase()}`;
        storage.removeItem(storageKey);
      } catch (error) {
        console.warn("Could not clear investor terms for address:", error);
      }
    }
    
    // Also clear from session cache
    sessionCache.investorTermsAccepted.delete(address.toLowerCase());
  },

  /**
   * Clear all terms acceptance for all addresses (useful for testing)
   */
  clearAllTerms: (): void => {
    const storage = termsUtils.getStorage();
    if (storage) {
      try {
        const keys = Object.keys(storage);
        keys.forEach(key => {
          if (key.startsWith('solido_general_terms_') || key.startsWith('solido_investor_terms_')) {
            storage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn("Could not clear all terms:", error);
      }
    }
    
    // Also clear session cache
    sessionCache.clearAll();
  },

  /**
   * ✅ IMPROVED: Better general terms status check with proper localStorage handling
   */
  getGeneralTermsStatus: (address: string): { accepted: boolean; version?: string } => {
    // If showing terms always, never consider them accepted
    if (TERMS_CONFIG.TERMS_BEHAVIOR === "always") {
      return { accepted: false };
    }

    const storage = termsUtils.getStorage();
    if (!storage) return { accepted: false };

    try {
      const storageKey = `solido_general_terms_${address.toLowerCase()}`;
      const acceptedVersion = storage.getItem(storageKey);
      
      const isAccepted = acceptedVersion === TERMS_CONFIG.GENERAL_TERMS_VERSION;
      
      // ✅ IMPROVED: Only add to session cache if actually accepted in storage
      if (isAccepted && !sessionCache.hasGeneralAcceptance(address)) {
        sessionCache.addGeneralAcceptance(address);
      }
      
      return {
        accepted: isAccepted,
        version: acceptedVersion || undefined,
      };
    } catch (error) {
      console.warn("Could not get general terms status:", error);
      return { accepted: false };
    }
  },

  /**
   * ✅ IMPROVED: Better investor terms status check with proper localStorage handling
   */
  getInvestorTermsStatus: (address: string): { accepted: boolean; version?: string } => {
    // If showing terms always, never consider them accepted
    if (TERMS_CONFIG.TERMS_BEHAVIOR === "always") {
      return { accepted: false };
    }

    const storage = termsUtils.getStorage();
    if (!storage) return { accepted: false };

    try {
      const storageKey = `solido_investor_terms_${address.toLowerCase()}`;
      const acceptedVersion = storage.getItem(storageKey);
      
      const isAccepted = acceptedVersion === TERMS_CONFIG.INVESTOR_TERMS_VERSION;
      
      // ✅ IMPROVED: Only add to session cache if actually accepted in storage
      if (isAccepted && !sessionCache.hasInvestorAcceptance(address)) {
        sessionCache.addInvestorAcceptance(address);
      }
      
      return {
        accepted: isAccepted,
        version: acceptedVersion || undefined,
      };
    } catch (error) {
      console.warn("Could not get investor terms status:", error);
      return { accepted: false };
    }
  },

  /**
   * ✅ IMPROVED: Better save function with immediate cache update
   */
  saveGeneralTermsAcceptance: (address: string): void => {
    const storage = termsUtils.getStorage();
    if (!storage) {
      // If no storage available, at least cache for this session
      sessionCache.addGeneralAcceptance(address);
      return;
    }

    try {
      const storageKey = `solido_general_terms_${address.toLowerCase()}`;
      storage.setItem(storageKey, TERMS_CONFIG.GENERAL_TERMS_VERSION);
      
      // Add to session cache for immediate access
      sessionCache.addGeneralAcceptance(address);
    } catch (error) {
      console.warn("Could not save general terms acceptance:", error);
      // Still cache for this session even if storage fails
      sessionCache.addGeneralAcceptance(address);
    }
  },

  /**
   * ✅ IMPROVED: Better save function with immediate cache update
   */
  saveInvestorTermsAcceptance: (address: string): void => {
    const storage = termsUtils.getStorage();
    if (!storage) {
      // If no storage available, at least cache for this session
      sessionCache.addInvestorAcceptance(address);
      return;
    }

    try {
      const storageKey = `solido_investor_terms_${address.toLowerCase()}`;
      storage.setItem(storageKey, TERMS_CONFIG.INVESTOR_TERMS_VERSION);
      
      // Add to session cache for immediate access
      sessionCache.addInvestorAcceptance(address);
    } catch (error) {
      console.warn("Could not save investor terms acceptance:", error);
      // Still cache for this session even if storage fails
      sessionCache.addInvestorAcceptance(address);
    }
  },

  /**
   * Check if address has completed all required terms
   */
  hasCompletedAllRequiredTerms: (address?: string | null): boolean => {
    if (!address || address === "undefined") return true;

    // If showing terms always, never consider them completed
    if (TERMS_CONFIG.TERMS_BEHAVIOR === "always") {
      return false;
    }

    // Check general terms if required
    if (termsUtils.shouldRequireGeneralTerms(address)) {
      const generalStatus = termsUtils.getGeneralTermsStatus(address);
      if (!generalStatus.accepted) return false;
    }

    // Check investor terms if required
    if (termsUtils.shouldRequireInvestorTerms(address)) {
      const investorStatus = termsUtils.getInvestorTermsStatus(address);
      if (!investorStatus.accepted) return false;
    }

    return true;
  },

  // ✅ NEW: Helper method to clear session cache when wallet disconnects
  clearSessionCacheForAddress: (address: string): void => {
    sessionCache.removeAddress(address);
  },

  // ✅ NEW: Debug helper to check what's stored
  debugStorage: (address: string): void => {
    if (typeof window === "undefined") {
      return;
    }
    
    const storage = termsUtils.getStorage();
    if (!storage) {
      return;
    }

    const generalKey = `solido_general_terms_${address.toLowerCase()}`;
    const investorKey = `solido_investor_terms_${address.toLowerCase()}`;
  },
};

// Export for use in components
export default TERMS_CONFIG;