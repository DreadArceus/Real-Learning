'use client';

import React, { memo, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Slider } from '../ui/Slider';
import { ALTITUDE_CONFIG } from '../../types/status';
import { getAltitudeColor, getAltitudeEmoji } from '../../lib/utils/statusHelpers';
import { useAuth } from '../../contexts/AuthContext';

interface AltitudeMoodCardProps {
  altitude: number | null;
  onUpdateAltitude?: (altitude: number) => Promise<void>;
  readOnly?: boolean;
}

export const AltitudeMoodCard = memo(function AltitudeMoodCard({ 
  altitude, 
  onUpdateAltitude,
  readOnly = false
}: AltitudeMoodCardProps) {
  
  const handleAltitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!readOnly && onUpdateAltitude) {
      onUpdateAltitude(parseInt(e.target.value, 10));
    }
  }, [onUpdateAltitude, readOnly]);

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
            {altitude === null ? 'N/A' : `${altitude}/10`}
          </p>
        </div>
        {readOnly || !onUpdateAltitude ? (
          <div className="space-y-2">
            <Slider
              label="Mood level (1-10)"
              min={ALTITUDE_CONFIG.MIN}
              max={ALTITUDE_CONFIG.MAX}
              value={altitude ?? ALTITUDE_CONFIG.DEFAULT}
              onChange={() => {}} // No-op for view-only
              minLabel="Low 🏊"
              maxLabel="High 🚀"
              aria-valuenow={altitude ?? ALTITUDE_CONFIG.DEFAULT}
              aria-valuemin={ALTITUDE_CONFIG.MIN}
              aria-valuemax={ALTITUDE_CONFIG.MAX}
              aria-valuetext={altitude === null ? 'No mood data recorded (view-only)' : `Mood level ${altitude} out of 10 (view-only)`}
              disabled
            />
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                👁️ View-only mode - {readOnly ? 'Viewing another user\'s data' : 'Admin access required to update'}
              </p>
            </div>
          </div>
        ) : (
          <Slider
            label="Mood level (1-10)"
            min={ALTITUDE_CONFIG.MIN}
            max={ALTITUDE_CONFIG.MAX}
            value={altitude ?? ALTITUDE_CONFIG.DEFAULT}
            onChange={handleAltitudeChange}
            minLabel="Low 🏊"
            maxLabel="High 🚀"
            aria-valuenow={altitude ?? ALTITUDE_CONFIG.DEFAULT}
            aria-valuemin={ALTITUDE_CONFIG.MIN}
            aria-valuemax={ALTITUDE_CONFIG.MAX}
            aria-valuetext={altitude === null ? 'No mood data recorded' : `Mood level ${altitude} out of 10`}
          />
        )}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {altitude === null ? 'No mood data recorded' : `Mood level updated to ${altitude} out of 10`}
        </div>
      </CardContent>
    </Card>
  );
});