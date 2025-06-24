'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { StatusData, ALTITUDE_CONFIG } from '@/app/types/status';
import { apiService } from '@/app/lib/api';
import { validateAltitude } from '@/app/lib/utils/statusHelpers';

const initialStatusData: StatusData = {
  lastWaterIntake: '',
  altitude: ALTITUDE_CONFIG.DEFAULT,
  lastUpdated: ''
};

export function useStatusData() {
  const [statusData, setStatusData] = useState<StatusData>(initialStatusData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getLatestStatus();
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
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const updateWaterIntake = useCallback(async () => {
    try {
      setError(null);
      const now = new Date().toISOString();
      
      if (statusData.lastWaterIntake) {
        const updated = await apiService.updateStatus({ lastWaterIntake: now });
        setStatusData(updated);
      } else {
        const created = await apiService.createStatus({
          lastWaterIntake: now,
          altitude: statusData.altitude,
          lastUpdated: now
        });
        setStatusData(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update water intake');
    }
  }, [statusData]);

  const updateAltitude = useCallback(async (newAltitude: number) => {
    try {
      setError(null);
      const validatedAltitude = validateAltitude(newAltitude);
      const now = new Date().toISOString();
      
      if (statusData.lastWaterIntake) {
        const updated = await apiService.updateStatus({ altitude: validatedAltitude });
        setStatusData(updated);
      } else {
        const created = await apiService.createStatus({
          lastWaterIntake: now,
          altitude: validatedAltitude,
          lastUpdated: now
        });
        setStatusData(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update altitude');
    }
  }, [statusData]);

  const resetData = useCallback(async () => {
    try {
      setError(null);
      await apiService.deleteAllStatus();
      setStatusData(initialStatusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset data');
    }
  }, []);

  return useMemo(() => ({
    statusData,
    isLoading,
    error,
    actions: {
      updateWaterIntake,
      updateAltitude,
      resetData,
      refresh: loadStatus
    }
  }), [statusData, isLoading, error, updateWaterIntake, updateAltitude, resetData, loadStatus]);
}