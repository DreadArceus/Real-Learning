'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface RegisterFormProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  privacyPolicyAccepted: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function RegisterForm({ onBackToLogin, onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    privacyPolicyAccepted: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.username.trim()) {
      return 'Username is required';
    }
    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!formData.password) {
      return 'Password is required';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (!formData.privacyPolicyAccepted) {
      return 'You must accept the privacy policy to register';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          privacyPolicyAccepted: formData.privacyPolicyAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 text-green-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Account Created!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Your viewer account has been created successfully.
            </p>
            <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
              Redirecting you to login...
            </p>
            <LoadingSpinner message="" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign up for a viewer account to track your status
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                At least 3 characters, no spaces
              </p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                At least 6 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <div className="flex items-start space-x-3">
                <input
                  id="privacyPolicy"
                  name="privacyPolicyAccepted"
                  type="checkbox"
                  checked={formData.privacyPolicyAccepted}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    privacyPolicyAccepted: e.target.checked
                  }))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="text-sm">
                  <label htmlFor="privacyPolicy" className="text-gray-700 dark:text-gray-300">
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                    >
                      Privacy Policy
                    </button>
                    {' '}and agree to the collection and processing of my data as described.
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required to create an account. Click to view the full policy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className="flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner message="" />
                  <span className="ml-2">Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onBackToLogin}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">Account Benefits:</p>
              <ul className="text-xs space-y-1">
                <li>✓ Track your water intake and mood</li>
                <li>✓ View your status history</li>
                <li>✓ Read-only access to data</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                Note: Only admins can update status data
              </p>
            </div>
          </div>
        </form>
      </div>

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onAccept={() => {
          setFormData(prev => ({
            ...prev,
            privacyPolicyAccepted: true
          }));
          setShowPrivacyModal(false);
        }}
        onDecline={() => {
          setShowPrivacyModal(false);
        }}
      />
    </div>
  );
}