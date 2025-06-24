'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

interface RoleBasedComponentProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'viewer';
  adminOnly?: boolean;
  fallback?: ReactNode;
}

export function RoleBasedComponent({ 
  children, 
  requiredRole, 
  adminOnly = false, 
  fallback = null 
}: RoleBasedComponentProps) {
  const { user, isAdmin } = useAuth();

  // If adminOnly is true, only show for admin users
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>;
  }

  // If requiredRole is specified, check if user has that role
  if (requiredRole && user?.role !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnlyComponent({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedComponent adminOnly fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
}

export function ViewerOnlyComponent({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedComponent requiredRole="viewer" fallback={fallback}>
      {children}
    </RoleBasedComponent>
  );
}