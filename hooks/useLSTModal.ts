import { useState, useEffect } from 'react';

interface UseLSTModalResult {
  isLSTModalOpen: boolean;
  isLoading: boolean;
  closeLSTModal: () => void;
  handleStakeNow: () => void;
}

export const useLSTModal = (account: string | null): UseLSTModalResult => {
  const [isLSTModalOpen, setIsLSTModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only show modal when user is connected and on dashboard
    if (account && account !== "undefined") {
      const currentTime = new Date().getTime();
      const modalKey = `lstModal_${account}`;
      const lastShownTime = localStorage.getItem(modalKey);
      
      let shouldShowModal = false;
      
      if (!lastShownTime) {
        // First time user - show modal
        shouldShowModal = true;
      } else {
        // Check if 4 hours have passed since last shown
        const timeDifference = currentTime - parseInt(lastShownTime);
        const fourHoursInMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        
        if (timeDifference >= fourHoursInMs) {
          shouldShowModal = true;
        }
      }
      
      if (shouldShowModal) {
        // Show modal after a short delay for better UX
        const timer = setTimeout(() => {
          setIsLSTModalOpen(true);
          setIsLoading(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [account]);

  const closeLSTModal = () => {
    setIsLSTModalOpen(false);
    
    // Update the timestamp when user closes the modal
    if (account && account !== "undefined") {
      const currentTime = new Date().getTime();
      localStorage.setItem(`lstModal_${account}`, currentTime.toString());
    }
  };

  const handleStakeNow = () => {
    // Update timestamp when user clicks stake now
    if (account && account !== "undefined") {
      const currentTime = new Date().getTime();
      localStorage.setItem(`lstModal_${account}`, currentTime.toString());
    }
    
    // Navigate to stake page
    if (typeof window !== 'undefined') {
      window.location.href = '/stake';
    }
  };

  return {
    isLSTModalOpen,
    isLoading,
    closeLSTModal,
    handleStakeNow,
  };
};