'use client';

import React, { memo, useMemo } from 'react';
import { Card } from '../ui/Card';
import { StatusData } from '../../types/status';
import { getHydrationStatus, getMoodLevel, getAltitudeColor } from '../../lib/utils/statusHelpers';
import { formatDateTime } from '../../lib/utils/dateFormatters';

interface StatusSummaryProps {
  statusData: StatusData;
}

export const StatusSummary = memo(function StatusSummary({ statusData }: StatusSummaryProps) {
  const hydrationStatus = useMemo(() => 
    getHydrationStatus(statusData.lastWaterIntake || ''), 
    [statusData.lastWaterIntake]
  );

  const moodLevel = useMemo(() => 
    getMoodLevel(statusData.altitude), 
    [statusData.altitude]
  );

  const moodColorClass = useMemo(() => 
    getAltitudeColor(statusData.altitude), 
    [statusData.altitude]
  );

  return (
    <Card>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Status Summary
      </h3>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Hydration Status: </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {hydrationStatus}
          </span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Mood Level: </span>
          <span className={`font-medium ${moodColorClass}`}>
            {moodLevel}
          </span>
        </div>
      </div>
      {statusData.lastUpdated && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Last updated: {formatDateTime(statusData.lastUpdated)}
        </p>
      )}
    </Card>
  );
});