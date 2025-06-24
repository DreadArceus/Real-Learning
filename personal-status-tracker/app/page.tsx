'use client';

import React from 'react';
import { WaterIntakeCard } from '@/app/components/status/WaterIntakeCard';
import { AltitudeMoodCard } from '@/app/components/status/AltitudeMoodCard';
import { StatusSummary } from '@/app/components/status/StatusSummary';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { useStatusData } from '@/app/hooks/useStatusData';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';
import { Header } from '@/app/components/layout/Header';

function StatusTracker() {
  const { statusData, isLoading, error, actions } = useStatusData();

  if (isLoading) {
    return <LoadingSpinner message="Loading your status data..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">
          Error loading status data: {error}
        </p>
        <button 
          onClick={actions.refresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          <div className="grid md:grid-cols-2 gap-6">
            <WaterIntakeCard
              lastWaterIntake={statusData.lastWaterIntake}
              onUpdateWaterIntake={actions.updateWaterIntake}
            />
            <AltitudeMoodCard
              altitude={statusData.altitude}
              onUpdateAltitude={actions.updateAltitude}
            />
          </div>
          <StatusSummary statusData={statusData} />
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ProtectedRoute>
          <StatusTracker />
        </ProtectedRoute>
      </ErrorBoundary>
    </AuthProvider>
  );
}