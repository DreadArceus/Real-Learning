'use client';

import React, { memo, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Slider } from '../ui/Slider';
import { ALTITUDE_CONFIG } from '../../types/status';
import { getAltitudeColor, getAltitudeEmoji } from '../../lib/utils/statusHelpers';
import { AdminOnlyComponent } from '../auth/RoleBasedComponent';
import { useAuth } from '../../contexts/AuthContext';

interface AltitudeMoodCardProps {
  altitude: number;
  onUpdateAltitude: (altitude: number) => Promise<void>;
}

export const AltitudeMoodCard = memo(function AltitudeMoodCard({ 
  altitude, 
  onUpdateAltitude 
}: AltitudeMoodCardProps) {
  const { isAdmin } = useAuth();
  
  const handleAltitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAdmin) {
      onUpdateAltitude(parseInt(e.target.value, 10));
    }
  }, [onUpdateAltitude, isAdmin]);

  const emoji = getAltitudeEmoji(altitude);
  const colorClass = getAltitudeColor(altitude);

  return (
    <Card>
      <CardHeader>
        {emoji} Altitude (Mood)
      </CardHeader>
      <CardContent>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Current altitude:</p>
          <p className={`text-4xl font-bold ${colorClass}`}>
            {altitude}/10
          </p>
        </div>
        <AdminOnlyComponent
          fallback={
            <div className="space-y-2">
              <Slider
                label="Mood level (1-10)"
                min={ALTITUDE_CONFIG.MIN}
                max={ALTITUDE_CONFIG.MAX}
                value={altitude}
                onChange={() => {}} // No-op for view-only
                minLabel="Low 🏊"
                maxLabel="High 🚀"
                aria-valuenow={altitude}
                aria-valuemin={ALTITUDE_CONFIG.MIN}
                aria-valuemax={ALTITUDE_CONFIG.MAX}
                aria-valuetext={`Mood level ${altitude} out of 10 (view-only)`}
                disabled
              />
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  👁️ View-only mode - Admin access required to update
                </p>
              </div>
            </div>
          }
        >
          <Slider
            label="Mood level (1-10)"
            min={ALTITUDE_CONFIG.MIN}
            max={ALTITUDE_CONFIG.MAX}
            value={altitude}
            onChange={handleAltitudeChange}
            minLabel="Low 🏊"
            maxLabel="High 🚀"
            aria-valuenow={altitude}
            aria-valuemin={ALTITUDE_CONFIG.MIN}
            aria-valuemax={ALTITUDE_CONFIG.MAX}
            aria-valuetext={`Mood level ${altitude} out of 10`}
          />
        </AdminOnlyComponent>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Mood level updated to {altitude} out of 10
        </div>
      </CardContent>
    </Card>
  );
});