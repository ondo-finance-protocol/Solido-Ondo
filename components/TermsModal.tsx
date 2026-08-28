"use client";
import React, { useState, useEffect, useRef } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onAccept }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Check if user has scrolled to within 10px of the bottom
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setHasScrolledToBottom(isAtBottom);
    }
  };

  useEffect(() => {
    // Reset scroll state when modal opens
    if (isOpen) {
      setHasScrolledToBottom(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#222222] border border-gray-400 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-400">
          <h2 className="text-2xl font-bold text-[#1DBDAF] font-poppins">
            Terms and Conditions
          </h2>
          <p className="text-gray-300 text-sm mt-2 font-poppins">
            Please read and accept our terms and conditions to continue
          </p>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-white font-poppins"
          style={{ maxHeight: "50vh" }}
        >
          <div className="space-y-4 text-sm leading-relaxed">
            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                1. Acceptance of Terms
              </h3>
              <p className="text-gray-300">
                By accessing and using Solido Money, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                2. Use License
              </h3>
              <p className="text-gray-300">
                Permission is granted to temporarily download one copy of Solido Money per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to decompile or reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                3. Financial Risks
              </h3>
              <p className="text-gray-300">
                Trading cryptocurrencies and using DeFi protocols involves substantial risk of loss and is not suitable for every investor. The valuation of cryptocurrencies and futures may fluctuate, and, as a result, you may lose more than your original investment. You are responsible for all the risks and financial resources you use and for the chosen trading strategy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                4. Platform Usage
              </h3>
              <p className="text-gray-300">
                Solido is a decentralized finance (DeFi) protocol that allows users to collateralize assets and mint stablecoins. Users are responsible for understanding the risks associated with smart contracts, blockchain technology, and cryptocurrency markets before using the platform.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                5. Disclaimer
              </h3>
              <p className="text-gray-300">
                The materials on Solido are provided on an &apos;as is&apos; basis. Solido makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                6. Limitations of Liability
              </h3>
              <p className="text-gray-300">
                In no event shall Solido or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Solido, even if Solido or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                7. Privacy Policy
              </h3>
              <p className="text-gray-300">
                Your privacy is important to us. We collect minimal data necessary for the operation of our services. We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-[#1DBDAF] mb-2">
                8. Changes to Terms
              </h3>
              <p className="text-gray-300">
                Solido reserves the right to revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <div className="mt-8 p-4 bg-[#1DBDAF] bg-opacity-10 border border-[#1DBDAF] rounded">
              <p className="text-[#1DBDAF] font-semibold">
                ✓ You have reached the end of the Terms and Conditions
              </p>
              <p className="text-gray-300 text-sm mt-1">
                You can now accept these terms to continue using Solido Money.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-400 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                hasScrolledToBottom ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-300 font-poppins">
              {hasScrolledToBottom
                ? "You have read all terms"
                : "Please scroll to the bottom to continue"}
            </span>
          </div>
          <button
            onClick={onAccept}
            disabled={!hasScrolledToBottom}
            className={`px-6 py-2 rounded font-poppins font-medium transition-all duration-200 ${
              hasScrolledToBottom
                ? "bg-[#1DBDAF] text-black hover:bg-[#17a394] cursor-pointer"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;