'use client';

import React from 'react';
import { User } from '@/app/lib/api';

interface AdminSelectorProps {
  adminUsers: User[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  isLoading?: boolean;
}

export function AdminSelector({ 
  adminUsers, 
  selectedUserId, 
  onSelectUser, 
  isLoading = false 
}: AdminSelectorProps) {
  if (adminUsers.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-600 dark:text-yellow-400">
          No admin users found. Ask an admin to create an account to track their status.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <label htmlFor="admin-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        View Status for Admin:
      </label>
      <select
        id="admin-select"
        value={selectedUserId || ''}
        onChange={(e) => onSelectUser(e.target.value)}
        disabled={isLoading}
        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select an admin to view their status...</option>
        {adminUsers.map((admin) => (
          <option key={admin.id} value={admin.id.toString()}>
            {admin.username} {admin.lastLogin && `(Last active: ${new Date(admin.lastLogin).toLocaleDateString()})`}
          </option>
        ))}
      </select>
      
      {selectedUserId && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Viewing status data for: {adminUsers.find(u => u.id.toString() === selectedUserId)?.username}
        </div>
      )}
    </div>
  );
}