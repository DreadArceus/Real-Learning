'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { StatusData, ALTITUDE_CONFIG } from '@/app/types/status';
import { apiService, User } from '@/app/lib/api';
import { validateAltitude } from '@/app/lib/utils/statusHelpers';
import { useAuth } from '@/app/contexts/AuthContext';

const initialStatusData: StatusData = {
  lastWaterIntake: '',
  altitude: ALTITUDE_CONFIG.DEFAULT,
  lastUpdated: ''
};

export function useStatusWithUser() {
  const { user } = useAuth();
  const [statusData, setStatusData] = useState<StatusData>(initialStatusData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Load admin users for viewers to select from
  const loadAdminUsers = useCallback(async () => {
    if (user?.role === 'viewer') {
      try {
        const admins = await apiService.getAdminUsers();
        setAdminUsers(admins);
        // Auto-select first admin if no selection made
        if (admins.length > 0 && !selectedUserId) {
          setSelectedUserId(admins[0].id.toString());
        }
      } catch (err) {
        // Silently handle admin loading error
      }
    }
  }, [user?.role, selectedUserId]);

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For admins, load their own data (no userId needed)
      // For viewers, load the selected admin's data
      const userId = user?.role === 'viewer' ? selectedUserId : undefined;
      
      if (user?.role === 'viewer' && !userId) {
        setStatusData(initialStatusData);
        return;
      }
      
      const data = await apiService.getLatestStatus(userId || undefined);
      if (data) {
        setStatusData(data);
      } else {
        setStatusData(initialStatusData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
      setStatusData(initialStatusData);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role, selectedUserId]);

  useEffect(() => {
    if (user) {
      loadAdminUsers();
    }
  }, [user, loadAdminUsers]);

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user, loadStatus]);

  const updateWaterIntake = useCallback(async () => {
    if (user?.role !== 'admin') {
      setError('Only admins can update status data');
      return;
    }

    try {
      setError(null);
      const now = new Date().toISOString();
      
      // Check if we have any existing status data (not just water intake)
      if (statusData.lastUpdated) {
        const updated = await apiService.updateStatus({ lastWaterIntake: now });
        setStatusData(updated);
      } else {
        const created = await apiService.createStatus({
          lastWaterIntake: now,
          altitude: statusData.altitude || 5,
          lastUpdated: now
        });
        setStatusData(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update water intake');
    }
  }, [statusData, user?.role]);

  const updateAltitude = useCallback(async (newAltitude: number) => {
    if (user?.role !== 'admin') {
      setError('Only admins can update status data');
      return;
    }

    try {
      setError(null);
      const validatedAltitude = validateAltitude(newAltitude);
      
      // Check if we have any existing status data (not just water intake)
      if (statusData.lastUpdated) {
        const updated = await apiService.updateStatus({ altitude: validatedAltitude });
        setStatusData(updated);
      } else {
        // For first-time status creation, preserve the "Never" state for water intake
        const created = await apiService.createStatus({
          lastWaterIntake: null,
          altitude: validatedAltitude,
          lastUpdated: new Date().toISOString()
        });
        setStatusData(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update altitude');
    }
  }, [statusData, user?.role]);

  const resetData = useCallback(async () => {
    if (user?.role !== 'admin') {
      setError('Only admins can reset status data');
      return;
    }

    try {
      setError(null);
      await apiService.deleteAllStatus();
      setStatusData(initialStatusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset data');
    }
  }, [user?.role]);

  const selectUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  return useMemo(() => ({
    statusData,
    isLoading,
    error,
    selectedUserId,
    adminUsers,
    canEdit: user?.role === 'admin',
    actions: {
      updateWaterIntake,
      updateAltitude,
      resetData,
      refresh: loadStatus,
      selectUser
    }
  }), [
    statusData, 
    isLoading, 
    error, 
    selectedUserId, 
    adminUsers, 
    user?.role,
    updateWaterIntake, 
    updateAltitude, 
    resetData, 
    loadStatus,
    selectUser
  ]);
}