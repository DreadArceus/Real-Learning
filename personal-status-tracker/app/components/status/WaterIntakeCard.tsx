'use client';

import React, { memo } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatTimeAgo } from '../../lib/utils/dateFormatters';
import { AdminOnlyComponent } from '../auth/RoleBasedComponent';

interface WaterIntakeCardProps {
  lastWaterIntake: string;
  onUpdateWaterIntake: () => Promise<void>;
}

export const WaterIntakeCard = memo(function WaterIntakeCard({ 
  lastWaterIntake, 
  onUpdateWaterIntake 
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
        <AdminOnlyComponent
          fallback={
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                👁️ View-only mode
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Admin access required to update
              </p>
            </div>
          }
        >
          <Button 
            onClick={onUpdateWaterIntake}
            fullWidth
            aria-label="Update water intake time"
          >
            I just had water! 💦
          </Button>
        </AdminOnlyComponent>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Water intake updated: {formatTimeAgo(lastWaterIntake)}
        </div>
      </CardContent>
    </Card>
  );
});