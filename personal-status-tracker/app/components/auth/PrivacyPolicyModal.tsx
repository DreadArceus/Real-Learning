'use client';

import React, { useState, useEffect } from 'react';

interface PrivacyPolicySection {
  title: string;
  content: string[];
}

interface PrivacyPolicyData {
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  content: {
    title: string;
    sections: PrivacyPolicySection[];
  };
}

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onAccept,
  onDecline
}) => {
  const [policyData, setPolicyData] = useState<PrivacyPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPrivacyPolicy();
    }
  }, [isOpen]);

  const fetchPrivacyPolicy = async () => {
    try {
      const response = await fetch('/api/privacy/policy');
      const result = await response.json();
      if (result.success) {
        setPolicyData(result.data);
      }
    } catch (error) {
      // Silently handle error - policy will show default content
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h2>
          {policyData && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Version {policyData.version} • Effective {policyData.effectiveDate}
            </p>
          )}
        </div>

        {/* Content */}
        <div 
          className="px-6 py-4 overflow-y-auto flex-1"
          onScroll={handleScroll}
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : policyData ? (
            <div className="space-y-6">
              {policyData.content.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Failed to load privacy policy. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!hasScrolledToBottom && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Please scroll to the bottom to read the full policy
              </p>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onDecline}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              disabled={!hasScrolledToBottom}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasScrolledToBottom
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};