import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

export function LoadingSpinner({ size = 'md', message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh]" role="status">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-blue-600`} />
      <span className="mt-2 text-gray-600 dark:text-gray-400">{message}</span>
      <span className="sr-only">{message}</span>
    </div>
  );
}