'use client';

import React from 'react';
import { WaterIntakeCard } from '@/app/components/status/WaterIntakeCard';
import { AltitudeMoodCard } from '@/app/components/status/AltitudeMoodCard';
import { StatusSummary } from '@/app/components/status/StatusSummary';
import { AdminSelector } from '@/app/components/status/AdminSelector';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { useStatusWithUser } from '@/app/hooks/useStatusWithUser';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';
import { Header } from '@/app/components/layout/Header';

function StatusTracker() {
  const { user } = useAuth();
  const { 
    statusData, 
    isLoading, 
    error, 
    selectedUserId, 
    adminUsers, 
    canEdit, 
    actions 
  } = useStatusWithUser();

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
          {/* Show admin selector for viewers */}
          {user?.role === 'viewer' && (
            <AdminSelector
              adminUsers={adminUsers}
              selectedUserId={selectedUserId}
              onSelectUser={actions.selectUser}
              isLoading={isLoading}
            />
          )}
          
          {/* Show content only if viewer has selected an admin or user is admin */}
          {(user?.role === 'admin' || (user?.role === 'viewer' && selectedUserId)) && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <WaterIntakeCard
                  lastWaterIntake={statusData.lastWaterIntake || ''}
                  onUpdateWaterIntake={canEdit ? actions.updateWaterIntake : undefined}
                  readOnly={!canEdit}
                />
                <AltitudeMoodCard
                  altitude={statusData.altitude}
                  onUpdateAltitude={canEdit ? actions.updateAltitude : undefined}
                  readOnly={!canEdit}
                />
              </div>
              <StatusSummary statusData={statusData} />
            </>
          )}
          
          {/* Message for viewers who haven't selected an admin */}
          {user?.role === 'viewer' && !selectedUserId && adminUsers.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
              <p className="text-blue-600 dark:text-blue-400 text-lg">
                Please select an admin above to view their status data.
              </p>
            </div>
          )}
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