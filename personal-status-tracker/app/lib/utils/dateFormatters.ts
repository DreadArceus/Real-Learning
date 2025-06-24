import { TIME_UNITS } from '@/app/lib/constants';

export function formatTimeAgo(isoString: string): string {
  if (!isoString) return 'Never';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return 'Invalid date';
    
    const diffMins = Math.floor(diffMs / TIME_UNITS.MINUTE);
    const diffHours = Math.floor(diffMs / TIME_UNITS.HOUR);
    const diffDays = Math.floor(diffMs / TIME_UNITS.DAY);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid date';
  }
}

export function calculateHoursSince(isoString: string): number {
  if (!isoString) return Infinity;
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return Infinity;
    
    const now = new Date();
    return (now.getTime() - date.getTime()) / TIME_UNITS.HOUR;
  } catch (error) {
    console.error('Error calculating hours:', error);
    return Infinity;
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}