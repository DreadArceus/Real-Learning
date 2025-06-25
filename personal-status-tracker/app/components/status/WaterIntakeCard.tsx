'use client';

import React, { memo } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatTimeAgo } from '../../lib/utils/dateFormatters';

interface WaterIntakeCardProps {
  lastWaterIntake: string;
  onUpdateWaterIntake?: () => Promise<void>;
  readOnly?: boolean;
}

export const WaterIntakeCard = memo(function WaterIntakeCard({ 
  lastWaterIntake, 
  onUpdateWaterIntake,
  readOnly = false
}: WaterIntakeCardProps) {
  return (
    <Card>
      <CardHeader>💧 Water Intake</CardHeader>
      <CardContent>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last water intake:</p>
          <p className="text-xl font-medium text-gray-900 dark:text-white">
            {formatTimeAgo(lastWaterIntake)}
          </p>
        </div>
        {readOnly || !onUpdateWaterIntake ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              👁️ View-only mode
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {readOnly ? 'Viewing another user\'s data' : 'Admin access required to update'}
            </p>
          </div>
        ) : (
          <Button 
            onClick={onUpdateWaterIntake}
            fullWidth
            aria-label="Update water intake time"
          >
            I just had water! 💦
          </Button>
        )}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Water intake updated: {formatTimeAgo(lastWaterIntake)}
        </div>
      </CardContent>
    </Card>
  );
});